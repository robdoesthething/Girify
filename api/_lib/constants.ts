export const BEARER_PREFIX = 'Bearer ';
export const BEARER_PREFIX_LENGTH = 7;
export const CORS_MAX_AGE_SECONDS = 86400;

export const RATE_LIMIT_DEFAULTS = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
};

export const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
};

export const SUPABASE_ERROR_CODES = {
  NO_ROWS_FOUND: 'PGRST116',
};

export const PROMOTION_CONSTANTS = {
  DEV_TAP_THRESHOLD: 7,
};
