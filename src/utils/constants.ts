/**
 * Application Constants
 *
 * Centralized definition of constant values to avoid magic numbers.
 */

export const GAME = {
  SESSION_TTL_SECONDS: 3600, // 1 hour
  LEADERBOARD_FETCH_MULTIPLIER: 4,
};

export const DEBUG = {
  MAX_LOGS: 50,
};

export const CONFIG = {
  RETRY_ATTEMPTS: 5,
  RETRY_DELAY_MS: 60, // or seconds? Context suggests it might be seconds or a specific small delay.
  // Checking usage: ensure usage context matches value.
};

export const UI = {
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    PROFILE_HISTORY_LIMIT: 8,
    PROFILE_FRIENDS_LIMIT: 6,
    PROFILE_ITEMS_LIMIT: 4,
  },
  ANIMATION: {
    DURATION_FAST: 0.05,
  },
};

export const DATE = {
  DAYS_IN_WEEK: 7,
  SUNDAY_INDEX: 0,
  SATURDAY_INDEX: 6,
  PARSING: {
    YYYYMMDD_LENGTH: 8,
    YEAR_LEN: 4,
    MONTH_LEN: 2,
    DAY_LEN: 2,
    BASE_10: 10,
  },
};

export const HTTP = {
  STATUS: {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    TOO_MANY_REQUESTS: 429,
  },
};

export const TIME = {
  SECONDS_PER_MINUTE: 60,
  MS_PER_SECOND: 1000,
};

export const CACHE = {
  TTL_MINUTES: 5,
};
