/* eslint-disable no-magic-numbers */
// ==================== TIME CONSTANTS ====================
export const TIME = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,

  // Specific timeouts
  FEEDBACK_DELAY: 2000,
  AUTO_ADVANCE_DELAY: 1000,
  ANIMATION_DURATION: 300,
  SUMMARY_ANIMATION_DELAY: 3000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;

// ==================== UI & THEME ====================
export const UI = {
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
  },
  PERFORMANCE_THRESHOLDS: {
    EXCELLENT: 0.9,
    GOOD: 0.7,
    FAIR: 0.5,
  },
  ACHIEVEMENT_COMPLETION_THRESHOLD: 0.99,
} as const;

// ==================== GAME CONFIG ====================
export const GAME = {
  QUESTIONS_PER_GAME: 10,
  MAX_HINTS: 3,
  TIME_BONUS_THRESHOLD: 5, // seconds

  // Scoring
  POINTS: {
    CORRECT_BASE: 100,
    TIME_BONUS_MAX: 50,
    HINT_PENALTY: 20,
    STREAK_MULTIPLIER: 1.1,
  },

  // Scoring Tiers (Accuracy % or Time)
  SCORING_TIERS: {
    PERFECT: 90,
    GREAT: 75,
    GOOD: 50,
    OKAY: 30,
  },
} as const;

export const GAME_LOGIC = {
  OPTIONS_COUNT: 4,
  DISTRACTORS_COUNT: 3,
  SHUFFLE_SEED_OFFSET: 50,
  QUESTION_SEED_MULTIPLIER: 100,
  DAILY_CHALLENGE: {
    SEED_MULTIPLIER: 10000,
    STREET_INDEX_MOD_4: 4,
    STREET_INDEX_MOD_6: 6,
    STREET_INDEX_MOD_8: 8,
    MIN_STREET_LENGTH: 3,
    MAX_STREET_LENGTH: 4,
    TARGET_STREET_COUNT: 7,
  },
} as const;

// ==================== USER SYSTEM ====================
export const USER = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    CORE_NAME_MAX: 10, // chars before 4-digit suffix
    SUFFIX_MIN: 1000,
    SUFFIX_MAX: 9999,
    DEFAULT_NAME: 'User',
  },

  HANDLE_FORMATS: {
    OLD_REGEX: /.*#\d{4}$/,
    NEW_REGEX: /^@[a-zA-Z0-9]+\d{4}$/,
    EXCESSIVE_DIGITS: /\d{5,}$/,
  },
};

// ==================== SOCIAL & LIMITS ====================
export const SOCIAL = {
  FRIENDS: {
    MAX_DISPLAY: 5,
    SEARCH_LIMIT: 20,
  },
  LEADERBOARD: {
    DISPLAY_LIMIT: 50,
    MIN_SCORE_FOR_RANKING: 2000,
    DEFAULT_LIMIT: 6,
    FETCH_LIMIT: 2000,
  },
  HISTORY: {
    MAX_ITEMS: 500, // Safe limit for array operations
    BATCH_SIZE: 50,
  },
  NEWS: {
    MAX_ITEMS: 20,
  },
};

// ==================== FEEDBACK & PROMPTS ====================
export const FEEDBACK = {
  PROMPT_INTERVAL: TIME.ONE_WEEK,
  PROMPT_CHANCE: 1 / 7, // 14.3% chance per completion
  MIN_GAMES_BEFORE_PROMPT: 5,
};

// ==================== MIGRATION & SYNC ====================
export const MIGRATION = {
  MAX_HISTORY_UPLOAD: 500, // prevent rate limit
  BATCH_SIZE: 50,
  RETRY_ATTEMPTS: 3,
};

// ==================== REWARDS ====================
export const REWARDS = {
  DAILY_LOGIN: 10,
  CHALLENGE_COMPLETE: 50,
  STREAK_BONUS_PER_DAY: 5,
  REFERRAL_BONUS: 100,
  FEEDBACK_APPROVAL: 25,
};

// ==================== STORAGE KEYS ====================
export const STORAGE_KEYS = {
  USERNAME: 'girify_username',
  HISTORY: 'girify_history',
  LAST_FEEDBACK: 'girify_last_feedback',
  AUTO_ADVANCE: 'girify_auto_advance',
  PURCHASED: 'girify_purchased',
  EQUIPPED: 'girify_equipped',
  GIUROS: 'girify_giuros',
  REFERRER: 'girify_referrer',
  JOINED: 'girify_joined',

  // Migration flags
  HISTORY_SYNCED: 'girify_history_synced',
  COSMETICS_SYNCED: 'girify_cosmetics_synced',

  // App state
  THEME_MODE: 'girify_theme_mode',
  LANGUAGE: 'girify_language',
  ONBOARDING_COMPLETED: 'girify_onboarding_completed',
  INSTRUCTIONS_SEEN: 'girify_instructions_seen',
  REAL_NAME: 'girify_realName',
};

// ==================== STREET FILTERS ====================
export const STREET_FILTERS = {
  EXCLUDED_TYPES: ['autopista', 'autovia', 'ronda', 'b-1', 'b-2'],
  MIN_GEOMETRY_LENGTH: 1,
  RETRY_ATTEMPTS: 3,
};

// ==================== API LIMITS ====================
export const API = {
  RATE_LIMIT_DELAY: 100, // ms between requests
  MAX_RETRIES: 3,
  TIMEOUT: 10000, // 10 seconds
  HTTP: {
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500,
  },
};

export const BADGES = {
  NIGHT_START: 2,
  NIGHT_END: 5,
  WRONG_STREAK: 5,
  QUICK_GUESS_TIME: 3,
};

export const PRNG = {
  PRIME_1: 71,
  PRIME_2: 17,
  MOD_4: 4,
  MOD_6: 6,
  MOD_8: 8,
  SEED_SCALE: 10000,
};

export const NEARBY_THRESHOLD = 0.003;
