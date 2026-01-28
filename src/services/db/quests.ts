/**
 * Quests Database Service
 *
 * Handles fetching daily quests and claiming rewards.
 */

import { QuestRow, UserQuestRow } from '../../types/supabase';
import { normalizeUsername } from '../../utils/format';
import { createLogger } from '../../utils/logger';
import { supabase } from '../supabase';
import { executeQuery } from './utils';

const logger = createLogger('DB:Quests');

export interface QuestWithProgress extends QuestRow {
  progress?: UserQuestRow;
}

/**
 * Fetch all active quests for today.
 * Also fetches the user's progress if a userId is provided.
 */
export async function getDailyQuests(userId?: string): Promise<QuestWithProgress[]> {
  try {
    // const today = new Date().toISOString().split('T')[0];

    // 1. Get active quests
    // For now, we assume quests are active if is_active is true.
    // In a real daily system, we might filter by active_date = today OR a generic pool.
    // Let's assume generic pool for now + specific daily ones.
    const questsPromise = supabase
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });

    const quests = await executeQuery<QuestRow[]>(questsPromise, 'getDailyQuests:fetch');

    if (!quests || quests.length === 0) {
      return [];
    }

    if (!userId) {
      return quests;
    }

    const cleanUserId = normalizeUsername(userId);

    // 2. Get user progress
    // We can't join directly easily with Supabase client unless we set up foreign keys in the query builder perfectly.
    // A simple second query is robust.
    const questIds = quests.map(q => q.id);
    const progressPromise = (supabase.from('user_quests' as any) as any)
      .select('*')
      .eq('username', cleanUserId)
      .in('quest_id', questIds);

    const userProgress = await executeQuery<UserQuestRow[]>(
      progressPromise,
      'getDailyQuests:progress'
    );
    const progressMap = new Map<number, UserQuestRow>();

    if (userProgress) {
      userProgress.forEach(p => progressMap.set(p.quest_id, p));
    }

    // 3. Merge
    return quests.map(q => ({
      ...q,
      progress: progressMap.get(q.id),
    }));
  } catch (error) {
    logger.error('Failed to get daily quests', error);
    return [];
  }
}

/**
 * Claims a quest reward.
 * Verifies validity and updates user balance + quest status.
 */
export async function claimQuestReward(
  questId: number,
  userId: string
): Promise<{ success: boolean; error?: string; reward?: number }> {
  try {
    const cleanUserId = normalizeUsername(userId);

    // 1. Fetch quest and progress
    const [quests, progressList] = await Promise.all([
      executeQuery<QuestRow[]>(
        supabase.from('quests').select('*').eq('id', questId),
        'claimReward:quest'
      ),
      executeQuery<UserQuestRow[]>(
        (supabase.from('user_quests' as any) as any)
          .select('*')
          .eq('username', cleanUserId)
          .eq('quest_id', questId),
        'claimReward:progress'
      ),
    ]);

    const quest = quests?.[0];
    const progress = progressList?.[0];

    if (!quest) {
      return { success: false, error: 'Quest not found' };
    }

    // Verify completion
    // In a robust system, we double-check criteria here.
    // For now, we rely on the client/game logic having updated 'is_completed' to true,
    // OR the progress row simply exists and we trust 'is_completed'.
    // NOTE: If logic updates is_completed, we just check that.
    if (!progress || !progress.is_completed) {
      return { success: false, error: 'Quest not completed' };
    }

    if (progress.is_claimed) {
      return { success: false, error: 'Reward already claimed' };
    }

    // 2. Transact (RPC would be better, but doing client-side for now)
    // Update is_claimed = true
    const { error: updateError } = await (supabase.from('user_quests' as any) as any)
      .update({ is_claimed: true } as any) // Type assertion due to manual type
      .eq('id', progress.id);

    if (updateError) {
      logger.error('Failed to mark quest claimed', updateError);
      return { success: false, error: 'Failed to claim reward' };
    }

    // 3. Add Giuros
    if (quest.reward_giuros && quest.reward_giuros > 0) {
      // Fetch current user to get current giuros? Or just increment using RPC?
      // We don't have a simple "increment" RPC without custom SQL functioning.
      // Let's read-modify-write for now (optimistic locking not critical for small game currency yet).
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('giuros')
        .eq('username', cleanUserId)
        .single();

      if (userError || !userData) {
        // Warning: Claimed but logic failed to add currency.
        // Should rollback claim?
        // Retrying won't help if user issue.
        logger.error('Failed to add giuros', userError);
        return { success: true, reward: 0, error: 'Claimed, but failed to add currency' };
      }

      const newBalance = (userData.giuros || 0) + quest.reward_giuros;
      await supabase.from('users').update({ giuros: newBalance }).eq('username', cleanUserId);

      return { success: true, reward: quest.reward_giuros };
    }

    return { success: true, reward: 0 };
  } catch (error) {
    logger.error('Exception in claimQuestReward', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Updates quest progress.
 * Should be called when game events happen.
 */
export async function updateQuestProgress(
  userId: string,
  questId: number,
  progressValue: number,
  isCompleted: boolean
): Promise<void> {
  try {
    const cleanUserId = normalizeUsername(userId);

    // Upsert progress
    const { error } = await (supabase.from('user_quests' as any) as any).upsert(
      {
        username: cleanUserId,
        quest_id: questId,
        progress: progressValue,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      } as any, // Type assertion
      { onConflict: 'username,quest_id' }
    );

    if (error) {
      logger.error('Failed to update quest progress', error);
    }
  } catch (err) {
    logger.error('Exception updateQuestProgress', err);
  }
}

/**
 * Checks and updates quest progress based on game results.
 */
export async function checkAndProgressQuests(
  userId: string,
  gameState: { score: number; quizResults: any[]; quizStreets: any[] }
): Promise<string[]> {
  try {
    const cleanUserId = normalizeUsername(userId);
    const completedQuests: string[] = [];

    // 1. Get user's active daily quests
    const quests = await getDailyQuests(cleanUserId); // Passes normalized
    if (!quests || quests.length === 0) {
      return [];
    }

    // 2. Evaluate each quest
    for (const quest of quests) {
      if (quest.progress?.is_completed) {
        continue;
      }

      const currentProgress = quest.progress?.progress || 0;
      let isCompleted = false;
      let targetValue = 0;
      let newProgress = currentProgress;

      // Parse target
      if (quest.criteria_value) {
        targetValue = parseInt(quest.criteria_value, 10) || 1;
      }

      switch (quest.criteria_type) {
        case 'score_attack':
          // Accumulate score or Single game high score?
          // If description says "Get X points", usually cumulative or single.
          // Let's assume cumulative for "daily" quests unless specified.
          // BUT given it's "Daily Challenge", maybe it's "Get X points in one game"?
          // For simplicity/safey, let's treat it as cumulative addition of the current game score.
          // If we wanted "High Score", we'd check if gameState.score >= targetValue.
          // Let's assume CUMULATIVE for specific quests like "Earn 5000 points today".
          newProgress += gameState.score;
          break;

        case 'find_street': {
          // Check if any correctly answered street matches the target value (street name)
          // Target value would be the street name or ID.
          // We check quizResults for status='correct'
          const foundStreets = gameState.quizResults.filter(
            r =>
              r.status === 'correct' &&
              r.street?.name?.toLowerCase() === quest.criteria_value?.toLowerCase()
          );
          if (foundStreets.length > 0) {
            newProgress += foundStreets.length;
          }
          break;
        }

        case 'district_explorer': {
          // Count correct answers in distinct districts? Or just correct answers in a specific district?
          // Assuming criteria_value is the district name (e.g. "Eixample")
          const districtMatches = gameState.quizResults.filter(
            r =>
              r.status === 'correct' &&
              r.street?.district?.toLowerCase() === quest.criteria_value?.toLowerCase()
          );
          if (districtMatches.length > 0) {
            newProgress += districtMatches.length;
          }
          break;
        }

        default:
          continue;
      }

      // Cap progress
      if (newProgress >= targetValue) {
        newProgress = targetValue;
        isCompleted = true;
      }

      // Update if changed
      if (newProgress !== currentProgress || isCompleted) {
        await updateQuestProgress(cleanUserId, quest.id, newProgress, isCompleted);
        if (isCompleted) {
          completedQuests.push(quest.title);
        }
      }
    }
    return completedQuests;
  } catch (error) {
    logger.error('Error checking quest progress', error);
    return [];
  }
}
