import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTodaySeed,
  selectDailyStreets,
  hasPlayedToday,
  markTodayAsPlayed,
} from '../game/dailyChallenge';

describe('dailyChallenge utils', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getTodaySeed', () => {
    it('returns consistent seed for same day', () => {
      const seed1 = getTodaySeed();
      const seed2 = getTodaySeed();
      expect(seed1).toBe(seed2);
    });

    it('returns date in YYYYMMDD number format', () => {
      // Implementation returns parseInt(YYYYMMDD)
      const seed = getTodaySeed();
      expect(seed).toBeGreaterThan(20200101); // Logical check
    });
  });

  describe('selectDailyStreets', () => {
    // Mock streets with tiers
    const mockStreets = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      name: `Street ${i}`,
      tier: (i % 4) + 1, // Distribute tiers 1-4
      geometry: [[[]]],
    }));

    it('returns deterministic selection for same seed', () => {
      const seed = 20250113;
      const selection1 = selectDailyStreets(mockStreets, seed);
      const selection2 = selectDailyStreets(mockStreets, seed);

      expect(selection1).toEqual(selection2);
    });

    it('returns different streets (or order) for different seeds', () => {
      const selection1 = selectDailyStreets(mockStreets, 20250113);
      const selection2 = selectDailyStreets(mockStreets, 20250114);

      // Highly unlikely to match exactly including shuffling
      expect(selection1).not.toEqual(selection2);
    });

    it('returns correct number of streets', () => {
      // Should return 10 or max available
      const selection = selectDailyStreets(mockStreets, 20250113);
      expect(selection).toHaveLength(Math.min(10, mockStreets.length));
    });
  });

  describe('hasPlayedToday / markTodayAsPlayed', () => {
    it('returns false when not played today', () => {
      // Manually remove if needed, though beforeEach clears
      expect(hasPlayedToday()).toBe(false);
    });

    it('returns true after marking as played', () => {
      markTodayAsPlayed();
      expect(hasPlayedToday()).toBe(true);
    });

    it('returns false for different day', () => {
      // Mock storage to yesterday
      // Current implementation compares storage string to getTodaySeed string
      // getTodaySeed returns YYYYMMDD
      const yesterdaySeed = (getTodaySeed() - 1).toString();

      localStorage.setItem('lastPlayedDate', yesterdaySeed);

      expect(hasPlayedToday()).toBe(false);
    });
  });
});
