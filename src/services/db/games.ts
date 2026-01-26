/**
 * Game Results Database Operations
 *
 * Leaderboards, game history, and district scores.
 */

import type { GameResultRow } from '../../types/supabase';
import { supabase } from '../supabase';

// ============================================================================
// GAME RESULTS / LEADERBOARD
// ============================================================================

export async function getLeaderboardScores(
  period: 'all' | 'daily' | 'weekly' | 'monthly',
  limit = 100
): Promise<GameResultRow[]> {
  let query = supabase
    .from('game_results')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit * 4); // Fetch more for deduplication

  const now = new Date();

  if (period === 'daily') {
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    ).toISOString();
    query = query.gte('played_at', startOfDay);
  } else if (period === 'weekly') {
    const d = new Date(now);
    const currentDay = d.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    d.setDate(d.getDate() - distanceToMonday);
    d.setHours(0, 0, 0, 0);
    query = query.gte('played_at', d.toISOString());
  } else if (period === 'monthly') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    query = query.gte('played_at', startOfMonth);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DB] getLeaderboardScores error:', error.message);
    return [];
  }
  return data || [];
}

export async function getUserGameHistory(username: string, limit = 30): Promise<GameResultRow[]> {
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', username.toLowerCase())
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
