/**
 * Game Stats Functions
 *
 * Functions for updating user game statistics and district scores.
 */

import {
  getUserGameHistory as dbGetUserGameHistory,
  updateDistrictScore as dbUpdateDistrictScore,
  getDistricts,
  getUserByUsername,
  updateUser,
} from '../../services/database';
import { normalizeUsername } from '../format';

import { ensureUserProfile } from './profile';
import type { GameData, GameStatsUpdate } from './types';

/**
 * Update user stats after a game
 * @param username - The username to update
 * @param updates - The stats updates (streak, score, etc)
 * @returns Promise resolving when update is complete
 */
export const updateUserGameStats = async (
  username: string,
  { streak, totalScore, lastPlayDate, currentScore }: GameStatsUpdate
): Promise<void> => {
  if (!username) {
    return;
  }
  const normalizedName = normalizeUsername(username);

  try {
    const existingUser = await getUserByUsername(normalizedName);
    if (!existingUser) {
      return;
    }

    const updates: Record<string, unknown> = {
      games_played: (existingUser.games_played ?? 0) + 1,
      total_score: totalScore,
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

    if (existingUser.district && currentScore) {
      await dbUpdateDistrictScore(existingUser.district, currentScore);
    }
  } catch (e) {
    console.error('Error updating game stats:', e);
  }
};

/**
 * Update user statistics after completing a game (Simple version)
 * @param username - The username to update
 * @param score - The score achieved
 * @returns Promise resolving when update is complete
 */
export const updateUserStats = async (username: string, score: number): Promise<void> => {
  if (!username) {
    return;
  }

  const existingUser = await getUserByUsername(username);

  if (existingUser) {
    const newGamesPlayed = (existingUser.games_played ?? 0) + 1;
    const newBestScore = Math.max(existingUser.best_score ?? 0, score);

    await updateUser(username, {
      games_played: newGamesPlayed,
      best_score: newBestScore,
    });
  } else {
    await ensureUserProfile(username);
    await updateUser(username, {
      games_played: 1,
      best_score: score,
    });
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
 * Update district score
 * @param districtId - The district ID to update
 * @param score - The score to add
 * @returns Promise resolving when update is complete
 */
export const updateDistrictScore = async (districtId: string, score: number): Promise<void> => {
  if (!districtId || !score) {
    return;
  }
  await dbUpdateDistrictScore(districtId, score);
};

/**
 * Get district rankings
 * @returns Promise resolving to list of districts with scores
 */
export const getDistrictRankings = async (): Promise<{ id: string; score: number }[]> => {
  try {
    const districts = await getDistricts();
    return districts.map(d => ({ id: d.id, score: d.score ?? 0 }));
  } catch (e) {
    console.error('Error fetching district rankings:', e);
    return [];
  }
};
