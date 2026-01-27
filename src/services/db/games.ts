/**
 * Game Results Database Operations
 *
 * Leaderboards, game history, and district scores.
 */

import type { GameResultRow } from '../../types/supabase';
import { normalizeUsername } from '../../utils/format';
import { supabase } from '../supabase';

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
    console.error('[DB] insertGameResult error:', error.message);
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

  // Apply period filters first to reduce dataset before ordering/limiting
  if (period === 'daily') {
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    ).toISOString();
    query = query.gte('played_at', startOfDay);
  } else if (period === 'weekly') {
    // Calculate start of week (Monday) using UTC to match game save timestamps
    const currentDayUTC = now.getUTCDay(); // 0 = Sunday
    const distanceToMonday = currentDayUTC === 0 ? 6 : currentDayUTC - 1;
    const startOfWeek = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - distanceToMonday,
        0,
        0,
        0,
        0
      )
    ).toISOString();
    query = query.gte('played_at', startOfWeek);
  } else if (period === 'monthly') {
    // Use UTC for consistent monthly boundaries
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
    ).toISOString();
    query = query.gte('played_at', startOfMonth);
  }

  // Apply ordering and limit AFTER filtering to ensure correct results
  query = query.order('score', { ascending: false }).limit(limit * 4);

  const { data, error } = await query;

  if (error) {
    console.error('[DB] getLeaderboardScores error:', error.message);
    return [];
  }
  return data || [];
}

export async function getUserGameHistory(username: string, limit = 30): Promise<GameResultRow[]> {
  const normalizedUsername = normalizeUsername(username);

  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', normalizedUsername)
    .order('played_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[DB] getUserGameHistory error:', error.message);
    return [];
  }

  return data || [];
}

// ============================================================================
// DISTRICTS
// ============================================================================

export async function getDistricts(): Promise<
  Array<{ id: string; name: string; team_name: string | null; score: number | null }>
> {
  const { data, error } = await supabase
    .from('districts')
    .select('id, name, team_name, score')
    .order('score', { ascending: false });

  if (error) {
    console.error('[DB] getDistricts error:', error.message);
    return [];
  }
  return data || [];
}

export async function updateDistrictScore(
  districtId: string,
  scoreToAdd: number
): Promise<boolean> {
  const { data: district, error: fetchError } = await supabase
    .from('districts')
    .select('score')
    .eq('id', districtId)
    .single();

  if (fetchError || !district) {
    console.error('[DB] updateDistrictScore fetch error:', fetchError?.message);
    return false;
  }

  const { error } = await supabase
    .from('districts')
    .update({ score: (district.score ?? 0) + scoreToAdd })
    .eq('id', districtId);

  if (error) {
    console.error('[DB] updateDistrictScore error:', error.message);
    return false;
  }
  return true;
}
