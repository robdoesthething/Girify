import { describe, expect, it } from 'vitest';
import { GAME, REWARDS } from '../../config/constants';
import { calculateScore, calculateStreakBonus } from '../../config/gameConfig';
import { getScoreTier, getScoreTierColor } from '../scoring';

describe('Scoring Logic (gameConfig)', () => {
  it('returns 0 for incorrect answers', () => {
    const score = calculateScore(2, false, 0);
    expect(score).toBe(0);
  });

  it('awards maximum points for fast answers', () => {
    // timeElapsed <= TIME_BONUS_THRESHOLD (3s) should give full bonus
    const score = calculateScore(0, true, 0);
    // Scaled: (100 + 900) / 10 = 100 per question
    expect(score).toBe(100);
  });

  it('reduces score based on time (linear decay)', () => {
    const fastScore = calculateScore(1, true, 0); // < 3s = max
    const slowScore = calculateScore(10, true, 0); // 10s = partial bonus
    expect(fastScore).toBe(100);
    expect(slowScore).toBeLessThan(fastScore);
    expect(slowScore).toBeGreaterThan(10); // Scaled base: 100/10 = 10
  });

  it('gives base score only after TIME_DECAY_RATE (20s)', () => {
    const score = calculateScore(GAME.TIME_DECAY_RATE, true, 0);
    expect(score).toBe(10); // Scaled base: 100/10 = 10
  });

  it('subtracts points for using hints', () => {
    const scoreWithoutHints = calculateScore(2, true, 0);
    const scoreWithHints = calculateScore(2, true, 1);

    expect(scoreWithHints).toBe(scoreWithoutHints - 5); // Scaled penalty: 50/10 = 5
  });

  it('never returns negative scores', () => {
    const score = calculateScore(2, true, 100); // Many hints
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('Streak Logic', () => {
  it('calculates streak bonus correctly', () => {
    const streak = 3;
    const bonus = calculateStreakBonus(streak);
    // Base reward + (streak * per day)
    const expected = REWARDS.CHALLENGE_COMPLETE + streak * REWARDS.STREAK_BONUS_PER_DAY;
    expect(bonus).toBe(expected);
  });
});

describe('Score Tiers (scoring.ts)', () => {
  it('returns "Perfect!" for 90+', () => {
    expect(getScoreTier(95)).toBe('Perfect!');
    expect(getScoreTierColor(95)).toContain('emerald');
  });

  it('returns "Excellent" for 75-89', () => {
    expect(getScoreTier(80)).toBe('Excellent');
    expect(getScoreTierColor(80)).toContain('green');
  });

  it('returns "Good" for 50-74', () => {
    expect(getScoreTier(60)).toBe('Good');
    expect(getScoreTierColor(60)).toContain('yellow');
  });

  it('returns "Fair" for 30-49', () => {
    expect(getScoreTier(40)).toBe('Fair');
    expect(getScoreTierColor(40)).toContain('orange');
  });

  it('returns "Slow" for >0 but <30', () => {
    expect(getScoreTier(10)).toBe('Slow');
    expect(getScoreTierColor(10)).toContain('red');
  });

  it('returns "Wrong" for 0', () => {
    expect(getScoreTier(0)).toBe('Wrong');
    expect(getScoreTierColor(0)).toContain('rose');
  });
});
