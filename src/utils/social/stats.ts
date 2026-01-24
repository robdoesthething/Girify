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
  saveUserGame,
  updateUser,
} from '../../services/database';
import { normalizeUsername } from '../format';

import { ensureUserProfile } from './profile';
import type { GameData, GameStatsUpdate } from './types';

/**
 * Update user stats after a game
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
 * Update user statistics after completing a game
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
 * Save game result to user's personal history
 */
export const saveUserGameResult = async (username: string, gameData: GameData): Promise<void> => {
  if (!username) {
    return;
  }

  try {
    let dateStr: string;
    if (gameData.date) {
      if (typeof gameData.date === 'number') {
        const d = gameData.date;
        // eslint-disable-next-line no-magic-numbers
        const year = Math.floor(d / 10000);
        // eslint-disable-next-line no-magic-numbers
        const month = Math.floor((d % 10000) / 100);
        const day = d % 100;
        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else {
        dateStr = String(gameData.date);
      }
    } else {
      dateStr = new Date().toISOString().split('T')[0]!;
    }

    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0]!;
    }

    await saveUserGame({
      username: normalizeUsername(username),
      date: dateStr,
      score: gameData.score,
      avgTime: gameData.time,
    });
  } catch (e) {
    console.error('Error saving user game result:', e);
  }
};

/**
 * Get user's game history
 */
export const getUserGameHistory = async (username: string): Promise<GameData[]> => {
  if (!username) {
    return [];
  }

  try {
    const games = await dbGetUserGameHistory(normalizeUsername(username));

    return games.map(g => ({
      score: g.score,
      date: parseInt(g.date.replace(/-/g, ''), 10),
      time: g.avg_time || undefined,
      timestamp: g.played_at ? new Date(g.played_at).getTime() : Date.now(),
    }));
  } catch (e) {
    console.error('Error fetching user game history:', e);
    return [];
  }
};

/**
 * Update district score
 */
export const updateDistrictScore = async (districtId: string, score: number): Promise<void> => {
  if (!districtId || !score) {
    return;
  }
  await dbUpdateDistrictScore(districtId, score);
};

/**
 * Get district rankings
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
