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
  if (points >= 90) {
    return 'Perfect!';
  }
  if (points >= 75) {
    return 'Excellent';
  }
  if (points >= 50) {
    return 'Good';
  }
  if (points >= 30) {
    return 'Fair';
  }
  if (points > 0) {
    return 'Slow';
  }
  return 'Wrong';
}

/**
 * Get score tier color
 * @param {number} points - Points earned
 * @returns {string} - Tailwind color class
 */
export function getScoreTierColor(points: number): string {
  if (points >= 90) {
    return 'text-emerald-500';
  }
  if (points >= 75) {
    return 'text-green-500';
  }
  if (points >= 50) {
    return 'text-yellow-500';
  }
  if (points >= 30) {
    return 'text-orange-500';
  }
  if (points > 0) {
    return 'text-red-500';
  }
  return 'text-rose-500';
}
