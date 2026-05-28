/**
 * Game Stats Functions
 *
 * Functions for updating user game statistics and district scores.
 */

import { getUserGameHistory as dbGetUserGameHistory } from '../../services/database';
import { supabase } from '../../services/supabase';
import { normalizeUsername } from '../format';
import { getTeamLeaderboard } from './leaderboard';

import type { GameData, GameStatsUpdate } from './types';

/**
 * Update user stats after a game
 * @param username - The username to update
 * @param updates - The stats updates (streak, score, etc)
 * @returns Promise resolving when update is complete
 */
export const updateUserGameStats = async (
  username: string,
  { streak, lastPlayDate, currentScore }: GameStatsUpdate
): Promise<void> => {
  if (!username) {
    return;
  }
  const normalizedName = normalizeUsername(username);

  try {
    const { data, error } = await (supabase as any).rpc('record_game_result', {
      p_username: normalizedName,
      p_score: currentScore ?? 0,
      p_streak: streak,
      p_last_play_date: lastPlayDate,
    });

    if (error || !(data as any)?.success) {
      console.error('Error updating game stats:', error || (data as any)?.error);
    }
  } catch (e) {
    console.error('Error updating game stats:', e);
  }
};

/**
 * Get user's game history
 * @param username - The username to fetch history for
 * @returns Promise resolving to list of past game results
 */
export const getUserGameHistory = async (username: string): Promise<GameData[]> => {
  if (!username) {
    return [];
  }

  try {
    const games = await dbGetUserGameHistory(normalizeUsername(username));

    return games
      .filter(g => g.played_at) // Filter out games without played_at timestamp
      .map(g => {
        const playedAt = g.played_at!; // Non-null assertion safe after filter
        return {
          score: g.score,
          date: parseInt(playedAt.split('T')[0]!.replace(/-/g, ''), 10),
          time: g.time_taken || undefined,
          timestamp: new Date(playedAt).getTime(),
        };
      });
  } catch (e) {
    console.error('Error fetching user game history:', e);
    return [];
  }
};

/**
 * Get district rankings
 * Aggregates all-time scores from game_results (same source as the player-facing team leaderboard).
 * @returns Promise resolving to list of districts with scores
 */
export const getDistrictRankings = async (): Promise<{ id: string; score: number }[]> => {
  try {
    const teams = await getTeamLeaderboard('all');
    return teams.map(t => ({ id: t.teamId, score: t.score }));
  } catch (e) {
    console.error('Error fetching district rankings:', e);
    return [];
  }
};
