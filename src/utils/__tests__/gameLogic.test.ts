import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTimeUntilNext,
  getTodaySeed,
  hasPlayedToday,
  markTodayAsPlayed,
  selectDailyStreets,
} from '../dailyChallenge';

interface MockStreet {
  id: string;
  name: string;
  tier: number;
  geometry: number[][][][];
}

describe('Daily Challenge - Game Logic', () => {
  const mockStreets: MockStreet[] = [
    { id: '1', name: 'Carrer de Balmes', tier: 1, geometry: [[[[]]]] },
    { id: '2', name: 'Avinguda Diagonal', tier: 1, geometry: [[[[]]]] },
    { id: '3', name: 'Passeig de Gràcia', tier: 1, geometry: [[[[]]]] },
    { id: '4', name: 'Carrer de Aragó', tier: 2, geometry: [[[[]]]] },
    { id: '5', name: 'Carrer de València', tier: 2, geometry: [[[[]]]] },
    { id: '6', name: 'Gran Via', tier: 2, geometry: [[[[]]]] },
    { id: '7', name: 'Ronda de Sant Pere', tier: 3, geometry: [[[[]]]] },
    { id: '8', name: 'Carrer de Provença', tier: 3, geometry: [[[[]]]] },
    { id: '9', name: 'Carrer de Mallorca', tier: 4, geometry: [[[[]]]] },
    { id: '10', name: 'Carrer de Rosselló', tier: 4, geometry: [[[[]]]] },
    { id: '11', name: 'Carrer de Còrsega', tier: 4, geometry: [[[[]]]] },
    { id: '12', name: 'Carrer de Girona', tier: 1, geometry: [[[[]]]] },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodaySeed', () => {
    it('should return a seed in YYYYMMDD format', () => {
      const seed = getTodaySeed();

      expect(typeof seed).toBe('number');
      expect(seed.toString()).toMatch(/^\d{8}$/);
      expect(seed).toBeGreaterThan(20000101);
      expect(seed).toBeLessThan(21000101);
    });

    it('should return the same seed when called multiple times on the same day', () => {
      const seed1 = getTodaySeed();
      const seed2 = getTodaySeed();

      expect(seed1).toBe(seed2);
    });

    it('should generate correct seed for a specific date', () => {
      vi.useFakeTimers();
      const date = new Date('2024-03-15');
      vi.setSystemTime(date);

      const seed = parseInt(
        `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`,
        10
      );
      expect(seed).toBe(20240315);

      vi.useRealTimers();
    });
  });

  describe('selectDailyStreets', () => {
    it('should return exactly 10 streets', () => {
      const seed = 20240101;
      const selected = selectDailyStreets(mockStreets, seed);

      expect(selected).toHaveLength(10);
    });

    it('should return the same streets for the same seed', () => {
      const seed = 20240101;
      const selected1 = selectDailyStreets(mockStreets, seed);
      const selected2 = selectDailyStreets(mockStreets, seed);

      expect(selected1.map(s => s.id)).toEqual(selected2.map(s => s.id));
      expect(selected1.map(s => s.name)).toEqual(selected2.map(s => s.name));
    });

    it('should return different streets for different seeds', () => {
      const seed1 = 20240101;
      const seed2 = 20240102;

      const selected1 = selectDailyStreets(mockStreets, seed1);
      const selected2 = selectDailyStreets(mockStreets, seed2);

      const ids1 = selected1.map(s => s.id).sort();
      const ids2 = selected2.map(s => s.id).sort();

      expect(ids1).not.toEqual(ids2);
    });

    it('should select streets from different tiers', () => {
      const seed = 20240101;
      const selected = selectDailyStreets(mockStreets, seed);

      const tiers = new Set(selected.map(s => s.tier));
      expect(tiers.size).toBeGreaterThan(1);
    });

    it('should handle fewer than 10 streets gracefully', () => {
      const fewStreets = mockStreets.slice(0, 5);
      const seed = 20240101;
      const selected = selectDailyStreets(fewStreets, seed);

      expect(selected.length).toBeLessThanOrEqual(5);
      expect(selected.length).toBeGreaterThan(0);
    });

    it('should not modify the original streets array', () => {
      const seed = 20240101;
      const originalLength = mockStreets.length;
      const originalFirst = mockStreets[0];

      selectDailyStreets(mockStreets, seed);

      expect(mockStreets).toHaveLength(originalLength);
      expect(mockStreets[0]).toBe(originalFirst);
    });
  });

  describe('hasPlayedToday', () => {
    it('should return false when no play date is stored', () => {
      expect(hasPlayedToday()).toBe(false);
    });

    it("should return true when today's date is stored", () => {
      const todaySeed = getTodaySeed();
      localStorage.setItem('lastPlayedDate', String(todaySeed));

      expect(hasPlayedToday()).toBe(true);
    });

    it('should return false when a different date is stored', () => {
      const yesterdaySeed = getTodaySeed() - 1;
      localStorage.setItem('lastPlayedDate', String(yesterdaySeed));

      expect(hasPlayedToday()).toBe(false);
    });
  });

  describe('markTodayAsPlayed', () => {
    it("should store today's seed in localStorage", () => {
      markTodayAsPlayed();

      const stored = localStorage.getItem('lastPlayedDate');
      const todaySeed = getTodaySeed();

      expect(stored).toBe(String(todaySeed));
    });

    it('should update hasPlayedToday to return true', () => {
      expect(hasPlayedToday()).toBe(false);

      markTodayAsPlayed();

      expect(hasPlayedToday()).toBe(true);
    });
  });

  describe('getTimeUntilNext', () => {
    it('should return a string with hours and minutes', () => {
      const timeString = getTimeUntilNext();

      expect(timeString).toMatch(/^\d+h \d+m$/);
    });

    it('should return time until midnight', () => {
      const timeString = getTimeUntilNext();
      const [hours, minutes] = timeString.split(' ').map(s => parseInt(s, 10));

      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThan(24);

      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThan(60);
    });

    it('should decrease over time', () => {
      vi.useFakeTimers();
      const start = new Date();
      start.setHours(10, 0, 0, 0);
      vi.setSystemTime(start);

      const time1 = getTimeUntilNext();

      vi.advanceTimersByTime(1000 * 60 * 60);

      const time2 = getTimeUntilNext();

      expect(time1).not.toBe(time2);

      vi.useRealTimers();
    });
  });
});
