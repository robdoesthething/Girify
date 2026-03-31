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
  username: string | null;
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
    username: data.username ? normalizeUsername(data.username) : null,
  };

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
      .eq('username', normalizedUsername)
      .order('played_at', { ascending: false })
      .limit(limit),
    'getUserGameHistory'
  );

  logger.info(`Retrieved ${data?.length || 0} game records for ${normalizedUsername}`);

  return data || [];
}

/**
 * Returns recent game results for all members of a district/team.
 * Since game_results has no district_id, we resolve via the users table:
 *   1. Fetch usernames where users.team = teamName
 *   2. Fetch their game results ordered by recency
 */
export async function getDistrictGameHistory(
  teamName: string,
  limit = 50
): Promise<(GameResultRow & { username: string })[]> {
  // Step 1: get all usernames belonging to this team
  const { data: members, error: membersError } = await supabase
    .from('users')
    .select('username')
    .eq('team', teamName)
    .not('username', 'is', null);

  if (membersError || !members?.length) {
    logger.error('getDistrictGameHistory: failed to fetch members', membersError?.message);
    return [];
  }

  const usernames = members.map(m => normalizeUsername(m.username as string));

  // Step 2: fetch their game results
  const data = await executeQuery<GameResultRow[]>(
    supabase
      .from('game_results')
      .select('*')
      .in('username', usernames)
      .order('played_at', { ascending: false })
      .limit(limit),
    'getDistrictGameHistory'
  );

  logger.info(
    `Retrieved ${data?.length || 0} game records for district "${teamName}" (${usernames.length} members)`
  );

  return (data || []) as (GameResultRow & { username: string })[];
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
