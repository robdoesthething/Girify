// ==================== TIME CONSTANTS ====================
export const TIME = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,

  // Specific timeouts
  FEEDBACK_DELAY: 2000,
  AUTO_ADVANCE_DELAY: 1000,
  ANIMATION_DURATION: 300,
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
};

// ==================== API LIMITS ====================
export const API = {
  RATE_LIMIT_DELAY: 100, // ms between requests
  MAX_RETRIES: 3,
  TIMEOUT: 10000, // 10 seconds
};
