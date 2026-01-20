import { ACHIEVEMENT_BADGES, Achievement } from '../data/achievements';
import {
  createAchievement as dbCreateAchievement,
  deleteAchievement as dbDeleteAchievement,
  getAchievements as dbGetAchievements,
  updateAchievement as dbUpdateAchievement,
} from '../services/database';
import { AchievementRow } from '../types/supabase';
import { requireAdmin } from './auth';
import { logger } from './logger';

// Simple in-memory cache
let achievementsCache: Achievement[] | null = null;
let cacheTimestamp = 0;
// eslint-disable-next-line no-magic-numbers
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetch all achievements from Supabase, merged with local static data
 */
export const getAllAchievements = async (forceRefresh = false): Promise<Achievement[]> => {
  const now = Date.now();
  if (!forceRefresh) {
    if (achievementsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return achievementsCache;
    }
  }

  const dbItems: Achievement[] = [];
  try {
    const rows = await dbGetAchievements();
    rows.forEach(row => {
      dbItems.push({
        id: row.id,
        name: row.name,
        description: row.description || '',
        emoji: row.emoji || '',
        criteria: row.criteria || '',
        rarity: (row.rarity as any) || 'common',
        category: (row.category as any) || 'general',
        unlockCondition: (row.unlock_condition as any) || undefined,
      });
    });
  } catch (error) {
    logger.error('Error fetching achievements from DB', { error });
    // Fallback to strict local usage if completely failed
  }

  // Merge: DB overrides local static rules with same ID
  const itemMap = new Map<string, Achievement>();

  // 1. Load static base
  ACHIEVEMENT_BADGES.forEach(item => itemMap.set(item.id, item));

  // 2. Override/Append with DB
  dbItems.forEach(item => itemMap.set(item.id, item));

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

    const dbUpdates: Partial<AchievementRow> = {};
    if (updates.name) {
      dbUpdates.name = updates.name;
    }
    if (updates.description) {
      dbUpdates.description = updates.description;
    }
    if (updates.emoji) {
      dbUpdates.emoji = updates.emoji;
    }
    if (updates.criteria) {
      dbUpdates.criteria = updates.criteria;
    }
    if (updates.rarity) {
      dbUpdates.rarity = updates.rarity;
    }
    if (updates.category) {
      dbUpdates.category = updates.category;
    }
    if (updates.unlockCondition) {
      dbUpdates.unlock_condition = updates.unlockCondition as any;
    }

    const success = await dbUpdateAchievement(id, dbUpdates);

    if (success) {
      achievementsCache = null; // Invalidate cache
      return { success: true };
    }
    return { success: false, error: 'Update failed' };
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

    const row: AchievementRow = {
      id: itemData.id,
      name: itemData.name,
      description: itemData.description,
      emoji: itemData.emoji,
      criteria: itemData.criteria,
      rarity: itemData.rarity,
      category: itemData.category,
      unlock_condition: itemData.unlockCondition || null,
      is_active: true,
      sort_order: 0, // Default
      created_at: new Date().toISOString(),
    };

    const success = await dbCreateAchievement(row);

    if (success) {
      achievementsCache = null;
      return { success: true };
    }
    return { success: false, error: 'Creation failed' };
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

    const success = await dbDeleteAchievement(id);
    if (success) {
      achievementsCache = null;
      return { success: true };
    }
    return { success: false, error: 'Delete failed' };
  } catch (error) {
    logger.error('Error deleting achievement', { error });
    return { success: false, error: (error as Error).message };
  }
};
