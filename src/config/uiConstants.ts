/**
 * Application Constants
 *
 * Centralized magic numbers for timeouts, animations, and UI values.
 */

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  TOAST_SHORT: 2000,
  TOAST_MEDIUM: 3000,
  TOAST_LONG: 5000,
  ANIMATION_FAST: 200,
  ANIMATION_MEDIUM: 400,
  ANIMATION_SLOW: 800,
  DEBOUNCE_DEFAULT: 300,
  CAPTCHA_REFRESH_DELAY: 100,
  SUBMIT_DELAY: 2000,
} as const;

// Opacity values
export const OPACITY = {
  LOW: 0.1,
  MEDIUM: 0.3,
  HIGH: 0.7,
  SUBTLE: 0.4,
  FADED: 0.5,
  NEAR_OPAQUE: 0.9,
} as const;

// Z-index layers
export const Z_INDEX = {
  MODAL: 9999,
  OVERLAY: 8000,
  DROPDOWN: 1000,
  TOOLTIP: 500,
  HEADER: 100,
} as const;

// Animation durations
export const ANIMATION = {
  DURATION_FAST: 0.2,
  DURATION_MEDIUM: 0.4,
  DURATION_SLOW: 0.8,
  SPRING_DAMPING: 20,
  SPRING_STIFFNESS: 300,
} as const;

// UI sizes
export const SIZES = {
  AVATAR_SMALL: 24,
  AVATAR_MEDIUM: 48,
  AVATAR_LARGE: 96,
  ICON_SMALL: 16,
  ICON_MEDIUM: 24,
  ICON_LARGE: 32,
} as const;

// Game constants
export const GAME = {
  MAX_SCORE: 1000,
  QUESTIONS_PER_GAME: 10,
  HINT_PENALTY: 100,
  TIME_BONUS_THRESHOLD: 5,
  STREAK_MULTIPLIER: 1.1,
} as const;
