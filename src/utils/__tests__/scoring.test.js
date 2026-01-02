import { describe, it, expect } from 'vitest';
import { calculateTimeScore, getScoreTier, getScoreTierColor } from '../scoring';

describe('Scoring System', () => {
  describe('calculateTimeScore', () => {
    describe('correct answers', () => {
      it('should return 100 points for answers under 5 seconds', () => {
        expect(calculateTimeScore(0, true)).toBe(100);
        expect(calculateTimeScore(2, true)).toBe(100);
        expect(calculateTimeScore(4.9, true)).toBe(100);
      });

      it('should return 20 points for answers over 25 seconds', () => {
        expect(calculateTimeScore(26, true)).toBe(20);
        expect(calculateTimeScore(30, true)).toBe(20);
        expect(calculateTimeScore(100, true)).toBe(20);
      });

      it('should linearly decrease points between 5 and 25 seconds', () => {
        // At 5 seconds: 100 points
        expect(calculateTimeScore(5, true)).toBe(100);

        // At 10 seconds: 100 - 4*(10-5) = 80 points
        expect(calculateTimeScore(10, true)).toBe(80);

        // At 15 seconds: 100 - 4*(15-5) = 60 points
        expect(calculateTimeScore(15, true)).toBe(60);

        // At 20 seconds: 100 - 4*(20-5) = 40 points
        expect(calculateTimeScore(20, true)).toBe(40);

        // At 25 seconds: 100 - 4*(25-5) = 20 points
        expect(calculateTimeScore(25, true)).toBe(20);
      });

      it('should round points to nearest integer', () => {
        // 7.5 seconds: 100 - 4*(7.5-5) = 100 - 10 = 90
        expect(calculateTimeScore(7.5, true)).toBe(90);

        // 12.3 seconds: 100 - 4*(12.3-5) = 100 - 29.2 = 70.8 → 71
        expect(calculateTimeScore(12.3, true)).toBe(71);
      });

      it('should ignore hints count (no penalty)', () => {
        // Same score regardless of hints
        expect(calculateTimeScore(10, true, 0)).toBe(80);
        expect(calculateTimeScore(10, true, 1)).toBe(80);
        expect(calculateTimeScore(10, true, 2)).toBe(80);
        expect(calculateTimeScore(10, true, 3)).toBe(80);
      });
    });

    describe('incorrect answers', () => {
      it('should return 0 points for incorrect answers', () => {
        expect(calculateTimeScore(0, false)).toBe(0);
        expect(calculateTimeScore(5, false)).toBe(0);
        expect(calculateTimeScore(10, false)).toBe(0);
        expect(calculateTimeScore(100, false)).toBe(0);
      });

      it('should return 0 points regardless of hints for incorrect answers', () => {
        expect(calculateTimeScore(10, false, 0)).toBe(0);
        expect(calculateTimeScore(10, false, 3)).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should handle exactly 5 seconds', () => {
        expect(calculateTimeScore(5, true)).toBe(100);
      });

      it('should handle exactly 25 seconds', () => {
        expect(calculateTimeScore(25, true)).toBe(20);
      });

      it('should handle 0 seconds (instant answer)', () => {
        expect(calculateTimeScore(0, true)).toBe(100);
      });

      it('should handle very large time values', () => {
        expect(calculateTimeScore(1000, true)).toBe(20);
        expect(calculateTimeScore(9999, true)).toBe(20);
      });

      it('should handle decimal time values', () => {
        expect(calculateTimeScore(8.7, true)).toBe(85);
        expect(calculateTimeScore(13.2, true)).toBe(67);
      });
    });
  });

  describe('getScoreTier', () => {
    it('should return "Perfect!" for scores >= 90', () => {
      expect(getScoreTier(90)).toBe('Perfect!');
      expect(getScoreTier(95)).toBe('Perfect!');
      expect(getScoreTier(100)).toBe('Perfect!');
    });

    it('should return "Excellent" for scores 75-89', () => {
      expect(getScoreTier(75)).toBe('Excellent');
      expect(getScoreTier(80)).toBe('Excellent');
      expect(getScoreTier(89)).toBe('Excellent');
    });

    it('should return "Good" for scores 50-74', () => {
      expect(getScoreTier(50)).toBe('Good');
      expect(getScoreTier(60)).toBe('Good');
      expect(getScoreTier(74)).toBe('Good');
    });

    it('should return "Fair" for scores 30-49', () => {
      expect(getScoreTier(30)).toBe('Fair');
      expect(getScoreTier(40)).toBe('Fair');
      expect(getScoreTier(49)).toBe('Fair');
    });

    it('should return "Slow" for scores 1-29', () => {
      expect(getScoreTier(1)).toBe('Slow');
      expect(getScoreTier(15)).toBe('Slow');
      expect(getScoreTier(29)).toBe('Slow');
    });

    it('should return "Wrong" for score of 0', () => {
      expect(getScoreTier(0)).toBe('Wrong');
    });

    it('should handle boundary values correctly', () => {
      expect(getScoreTier(89.9)).toBe('Excellent');
      expect(getScoreTier(90)).toBe('Perfect!');
      expect(getScoreTier(74.9)).toBe('Good');
      expect(getScoreTier(75)).toBe('Excellent');
    });
  });

  describe('getScoreTierColor', () => {
    it('should return emerald for Perfect scores (>= 90)', () => {
      expect(getScoreTierColor(90)).toBe('text-emerald-500');
      expect(getScoreTierColor(100)).toBe('text-emerald-500');
    });

    it('should return green for Excellent scores (75-89)', () => {
      expect(getScoreTierColor(75)).toBe('text-green-500');
      expect(getScoreTierColor(85)).toBe('text-green-500');
    });

    it('should return yellow for Good scores (50-74)', () => {
      expect(getScoreTierColor(50)).toBe('text-yellow-500');
      expect(getScoreTierColor(65)).toBe('text-yellow-500');
    });

    it('should return orange for Fair scores (30-49)', () => {
      expect(getScoreTierColor(30)).toBe('text-orange-500');
      expect(getScoreTierColor(45)).toBe('text-orange-500');
    });

    it('should return red for Slow scores (1-29)', () => {
      expect(getScoreTierColor(1)).toBe('text-red-500');
      expect(getScoreTierColor(20)).toBe('text-red-500');
    });

    it('should return rose for Wrong scores (0)', () => {
      expect(getScoreTierColor(0)).toBe('text-rose-500');
    });

    it('should match tier labels with colors', () => {
      const testCases = [
        { score: 100, tier: 'Perfect!', color: 'text-emerald-500' },
        { score: 80, tier: 'Excellent', color: 'text-green-500' },
        { score: 60, tier: 'Good', color: 'text-yellow-500' },
        { score: 40, tier: 'Fair', color: 'text-orange-500' },
        { score: 20, tier: 'Slow', color: 'text-red-500' },
        { score: 0, tier: 'Wrong', color: 'text-rose-500' },
      ];

      testCases.forEach(({ score, tier, color }) => {
        expect(getScoreTier(score)).toBe(tier);
        expect(getScoreTierColor(score)).toBe(color);
      });
    });
  });

  describe('Integration: Time to Score to Tier', () => {
    it('should give Perfect tier for very fast answers', () => {
      const score = calculateTimeScore(3, true);
      const tier = getScoreTier(score);
      expect(tier).toBe('Perfect!');
    });

    it('should give Excellent tier for fast answers', () => {
      const score = calculateTimeScore(8, true);
      const tier = getScoreTier(score);
      expect(tier).toBe('Excellent');
    });

    it('should give Good tier for medium answers', () => {
      const score = calculateTimeScore(15, true);
      const tier = getScoreTier(score);
      expect(tier).toBe('Good');
    });

    it('should give Fair tier for slow answers', () => {
      const score = calculateTimeScore(20, true);
      const tier = getScoreTier(score);
      expect(tier).toBe('Fair');
    });

    it('should give Slow tier for very slow answers', () => {
      const score = calculateTimeScore(24, true);
      const tier = getScoreTier(score);
      expect(tier).toBe('Slow');
    });

    it('should give Wrong tier for incorrect answers', () => {
      const score = calculateTimeScore(5, false);
      const tier = getScoreTier(score);
      expect(tier).toBe('Wrong');
    });
  });
});
