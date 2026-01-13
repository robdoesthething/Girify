import { GAME } from '../config/constants';
import { calculateScore } from '../config/gameConfig';

/**
 * Calculate score based on time taken and hints used
 * @deprecated Use calculateScore from config/gameConfig instead
 * @param {number} timeInSeconds - Time taken to answer
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {number} hintsCount - Number of hints revealed (0-3)
 * @returns {number} - Points earned (0-100)
 */
/**
 * Calculate score based on time taken and hints used
 * @deprecated Use calculateScore from config/gameConfig instead
 * @param {number} timeInSeconds - Time taken to answer
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {number} hintsCount - Number of hints revealed (0-3)
 * @returns {number} - Points earned (0-100)
 */
export function calculateTimeScore(
  timeInSeconds: number,
  isCorrect: boolean,
  hintsCount: number = 0
): number {
  return calculateScore(timeInSeconds, isCorrect, hintsCount);
}

/**
 * Get score tier label
 * @param {number} points - Points earned
 * @returns {string} - Tier label
 */
export function getScoreTier(points: number): string {
  if (points >= GAME.SCORING_TIERS.PERFECT) {
    return 'Perfect!';
  }
  if (points >= GAME.SCORING_TIERS.GREAT) {
    return 'Excellent';
  }
  if (points >= GAME.SCORING_TIERS.GOOD) {
    return 'Good';
  }
  if (points >= GAME.SCORING_TIERS.OKAY) {
    return 'Fair';
  }
  if (points > 0) {
    return 'Slow';
  }
  return 'Wrong';
}

/**
 * Get color for score tier
 * @param {string} tier - Score tier label
 * @returns {string} - Color hex
 */
// ...

export const getAccuracyStars = (percentage: number): number => {
  if (percentage >= GAME.SCORING_TIERS.PERFECT) {
    return GAME.MAX_HINTS;
  }
  if (percentage >= GAME.SCORING_TIERS.GREAT) {
    return 2;
  }
  if (percentage >= GAME.SCORING_TIERS.GOOD) {
    return 1;
  }
  return 0;
};

/**
 * Get score tier color
 * @param {number} points - Points earned
 * @returns {string} - Tailwind color class
 */
export function getScoreTierColor(points: number): string {
  if (points >= GAME.SCORING_TIERS.PERFECT) {
    return 'text-emerald-500';
  }
  if (points >= GAME.SCORING_TIERS.GREAT) {
    return 'text-green-500';
  }
  if (points >= GAME.SCORING_TIERS.GOOD) {
    return 'text-yellow-500';
  }
  if (points >= GAME.SCORING_TIERS.OKAY) {
    return 'text-orange-500';
  }
  if (points > 0) {
    return 'text-red-500';
  }
  return 'text-rose-500';
}
