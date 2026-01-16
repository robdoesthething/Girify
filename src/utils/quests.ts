import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { requireAdmin } from './auth';
import { logger } from './logger';

export interface Quest {
  id: string;
  title: string;
  description: string;
  criteriaType: 'find_street' | 'score_attack' | 'district_explorer' | 'login_streak';
  criteriaValue: number | string;
  rewardGiuros: number;
  activeDate?: string; // e.g., "2024-02-15" - if set, only active on this day
  isActive: boolean;
  createdAt: number;
}

const QUESTS_COLLECTION = 'quests';

// Validation constants
const MAX_REWARD = 10000;
const MIN_REWARD = 0;

/**
 * Validate quest data
 */
const validateQuest = (quest: Partial<Quest>): void => {
  if (quest.rewardGiuros !== undefined) {
    if (quest.rewardGiuros < MIN_REWARD || quest.rewardGiuros > MAX_REWARD) {
      throw new Error(`rewardGiuros must be between ${MIN_REWARD} and ${MAX_REWARD}`);
    }
  }
  if (quest.title !== undefined && quest.title.length > 100) {
    throw new Error('Quest title too long (max 100 chars)');
  }
  if (quest.description !== undefined && quest.description.length > 500) {
    throw new Error('Quest description too long (max 500 chars)');
  }
};

export const getQuests = async (): Promise<Quest[]> => {
  try {
    const q = query(collection(db, QUESTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as Quest);
  } catch (error) {
    logger.error('Error fetching quests', { error });
    return [];
  }
};

export const createQuest = async (quest: Omit<Quest, 'id' | 'createdAt'>): Promise<string> => {
  // Security: Verify admin before write
  await requireAdmin();

  // Validation
  validateQuest(quest);

  try {
    const docRef = await addDoc(collection(db, QUESTS_COLLECTION), {
      ...quest,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    logger.error('Error creating quest', { error });
    throw error;
  }
};

export const updateQuest = async (id: string, updates: Partial<Quest>): Promise<void> => {
  // Security: Verify admin before write
  await requireAdmin();

  // Validation
  validateQuest(updates);

  try {
    await updateDoc(doc(db, QUESTS_COLLECTION, id), updates);
  } catch (error) {
    logger.error('Error updating quest', { error });
    throw error;
  }
};

export const deleteQuest = async (id: string): Promise<void> => {
  // Security: Verify admin before write
  await requireAdmin();

  try {
    await deleteDoc(doc(db, QUESTS_COLLECTION, id));
  } catch (error) {
    logger.error('Error deleting quest', { error });
    throw error;
  }
};
