import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useScoreCalculator } from '../useScoreCalculator';

describe('useScoreCalculator', () => {
  it('returns a calculateScore function', () => {
    const { result } = renderHook(() => useScoreCalculator());
    expect(typeof result.current.calculateScore).toBe('function');
  });

  it('calculates score correctly via hook', () => {
    const { result } = renderHook(() => useScoreCalculator());
    const score = result.current.calculateScore(0, true, 0);
    // Unscaled max: 100 + 900 = 1000
    expect(score).toBe(1000);
  });

  it('function reference remains stable (useCallback)', () => {
    const { result, rerender } = renderHook(() => useScoreCalculator());
    const firstRef = result.current.calculateScore;

    rerender();
    const secondRef = result.current.calculateScore;

    expect(firstRef).toBe(secondRef);
  });
});
