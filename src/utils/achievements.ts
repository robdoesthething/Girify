import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { ACHIEVEMENT_BADGES, Achievement } from '../data/achievements';
import { db } from '../firebase';
import { requireAdmin } from './auth';
import { logger } from './logger';

// Simple in-memory cache
let achievementsCache: Achievement[] | null = null;
let cacheTimestamp = 0;
// eslint-disable-next-line no-magic-numbers
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetch all achievements from Firestore, merged with local static data
 */
export const getAllAchievements = async (forceRefresh = false): Promise<Achievement[]> => {
  const now = Date.now();
  if (!forceRefresh) {
    if (achievementsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return achievementsCache;
    }
  }

  const firestoreItems: Achievement[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'achievements'));
    querySnapshot.forEach(docSnapshot => {
      // @ts-ignore
      firestoreItems.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });
  } catch (error) {
    logger.error('Error fetching achievements from Firestore', { error });
    // Fallback to strict local usage if completely failed
  }

  // Merge: Firestore overrides local static rules with same ID
  const itemMap = new Map<string, Achievement>();

  // 1. Load static base
  ACHIEVEMENT_BADGES.forEach(item => itemMap.set(item.id, item));

  // 2. Override/Append with Firestore
  firestoreItems.forEach(item => itemMap.set(item.id, item));

  const allItems = Array.from(itemMap.values());

  achievementsCache = allItems;
  cacheTimestamp = now;
  return allItems;
};

/**
 * Update an achievement rule
 */
export const updateAchievement = async (
  id: string,
  updates: Partial<Achievement>
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Security: Verify admin before write
    await requireAdmin();

    await setDoc(doc(db, 'achievements', id), updates, { merge: true });
    achievementsCache = null; // Invalidate cache
    return { success: true };
  } catch (error) {
    logger.error('Error updating achievement', { error });
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Create a new achievement
 */
export const createAchievement = async (
  itemData: Achievement
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Security: Verify admin before write
    await requireAdmin();

    await setDoc(doc(db, 'achievements', itemData.id), itemData);
    achievementsCache = null;
    return { success: true };
  } catch (error) {
    logger.error('Error creating achievement', { error });
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Delete an achievement
 */
export const deleteAchievement = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Security: Verify admin before write
    await requireAdmin();

    await deleteDoc(doc(db, 'achievements', id));
    achievementsCache = null;
    return { success: true };
  } catch (error) {
    logger.error('Error deleting achievement', { error });
    return { success: false, error: (error as Error).message };
  }
};
