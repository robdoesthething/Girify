import {
  createQuest as dbCreateQuest,
  deleteQuest as dbDeleteQuest,
  getAllQuests as dbGetQuests,
  updateQuest as dbUpdateQuest,
} from '../../services/database';
import { QuestRow } from '../../types/supabase';
import { requireAdmin } from '../auth';
import { logger } from '../logger';

export interface Quest {
  id: string; // Internal app usage might treat ID as string, but DB has number. We should verify usage.
  title: string;
  description: string;
  criteriaType: 'find_street' | 'score_attack' | 'district_explorer' | 'login_streak';
  criteriaValue: number | string;
  rewardGiuros: number;
  activeDate?: string; // e.g., "2024-02-15"
  isActive: boolean;
  createdAt: number;
}

// Validation constants
const MAX_REWARD = 10000;
const MIN_REWARD = 0;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Validate quest data
 */
const validateQuest = (quest: Partial<Quest>): void => {
  if (quest.rewardGiuros !== undefined) {
    if (quest.rewardGiuros < MIN_REWARD || quest.rewardGiuros > MAX_REWARD) {
      throw new Error(`rewardGiuros must be between ${MIN_REWARD} and ${MAX_REWARD}`);
    }
  }
  if (quest.title !== undefined && quest.title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Quest title too long (max ${MAX_TITLE_LENGTH} chars)`);
  }
  if (quest.description !== undefined && quest.description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Quest description too long (max ${MAX_DESCRIPTION_LENGTH} chars)`);
  }
};

/**
 * Get all quests
 * @returns Promise resolving to list of quests
 */
export const getQuests = async (): Promise<Quest[]> => {
  try {
    const rows = await dbGetQuests();
    return rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      description: row.description || '',

      criteriaType: row.criteria_type as any,
      criteriaValue: row.criteria_value || '',
      rewardGiuros: row.reward_giuros ?? 0,
      activeDate: row.active_date || undefined,
      isActive: row.is_active ?? false,
      createdAt: new Date(row.created_at || 0).getTime(),
    }));
  } catch (error) {
    logger.error('Error fetching quests', { error });
    return [];
  }
};

/**
 * Create a new quest
 * @param quest - The quest data (excluding ID)
 * @returns Promise resolving to the new quest ID
 */
export const createQuest = async (quest: Omit<Quest, 'id' | 'createdAt'>): Promise<string> => {
  // Security: Verify admin before write
  await requireAdmin();

  // Validation
  validateQuest(quest);

  try {
    const row: Omit<QuestRow, 'id' | 'created_at'> = {
      title: quest.title,
      description: quest.description,
      criteria_type: quest.criteriaType,
      criteria_value: String(quest.criteriaValue),
      reward_giuros: quest.rewardGiuros,
      active_date: quest.activeDate || null,
      is_active: quest.isActive,
    };

    const result = await dbCreateQuest(row);
    if (!result) {
      throw new Error('Failed to create quest');
    }
    return result.id.toString();
  } catch (error) {
    logger.error('Error creating quest', { error });
    throw error;
  }
};

/**
 * Update a quest
 * @param id - The ID of the quest to update
 * @param updates - The updates to apply
 * @returns Promise resolving when update is complete
 */
export const updateQuest = async (id: string, updates: Partial<Quest>): Promise<void> => {
  // Security: Verify admin before write
  await requireAdmin();

  // Validation
  validateQuest(updates);

  try {
    const dbUpdates: Partial<QuestRow> = {};
    if (updates.title) {
      dbUpdates.title = updates.title;
    }
    if (updates.description) {
      dbUpdates.description = updates.description;
    }
    if (updates.criteriaType) {
      dbUpdates.criteria_type = updates.criteriaType;
    }
    if (updates.criteriaValue) {
      dbUpdates.criteria_value = String(updates.criteriaValue);
    }
    if (updates.rewardGiuros !== undefined) {
      dbUpdates.reward_giuros = updates.rewardGiuros;
    }
    if (updates.activeDate !== undefined) {
      dbUpdates.active_date = updates.activeDate;
    } // can be null/undefined logic
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
    }

    const numericId = parseInt(id, 10);
    await dbUpdateQuest(numericId, dbUpdates);
  } catch (error) {
    logger.error('Error updating quest', { error });
    throw error;
  }
};

/**
 * Delete a quest
 * @param id - The ID of the quest to delete
 * @returns Promise resolving when deleted
 */
export const deleteQuest = async (id: string): Promise<void> => {
  // Security: Verify admin before write
  await requireAdmin();

  try {
    const numericId = parseInt(id, 10);
    await dbDeleteQuest(numericId);
  } catch (error) {
    logger.error('Error deleting quest', { error });
    throw error;
  }
};
