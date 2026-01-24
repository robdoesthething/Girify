import { useCallback } from 'react';
import { calculateScore as calculateScoreConfig } from '../../../config/gameConfig';

/**
 * Custom hook for calculating quiz scores based on time and correctness.
 * Wraps the scoring utility function in a stable callback.
 *
 * @returns {{ calculateScore: Function }}
 *
 * @example
 * const { calculateScore } = useScoreCalculator();
 * const points = calculateScore(8.5, true, 2); // 8.5 seconds, correct, 2 hints
 * // Returns: score based on time (0-100 points)
 */
export function useScoreCalculator() {
  /**
   * Calculate score for a question based on time taken.
   *
   * @param {number} timeInSeconds - Time taken to answer in seconds
   * @param {boolean} isCorrect - Whether the answer was correct
   * @param {number} hintsCount - Number of hints used (0-3)
   * @returns {number} Points earned (0-100)
   */
  const calculateScore = useCallback(
    (timeInSeconds: number, isCorrect: boolean, hintsCount: number = 0): number => {
      return calculateScoreConfig(timeInSeconds, isCorrect, hintsCount);
    },
    []
  );

  return { calculateScore };
}

export default useScoreCalculator;
