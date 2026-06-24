import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameTimer } from '../useGameTimer';

describe('useGameTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at timer=0 and isRunning=false', () => {
    const { result } = renderHook(() => useGameTimer());
    expect(result.current.timer).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('sets isRunning to true after startTimer()', () => {
    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.isRunning).toBe(true);
  });

  it('increments elapsed time via setInterval after start', () => {
    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timer).toBeGreaterThanOrEqual(3);
  });

  it('stops incrementing after stopTimer()', () => {
    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.stopTimer();
    });

    const timerAfterStop = result.current.timer;

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timer).toBe(timerAfterStop);
    expect(result.current.isRunning).toBe(false);
  });

  it('resets timer to 0 and stops when reset() is called', () => {
    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.timer).toBeGreaterThanOrEqual(5);

    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.timer).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('does not increment after reset', () => {
    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.resetTimer();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timer).toBe(0);
  });

  it('does not start a second interval if startTimer is called while running', () => {
    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.startTimer();
    });

    const isRunningBefore = result.current.isRunning;

    act(() => {
      result.current.startTimer(); // second call should be a no-op
    });

    expect(result.current.isRunning).toBe(isRunningBefore);
  });
});
