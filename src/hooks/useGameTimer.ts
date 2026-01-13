import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseGameTimerResult {
  timer: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  isRunning: boolean;
}

/**
 * Custom hook for managing a game timer with start, stop, and reset functionality.
 * Tracks elapsed time in seconds with automatic updates.
 *
 * @returns {{
 *   timer: number,
 *   startTimer: Function,
 *   stopTimer: Function,
 *   resetTimer: Function,
 *   isRunning: boolean
 * }}
 *
 * @example
 * const { timer, startTimer, stopTimer, resetTimer, isRunning } = useGameTimer();
 *
 * startTimer(); // Begin counting
 * // timer updates every second
 * stopTimer(); // Pause counting
 * resetTimer(); // Reset to 0
 */
export function useGameTimer(): UseGameTimerResult {
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  /**
   * Start or resume the timer
   */
  const startTimer = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - timer * 1000;
      setIsRunning(true);
    }
  }, [isRunning, timer]);

  /**
   * Stop/pause the timer
   */
  const stopTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Reset timer to 0 and stop
   */
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimer(0);
    startTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle timer updates when running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setTimer(elapsed);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return {
    timer,
    startTimer,
    stopTimer,
    resetTimer,
    isRunning,
  };
}

export default useGameTimer;
