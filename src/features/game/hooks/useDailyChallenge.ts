import { useMemo } from 'react';
import { Street } from '../../../types/game';
import { getTodaySeed, selectDailyStreets } from '../../../utils/game/dailyChallenge';

interface DailyChallengeData {
  dailyStreets: Street[];
  seed: number;
  isToday: boolean;
}

/**
 * Custom hook for managing daily challenge street selection.
 * Uses deterministic seeding to ensure all users get the same streets each day.
 *
 * @param streets - Array of all available street objects
 * @returns dailyStreets, seed, and isToday flag
 *
 * @example
 * const { dailyStreets, seed } = useDailyChallenge(validStreets);
 * // Returns 10 streets selected for today's date
 */
export function useDailyChallenge(streets: Street[]): DailyChallengeData {
  const dailyData = useMemo<DailyChallengeData>(() => {
    if (!streets || streets.length === 0) {
      return {
        dailyStreets: [],
        seed: 0,
        isToday: true,
      };
    }

    const todaySeed = getTodaySeed();
    const selectedStreets = selectDailyStreets(streets, todaySeed);

    return {
      dailyStreets: selectedStreets,
      seed: todaySeed,
      isToday: true,
    };
  }, [streets]);

  return dailyData;
}

export default useDailyChallenge;
