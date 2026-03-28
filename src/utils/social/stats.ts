/**
 * Game Stats Functions
 *
 * Functions for updating user game statistics and district scores.
 */

import {
  getUserGameHistory as dbGetUserGameHistory,
  getUserByUsername,
  updateUser,
} from '../../services/database';
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
    const [existingUser, totalScoreResult] = await Promise.all([
      getUserByUsername(normalizedName),
      supabase
        .from('game_results')
        .select('score')
        .eq('user_id', normalizedName)
        .then(({ data }) => (data ?? []).reduce((sum, r) => sum + (r.score ?? 0), 0)),
    ]);

    if (!existingUser) {
      return;
    }

    const updates: Record<string, unknown> = {
      games_played: (existingUser.games_played ?? 0) + 1,
      total_score: totalScoreResult,
      streak: Math.min(streak, (existingUser.games_played ?? 0) + 1),
      last_play_date: lastPlayDate,
    };

    if (streak > (existingUser.max_streak ?? 0)) {
      updates.max_streak = streak;
    }

    if (currentScore !== undefined && currentScore > (existingUser.best_score ?? 0)) {
      updates.best_score = currentScore;
    }

    await updateUser(normalizedName, updates);
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
