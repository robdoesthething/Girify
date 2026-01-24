/**
 * Application Constants
 *
 * Centralized magic numbers and configuration values.
 */

// =============================================================================
// TIMEOUTS (in milliseconds)
// =============================================================================

/** Default toast/message display duration */
export const TOAST_TIMEOUT_MS = 3000;

/** Short toast for quick confirmations */
export const TOAST_SHORT_MS = 2000;

/** Long toast for important messages */
export const TOAST_LONG_MS = 5000;

/** Debounce delay for search inputs */
export const SEARCH_DEBOUNCE_MS = 300;

/** Delay before checking user district */
export const DISTRICT_CHECK_DELAY_MS = 2000;

/** Animation durations */
export const ANIMATION_DURATION_MS = 300;

/** API request timeout */
export const API_TIMEOUT_MS = 5000;

// =============================================================================
// AVATAR CONFIGURATION
// =============================================================================

/** Total number of available avatar images */
export const AVATAR_COUNT = 20;

/** Minimum avatar ID */
export const AVATAR_MIN_ID = 1;

/** Generate a random avatar ID */
export function getRandomAvatarId(): number {
  return Math.floor(Math.random() * AVATAR_COUNT) + AVATAR_MIN_ID;
}

// =============================================================================
// USERNAME CONFIGURATION
// =============================================================================

/** Maximum username length */
export const MAX_USERNAME_LENGTH = 20;

/** Minimum username length */
export const MIN_USERNAME_LENGTH = 2;

/** Username validation regex (alphanumeric, underscores, hyphens) */
export const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

// =============================================================================
// PAGINATION
// =============================================================================

/** Default items per page in lists */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum items to fetch for admin lists */
export const ADMIN_LIST_LIMIT = 100;

/** Leaderboard fetch multiplier for deduplication */
export const LEADERBOARD_FETCH_MULTIPLIER = 4;

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/** Firestore batch write size limit */
export const FIRESTORE_BATCH_SIZE = 200;

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

/** Number of questions per game */
export const QUESTIONS_PER_GAME = 5;

/** Maximum score per question */
export const MAX_SCORE_PER_QUESTION = 1000;

/** Score decay rate per second */
export const SCORE_DECAY_PER_SECOND = 100;

// =============================================================================
// RANDOM HANDLE GENERATION
// =============================================================================

/** Random suffix range for generated handles */
export const HANDLE_SUFFIX_MIN = 1000;
export const HANDLE_SUFFIX_MAX = 9999;

/** Generate random handle suffix */
export function getRandomHandleSuffix(): number {
  return Math.floor(
    HANDLE_SUFFIX_MIN + Math.random() * (HANDLE_SUFFIX_MAX - HANDLE_SUFFIX_MIN + 1)
  );
}
