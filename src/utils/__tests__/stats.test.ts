import { describe, expect, it } from 'vitest';
import { calculateStreak } from '../stats';

describe('calculateStreak', () => {
  const getSeed = (d: Date): number =>
    parseInt(
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`,
      10
    );

  const today = new Date();
  const todaySeed = getSeed(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdaySeed = getSeed(yesterday);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoSeed = getSeed(twoDaysAgo);

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoSeed = getSeed(threeDaysAgo);

  it('returns 0 for empty history', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 if played today only', () => {
    expect(calculateStreak([{ date: todaySeed }])).toBe(1);
  });

  it('returns 1 if played yesterday only', () => {
    // Logic allows streak to be kept if played yesterday (grace period/start of streak)
    // Actually, if played yesterday, streak is 1. If played today too, it becomes 2.
    expect(calculateStreak([{ date: yesterdaySeed }])).toBe(1);
  });

  it('returns 0 if played 2 days ago only (streak broken)', () => {
    expect(calculateStreak([{ date: twoDaysAgoSeed }])).toBe(0);
  });

  it('calculates consecutive streak (Today + Yesterday)', () => {
    const history = [{ date: todaySeed }, { date: yesterdaySeed }];
    expect(calculateStreak(history)).toBe(2);
  });

  it('calculates consecutive streak (Yesterday + 2 Days Ago)', () => {
    // Streak valid even if not played today yet
    const history = [{ date: yesterdaySeed }, { date: twoDaysAgoSeed }];
    expect(calculateStreak(history)).toBe(2);
  });

  it('handles duplicates entries for same day', () => {
    const history = [{ date: todaySeed }, { date: todaySeed }, { date: yesterdaySeed }];
    // Duplicates shouldn't increase streak excessively, but loop logic might verify distinct dates?
    // Implementation:
    // for (const record of sorted) { if (record.date === expectedDate) { streak++; ... expectedDate = prevDay; } }
    // If record.date === expectedDate (today), streak becomes 1. Expects yesterday.
    // Next record is today again. record.date (today) > expectedDate (yesterday). GAP?
    // Wait. else if (record.date < expectedDate) break.
    // What if record.date > expectedDate? (duplicates usually imply sorted order same)
    // If sorted same date:
    // 1st: matches expected (today). Streak=1. Expected=yesterday.
    // 2nd: matches today. Today > Yesterday.
    // The code:
    // } else if (record.date < expectedDate) { break }
    // It does nothing if record.date > expectedDate. It continues loop.
    // So duplicates are skipped correctly.
    expect(calculateStreak(history)).toBe(2);
  });

  it('breaks streak on gap', () => {
    const history = [{ date: todaySeed }, { date: threeDaysAgoSeed }];
    // Today (1). Expected: Yesterday.
    // Next: 3 days ago. < Yesterday. Break.
    expect(calculateStreak(history)).toBe(1);
  });
});
