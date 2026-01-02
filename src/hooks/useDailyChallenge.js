import { useMemo } from 'react';
import { getTodaySeed, selectDailyStreets } from '../utils/dailyChallenge';

/**
 * Custom hook for managing daily challenge street selection.
 * Uses deterministic seeding to ensure all users get the same streets each day.
 * 
 * @param {Array} streets - Array of all available street objects
 * @returns {{ dailyStreets: Array, seed: number, isToday: boolean }}
 * 
 * @example
 * const { dailyStreets, seed } = useDailyChallenge(validStreets);
 * // Returns 10 streets selected for today's date
 */
export function useDailyChallenge(streets) {
    const dailyData = useMemo(() => {
        if (!streets || streets.length === 0) {
            return {
                dailyStreets: [],
                seed: 0,
                isToday: true
            };
        }

        const todaySeed = getTodaySeed();
        const selectedStreets = selectDailyStreets(streets, todaySeed);

        return {
            dailyStreets: selectedStreets,
            seed: todaySeed,
            isToday: true
        };
    }, [streets]); // Recalculate when streets data changes

    return dailyData;
}

export default useDailyChallenge;
