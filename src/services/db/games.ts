/**
 * Game Results Database Operations
 *
 * Leaderboards, game history, and district scores.
 */

import type { GameResultRow } from '../../types/supabase';
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

  // Ownership is enforced by RLS: the custom JWT's `sub` claim (Firebase UID)
  // is matched against the user's username via the users table.

  const { error } = await supabase.from('game_results').insert(payload);

  if (error) {
    logger.error('insertGameResult error:', error.message);
    return { success: false, error };
  }
  return { success: true };
}

export async function getUserGameHistory(username: string, limit = 30): Promise<GameResultRow[]> {
  const normalizedUsername = normalizeUsername(username);

  logger.info(`Fetching game history for: ${normalizedUsername} (limit: ${limit})`);

  const data = await executeQuery<GameResultRow[]>(
    supabase
      .from('game_results')
      .select('*')
      .eq('user_id', normalizedUsername)
      .order('played_at', { ascending: false })
      .limit(limit),
    'getUserGameHistory'
  );

  logger.info(`Retrieved ${data?.length || 0} game records for ${normalizedUsername}`);

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
  // Atomic increment via RPC to avoid TOCTOU race condition
  const { error } = await (supabase as any).rpc('increment_district_score', {
    district_id: districtId,
    score_to_add: scoreToAdd,
  });

  if (error) {
    logger.error('updateDistrictScore RPC error:', error.message);

    // Fallback: read-modify-write (non-atomic, for pre-migration DBs)
    const district = await executeQuery<{ score: number }>(
      supabase.from('districts').select('score').eq('id', districtId).single(),
      'updateDistrictScore:fetch'
    );

    if (!district) {
      return false;
    }

    const { error: updateError } = await supabase
      .from('districts')
      .update({ score: (district.score ?? 0) + scoreToAdd })
      .eq('id', districtId);

    if (updateError) {
      logger.error('updateDistrictScore fallback error:', updateError.message);
      return false;
    }
  }
  return true;
}
