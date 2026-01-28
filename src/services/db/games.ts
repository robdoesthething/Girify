/**
 * Game Results Database Operations
 *
 * Leaderboards, game history, and district scores.
 */

import type { GameResultRow } from '../../types/supabase';
import { GAME } from '../../utils/constants';
import { getUTCStartOfDay, getUTCStartOfMonth, getUTCStartOfWeek } from '../../utils/date';
import { normalizeUsername } from '../../utils/format';
import { createLogger } from '../../utils/logger';
import { supabase } from '../supabase';
import { executeQuery } from './utils';

const logger = createLogger('DB:Games');

// ============================================================================
// GAME RESULTS / LEADERBOARD
// ============================================================================

export interface GameResultData {
  user_id: string | null;
  score: number;
  time_taken: number;
  correct_answers: number;
  question_count: number;
  played_at: string;
  platform: string;
  is_bonus: boolean;
}

/**
 * Saves a game result to the database.
 * Handles username normalization.
 */
export async function insertGameResult(
  data: GameResultData
): Promise<{ success: boolean; error?: unknown }> {
  // Ensure username is normalized if present
  const payload = {
    ...data,
    user_id: data.user_id ? normalizeUsername(data.user_id) : null,
  };

  const { error } = await supabase.from('game_results').insert(payload);

  if (error) {
    logger.error('insertGameResult error:', error.message);
    return { success: false, error };
  }
  return { success: true };
}

export async function getLeaderboardScores(
  period: 'all' | 'daily' | 'weekly' | 'monthly',
  limit = 100
): Promise<GameResultRow[]> {
  // Start with base query - apply filters first, then order and limit
  let query = supabase.from('game_results').select('*');

  const now = new Date();

  // ============================================================================

  // Apply period filters first to reduce dataset before ordering/limiting
  if (period === 'daily') {
    query = query.gte('played_at', getUTCStartOfDay(now));
  } else if (period === 'weekly') {
    query = query.gte('played_at', getUTCStartOfWeek(now));
  } else if (period === 'monthly') {
    query = query.gte('played_at', getUTCStartOfMonth(now));
  }

  // Apply ordering and limit AFTER filtering to ensure correct results

  const data = await executeQuery<GameResultRow[]>(
    query.order('score', { ascending: false }).limit(limit * GAME.LEADERBOARD_FETCH_MULTIPLIER),
    'getLeaderboardScores'
  );

  return data || [];
}

export async function getUserGameHistory(username: string, limit = 30): Promise<GameResultRow[]> {
  const normalizedUsername = normalizeUsername(username);

  const data = await executeQuery<GameResultRow[]>(
    supabase
      .from('game_results')
      .select('*')
      .eq('user_id', normalizedUsername)
      .order('played_at', { ascending: false })
      .limit(limit),
    'getUserGameHistory'
  );

  return data || [];
}

// ============================================================================
// DISTRICTS
// ============================================================================

export async function getDistricts(): Promise<
  Array<{ id: string; name: string; team_name: string | null; score: number | null }>
> {
  const data = await executeQuery<
    Array<{ id: string; name: string; team_name: string | null; score: number | null }>
  >(
    supabase
      .from('districts')
      .select('id, name, team_name, score')
      .order('score', { ascending: false }),
    'getDistricts'
  );

  return data || [];
}

export async function updateDistrictScore(
  districtId: string,
  scoreToAdd: number
): Promise<boolean> {
  const district = await executeQuery<{ score: number }>(
    supabase.from('districts').select('score').eq('id', districtId).single(),
    'updateDistrictScore:fetch'
  );

  if (!district) {
    return false;
  }

  const { error } = await supabase
    .from('districts')
    .update({ score: (district.score ?? 0) + scoreToAdd })
    .eq('id', districtId);

  if (error) {
    logger.error('updateDistrictScore error:', error.message);
    return false;
  }
  return true;
}
