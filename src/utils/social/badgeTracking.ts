/**
 * Badge Tracking Utility
 */

import { BADGES, TIME } from '../../config/constants';
import {
  addPurchasedBadge,
  getBadgeStats as dbGetBadgeStats,
  getUserPurchasedBadges,
  upsertBadgeStats,
} from '../../services/database';
import { BadgeStatsRow } from '../../types/supabase';

// Street name patterns
const RAMBLAS_PATTERNS = /rambla|ramblas/i;
const EIXAMPLE_PATTERNS = /eixample|diagonal|passeig de gràcia|aragó|valència|mallorca|rosselló/i;
const GOTHIC_PATTERNS = /gòtic|gothic|call|bisbe|ferran|portal|jaume|pi\b/i;
const BORN_PATTERNS = /born|ribera|princesa|montcada|passeig del born/i;
const POBLENOU_PATTERNS = /poblenou|llacuna|pallars|pujades|pere iv|taulat/i;
const FOOD_STREETS = /verdi|blai|parlament|enric granados|rambla catalunya/i;

export interface BadgeStats {
  gamesPlayed: number;
  bestScore: number;
  streak: number;
  wrongStreak: number;
  totalPanKm: number;
  consecutiveDays: number;
  gamesWithoutQuitting: number;
  eixampleCorners: number;
  gothicStreak: number;
  bornGuesses: number;
  poblenouGuesses: number;
  nightPlay: boolean;
  ramblasQuickGuess: boolean;
  precisionGuess: boolean;
  foodStreetsPerfect: number;
  fastLoss: boolean;
  speedModeHighScore: boolean;
  inviteCount: number;
  lastPlayDate: string | null;
}

export interface QuestionResult {
  streetName?: string;
  correct: boolean;
  time: number;
  attempts?: number;
}

export interface GameResult {
  score: number;
  completed: boolean;
  duration?: number;
  correctCount?: number;
  wrongStreak?: number;
  questions?: QuestionResult[];
}

interface OperationResult {
  success: boolean;
  error?: string;
}

const DEFAULT_STATS: BadgeStats = {
  gamesPlayed: 0,
  bestScore: 0,
  streak: 0,
  wrongStreak: 0,
  totalPanKm: 0,
  consecutiveDays: 0,
  gamesWithoutQuitting: 0,
  eixampleCorners: 0,
  gothicStreak: 0,
  bornGuesses: 0,
  poblenouGuesses: 0,
  nightPlay: false,
  ramblasQuickGuess: false,
  precisionGuess: false,
  foodStreetsPerfect: 0,
  fastLoss: false,
  speedModeHighScore: false,
  inviteCount: 0,
  lastPlayDate: null,
};

// Helper: Map Row to Stats
const rowToStats = (row: BadgeStatsRow): BadgeStats => ({
  gamesPlayed: row.games_played ?? 0,
  bestScore: row.best_score ?? 0,
  streak: row.streak ?? 0,
  wrongStreak: row.wrong_streak ?? 0,
  totalPanKm: row.total_pan_km ?? 0,
  consecutiveDays: row.consecutive_days ?? 0,
  gamesWithoutQuitting: row.games_without_quitting ?? 0,
  eixampleCorners: row.eixample_corners ?? 0,
  gothicStreak: row.gothic_streak ?? 0,
  bornGuesses: row.born_guesses ?? 0,
  poblenouGuesses: row.poblenou_guesses ?? 0,
  nightPlay: row.night_play ?? false,
  ramblasQuickGuess: row.ramblas_quick_guess ?? false,
  precisionGuess: row.precision_guess ?? false,
  foodStreetsPerfect: row.food_streets_perfect ?? 0,
  fastLoss: row.fast_loss ?? false,
  speedModeHighScore: row.speed_mode_high_score ?? false,
  inviteCount: row.invite_count ?? 0,
  lastPlayDate: row.last_play_date,
});

/**
 * Get user's badge stats from Supabase
 * @param username - The username to fetch stats for
 * @returns Promise resolving to BadgeStats object or null
 */
export async function getBadgeStats(username: string): Promise<BadgeStats | null> {
  if (!username) {
    return null;
  }

  try {
    const row = await dbGetBadgeStats(username);
    if (row) {
      return rowToStats(row);
    }
    return { ...DEFAULT_STATS };
  } catch (e) {
    console.error('[BadgeStats] Error getting stats:', e);
    return null; // Return null on error? Or default? Main app might expect null to block?
    // Old implementation returned null on error but default if not found.
    // If we assume default stats if not found, we can return DEFAULT_STATS
    // but preserving strictness might be safer.
  }
}

/**
 * Update badge stats after a game
 * @param username - The username to update
 * @param gameResult - The result of the completed game
 * @returns Promise resolving when update is complete
 */
export async function updateBadgeStats(username: string, gameResult: GameResult): Promise<void> {
  if (!username || !gameResult) {
    return;
  }

  try {
    const currentStats = (await getBadgeStats(username)) || { ...DEFAULT_STATS };
    const updates: Partial<BadgeStats> = {};

    // Games played
    updates.gamesPlayed = currentStats.gamesPlayed + 1;

    // Best score
    if (gameResult.score > currentStats.bestScore) {
      updates.bestScore = gameResult.score;
    }

    // Check if game was completed without quitting
    if (gameResult.completed) {
      updates.gamesWithoutQuitting = currentStats.gamesWithoutQuitting + 1;
    }

    // Consecutive days tracking
    const today = new Date().toISOString().split('T')[0];
    const lastPlay = currentStats.lastPlayDate;

    if (lastPlay) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().split('T')[0];

      if (lastPlay === yesterday) {
        updates.consecutiveDays = currentStats.consecutiveDays + 1;
      } else if (lastPlay !== today) {
        updates.consecutiveDays = 1;
      }
    } else {
      updates.consecutiveDays = 1;
    }
    updates.lastPlayDate = today;

    // Night play (2-5 AM)
    const hour = new Date().getHours();
    if (hour >= BADGES.NIGHT_START && hour < BADGES.NIGHT_END) {
      updates.nightPlay = true;
    }

    // Fast loss
    const ONE_MINUTE_SECONDS = TIME.ONE_MINUTE / 1000;
    if (
      gameResult.duration &&
      gameResult.duration < ONE_MINUTE_SECONDS &&
      gameResult.correctCount === 0
    ) {
      updates.fastLoss = true;
    }

    // Wrong streak tracking
    if (gameResult.wrongStreak && gameResult.wrongStreak >= BADGES.WRONG_STREAK) {
      updates.wrongStreak = Math.max(currentStats.wrongStreak, gameResult.wrongStreak);
    }

    // Per-question analysis
    if (gameResult.questions) {
      let currentGothicStreak = 0;
      let maxGothicStreak = currentStats.gothicStreak;
      let ramblasQuick = currentStats.ramblasQuickGuess;
      let eixample = currentStats.eixampleCorners;
      let born = currentStats.bornGuesses;
      let poblenou = currentStats.poblenouGuesses;
      let food = currentStats.foodStreetsPerfect;

      for (const q of gameResult.questions) {
        const streetName = q.streetName || '';

        // Ramblas quick guess
        if (RAMBLAS_PATTERNS.test(streetName) && q.correct && q.time < BADGES.QUICK_GUESS_TIME) {
          ramblasQuick = true;
        }

        // Eixample corners
        if (EIXAMPLE_PATTERNS.test(streetName) && q.correct) {
          eixample++;
        }

        // Gothic Quarter streak
        if (GOTHIC_PATTERNS.test(streetName)) {
          if (q.correct) {
            currentGothicStreak++;
            maxGothicStreak = Math.max(maxGothicStreak, currentGothicStreak);
          } else {
            currentGothicStreak = 0;
          }
        }

        // El Born guesses
        if (BORN_PATTERNS.test(streetName) && q.correct) {
          born++;
        }

        // Poblenou guesses
        if (POBLENOU_PATTERNS.test(streetName) && q.correct) {
          poblenou++;
        }

        // Food streets perfect
        if (FOOD_STREETS.test(streetName) && q.correct && q.attempts === 1) {
          food++;
        }
      }

      if (maxGothicStreak > currentStats.gothicStreak) {
        updates.gothicStreak = maxGothicStreak;
      }
      if (ramblasQuick !== currentStats.ramblasQuickGuess) {
        updates.ramblasQuickGuess = ramblasQuick;
      }
      if (eixample > currentStats.eixampleCorners) {
        updates.eixampleCorners = eixample;
      }
      if (born > currentStats.bornGuesses) {
        updates.bornGuesses = born;
      }
      if (poblenou > currentStats.poblenouGuesses) {
        updates.poblenouGuesses = poblenou;
      }
      if (food > currentStats.foodStreetsPerfect) {
        updates.foodStreetsPerfect = food;
      }
    }

    // Map partial badge stats to Row updates
    const dbUpdates: Partial<BadgeStatsRow> = {};
    if (updates.gamesPlayed !== undefined) {
      dbUpdates.games_played = updates.gamesPlayed;
    }
    if (updates.bestScore !== undefined) {
      dbUpdates.best_score = updates.bestScore;
    }
    if (updates.consecutiveDays !== undefined) {
      dbUpdates.consecutive_days = updates.consecutiveDays;
    }
    if (updates.gamesWithoutQuitting !== undefined) {
      dbUpdates.games_without_quitting = updates.gamesWithoutQuitting;
    }
    if (updates.nightPlay !== undefined) {
      dbUpdates.night_play = updates.nightPlay;
    }
    if (updates.fastLoss !== undefined) {
      dbUpdates.fast_loss = updates.fastLoss;
    }
    if (updates.wrongStreak !== undefined) {
      dbUpdates.wrong_streak = updates.wrongStreak;
    }
    if (updates.gothicStreak !== undefined) {
      dbUpdates.gothic_streak = updates.gothicStreak;
    }
    if (updates.ramblasQuickGuess !== undefined) {
      dbUpdates.ramblas_quick_guess = updates.ramblasQuickGuess;
    }
    if (updates.eixampleCorners !== undefined) {
      dbUpdates.eixample_corners = updates.eixampleCorners;
    }
    if (updates.bornGuesses !== undefined) {
      dbUpdates.born_guesses = updates.bornGuesses;
    }
    if (updates.poblenouGuesses !== undefined) {
      dbUpdates.poblenou_guesses = updates.poblenouGuesses;
    }
    if (updates.foodStreetsPerfect !== undefined) {
      dbUpdates.food_streets_perfect = updates.foodStreetsPerfect;
    }
    if (updates.lastPlayDate !== undefined) {
      dbUpdates.last_play_date = updates.lastPlayDate;
    }

    if (Object.keys(dbUpdates).length > 0) {
      await upsertBadgeStats(username, dbUpdates as any);
    }
  } catch (e) {
    console.error('[BadgeStats] Error updating stats:', e);
  }
}

/**
 * Get user's purchased badges
 * @param username - The username to fetch badges for
 * @returns Promise resolving to list of badge IDs
 */
export async function getPurchasedBadges(username: string): Promise<string[]> {
  return getUserPurchasedBadges(username);
}

/**
 * Purchase a badge
 * @param username - The user purchasing the badge
 * @param badgeId - The ID of the badge to purchase
 * @returns Promise resolving to operation result
 */
export async function purchaseBadge(username: string, badgeId: string): Promise<OperationResult> {
  if (!username || !badgeId) {
    return { success: false, error: 'Invalid params' };
  }

  try {
    const success = await addPurchasedBadge(username, badgeId);
    if (success) {
      return { success: true };
    }
    return { success: false, error: 'Purchase failed' };
  } catch (e) {
    console.error('[BadgeStats] Error purchasing badge:', e);
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Track map panning distance
 * @param username - The username tracking distance
 * @param distanceKm - The distance panned in KM
 * @returns Promise resolving when tracking is recorded
 */
export async function trackPanDistance(username: string, distanceKm: number): Promise<void> {
  if (!username || !distanceKm) {
    return;
  }

  try {
    const current = await getBadgeStats(username);
    const newTotal = (current?.totalPanKm || 0) + distanceKm;

    await upsertBadgeStats(username, { total_pan_km: newTotal } as any);
  } catch (e) {
    console.error('[BadgeStats] Error tracking pan distance:', e);
  }
}
