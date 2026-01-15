/**
 * Badge Tracking Utility
 * Handles tracking badge progress and awarding merit badges
 */

import {
  collection,
  doc,
  DocumentData,
  FieldValue,
  getDoc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { BADGES, TIME } from '../config/constants';
import { db } from '../firebase';

// Street name patterns for location-based badges
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

/**
 * Get user's badge stats from Firestore
 */
export async function getBadgeStats(username: string): Promise<BadgeStats | null> {
  if (!username) {
    return null;
  }

  try {
    const statsRef = doc(db, 'users', username, 'badgeStats', 'current');
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      return statsSnap.data() as BadgeStats;
    }

    return { ...DEFAULT_STATS };
  } catch (e) {
    console.error('[BadgeStats] Error getting stats:', e);
    return null;
  }
}

/**
 * Update badge stats after a game
 */
export async function updateBadgeStats(username: string, gameResult: GameResult): Promise<void> {
  if (!username || !gameResult) {
    return;
  }

  try {
    const statsRef = doc(db, 'users', username, 'badgeStats', 'current');
    const statsSnap = await getDoc(statsRef);
    const currentStats = statsSnap.exists() ? (statsSnap.data() as DocumentData) : {};

    const updates: Record<string, FieldValue | number | boolean | string> = {};

    // Games played
    updates.gamesPlayed = increment(1);

    // Best score
    if (gameResult.score > ((currentStats.bestScore as number) || 0)) {
      updates.bestScore = gameResult.score;
    }

    // Check if game was completed without quitting
    if (gameResult.completed) {
      updates.gamesWithoutQuitting = increment(1);
    }

    // Consecutive days tracking
    const today = new Date().toDateString();
    const lastPlay = currentStats.lastPlayDate as string | undefined;
    if (lastPlay) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastPlay === yesterday.toDateString()) {
        updates.consecutiveDays = increment(1);
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

    // Fast loss (all wrong in under 1 minute)
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
      updates.wrongStreak = Math.max(
        (currentStats.wrongStreak as number) || 0,
        gameResult.wrongStreak
      );
    }

    // Per-question analysis
    if (gameResult.questions) {
      let currentGothicStreak = 0;
      let maxGothicStreak = (currentStats.gothicStreak as number) || 0;

      for (const q of gameResult.questions) {
        const streetName = q.streetName || '';

        // Ramblas quick guess
        if (RAMBLAS_PATTERNS.test(streetName) && q.correct && q.time < BADGES.QUICK_GUESS_TIME) {
          updates.ramblasQuickGuess = true;
        }

        // Eixample corners
        if (EIXAMPLE_PATTERNS.test(streetName) && q.correct) {
          updates.eixampleCorners = increment(1);
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
          updates.bornGuesses = increment(1);
        }

        // Poblenou guesses
        if (POBLENOU_PATTERNS.test(streetName) && q.correct) {
          updates.poblenouGuesses = increment(1);
        }

        // Food streets perfect
        if (FOOD_STREETS.test(streetName) && q.correct && q.attempts === 1) {
          updates.foodStreetsPerfect = increment(1);
        }
      }

      if (maxGothicStreak > ((currentStats.gothicStreak as number) || 0)) {
        updates.gothicStreak = maxGothicStreak;
      }
    }

    // Apply updates
    if (statsSnap.exists()) {
      await updateDoc(statsRef, updates);
    } else {
      await setDoc(statsRef, {
        ...DEFAULT_STATS,
        gamesPlayed: 1,
        bestScore: gameResult.score || 0,
        consecutiveDays: 1,
        gamesWithoutQuitting: gameResult.completed ? 1 : 0,
        nightPlay: hour >= BADGES.NIGHT_START && hour < BADGES.NIGHT_END,
        lastPlayDate: today,
        ...updates,
      });
    }
  } catch (e) {
    console.error('[BadgeStats] Error updating stats:', e);
  }
}

/**
 * Get user's purchased badges
 */
export async function getPurchasedBadges(username: string): Promise<string[]> {
  if (!username) {
    return [];
  }

  try {
    const badgesRef = collection(db, 'users', username, 'purchasedBadges');
    const badgesSnap = await getDocs(badgesRef);
    return badgesSnap.docs.map(d => d.id);
  } catch (e) {
    console.error('[BadgeStats] Error getting purchased badges:', e);
    return [];
  }
}

/**
 * Purchase a badge
 */
export async function purchaseBadge(username: string, badgeId: string): Promise<OperationResult> {
  if (!username || !badgeId) {
    return { success: false, error: 'Invalid params' };
  }

  try {
    const badgeRef = doc(db, 'users', username, 'purchasedBadges', badgeId);
    await setDoc(badgeRef, {
      purchasedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (e) {
    console.error('[BadgeStats] Error purchasing badge:', e);
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Track map panning distance (for Socks & Sandals badge)
 */
export async function trackPanDistance(username: string, distanceKm: number): Promise<void> {
  if (!username || !distanceKm) {
    return;
  }

  try {
    const statsRef = doc(db, 'users', username, 'badgeStats', 'current');
    await updateDoc(statsRef, {
      totalPanKm: increment(distanceKm),
    });
  } catch (e) {
    console.error('[BadgeStats] Error tracking pan distance:', e);
  }
}
