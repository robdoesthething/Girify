/**
 * Configuration Service (Supabase)
 * Replaces Firebase configService.ts and adminConfig.ts
 *
 * Fetches and caches app configuration from Supabase.
 * Allows dynamic configuration of payouts and game settings without code changes.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CACHE, TIME } from '../../utils/constants';
import { supabase } from '../supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface PayoutConfig {
  STARTING_GIUROS: number;
  DAILY_LOGIN_BONUS: number;
  DAILY_CHALLENGE_BONUS: number;
  STREAK_WEEK_BONUS: number;
  PERFECT_SCORE_BONUS: number;
  REFERRAL_BONUS: number;
}

export interface GameConfig {
  maintenanceMode: boolean;
  scoreMultiplier: number;
  giurosMultiplier: number;
  dailyGameLimit: number;
  announcementBar?: string;
  enabledShopCategories: string[];
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_PAYOUTS: PayoutConfig = {
  STARTING_GIUROS: 100,
  DAILY_LOGIN_BONUS: 50,
  DAILY_CHALLENGE_BONUS: 100,
  STREAK_WEEK_BONUS: 250,
  PERFECT_SCORE_BONUS: 50,
  REFERRAL_BONUS: 500,
} as const;

const DEFAULT_GAME_CONFIG: GameConfig = {
  maintenanceMode: false,
  scoreMultiplier: 1.0,
  giurosMultiplier: 1.0,
  dailyGameLimit: 0,
  enabledShopCategories: ['frames', 'titles', 'avatars', 'badges'],
};

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

let cachedPayouts: PayoutConfig | null = null;
let payoutCacheTimestamp = 0;

let cachedGameConfig: GameConfig | null = null;
let gameConfigCacheTimestamp = 0;

// Use 'any' for local table overrides since these tables are not in generated types

type AnySupabaseClient = SupabaseClient<any>;

const CACHE_TTL = CACHE.TTL_MINUTES * TIME.SECONDS_PER_MINUTE * TIME.MS_PER_SECOND; // 5 minutes

// ============================================================================
// PAYOUT CONFIG FUNCTIONS
// ============================================================================

/**
 * Get payout configuration from Supabase with caching
 * @returns {Promise<PayoutConfig>}
 */
export const getPayoutConfig = async (): Promise<PayoutConfig> => {
  const now = Date.now();

  // Return cached if still valid
  if (cachedPayouts && now - payoutCacheTimestamp < CACHE_TTL) {
    return cachedPayouts;
  }

  try {
    const client = supabase as AnySupabaseClient;
    const { data, error } = await client
      .from('app_config')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      console.error('[Config] Error fetching payout config:', error);
      return DEFAULT_PAYOUTS;
    }

    if (data) {
      // Map database column names to PayoutConfig format
      cachedPayouts = {
        STARTING_GIUROS: data.starting_giuros ?? DEFAULT_PAYOUTS.STARTING_GIUROS,
        DAILY_LOGIN_BONUS: data.daily_login_bonus ?? DEFAULT_PAYOUTS.DAILY_LOGIN_BONUS,
        DAILY_CHALLENGE_BONUS: data.daily_challenge_bonus ?? DEFAULT_PAYOUTS.DAILY_CHALLENGE_BONUS,
        STREAK_WEEK_BONUS: data.streak_week_bonus ?? DEFAULT_PAYOUTS.STREAK_WEEK_BONUS,
        PERFECT_SCORE_BONUS: data.perfect_score_bonus ?? DEFAULT_PAYOUTS.PERFECT_SCORE_BONUS,
        REFERRAL_BONUS: data.referral_bonus ?? DEFAULT_PAYOUTS.REFERRAL_BONUS,
      };
    } else {
      cachedPayouts = DEFAULT_PAYOUTS;
    }

    payoutCacheTimestamp = now;
    return cachedPayouts;
  } catch (e) {
    console.error('[Config] Exception fetching payout config:', e);
    return DEFAULT_PAYOUTS;
  }
};

/**
 * Update payout configuration in Supabase (admin only)
 * @param {Partial<PayoutConfig>} updates
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updatePayoutConfig = async (
  updates: Partial<PayoutConfig>
): Promise<{ success: boolean; error?: string }> => {
  // Guard: caller must be an admin
  const { requireAdmin } = await import('../../utils/auth');
  await requireAdmin();

  try {
    // Map PayoutConfig keys to database column names
    const dbUpdates: Record<string, number> = {};

    if (updates.STARTING_GIUROS !== undefined) {
      dbUpdates.starting_giuros = updates.STARTING_GIUROS;
    }
    if (updates.DAILY_LOGIN_BONUS !== undefined) {
      dbUpdates.daily_login_bonus = updates.DAILY_LOGIN_BONUS;
    }
    if (updates.DAILY_CHALLENGE_BONUS !== undefined) {
      dbUpdates.daily_challenge_bonus = updates.DAILY_CHALLENGE_BONUS;
    }
    if (updates.STREAK_WEEK_BONUS !== undefined) {
      dbUpdates.streak_week_bonus = updates.STREAK_WEEK_BONUS;
    }
    if (updates.PERFECT_SCORE_BONUS !== undefined) {
      dbUpdates.perfect_score_bonus = updates.PERFECT_SCORE_BONUS;
    }
    if (updates.REFERRAL_BONUS !== undefined) {
      dbUpdates.referral_bonus = updates.REFERRAL_BONUS;
    }

    const client = supabase as AnySupabaseClient;
    const { error } = await client
      .from('app_config')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', 'default');

    if (error) {
      console.error('[Config] Error updating payout config:', error);
      return { success: false, error: error.message };
    }

    // Clear cache to force refresh
    clearPayoutCache();

    // Fetch fresh data to update cache
    await getPayoutConfig();

    // eslint-disable-next-line no-console
    console.log('[Config] Payout config updated:', updates);
    return { success: true };
  } catch (e: unknown) {
    console.error('[Config] Exception updating payout config:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get default payouts (for display/comparison)
 * @returns {PayoutConfig}
 */
export const getDefaultPayouts = (): PayoutConfig => DEFAULT_PAYOUTS;

/**
 * Clear the payout cache (useful for testing or admin refresh)
 */
export const clearPayoutCache = (): void => {
  cachedPayouts = null;
  payoutCacheTimestamp = 0;
};

// ============================================================================
// GAME CONFIG FUNCTIONS
// ============================================================================

// Validation constants
const MIN_MULTIPLIER = 0.1;
const MAX_MULTIPLIER = 10;
const MAX_DAILY_LIMIT = 100;

/**
 * Validate game config updates
 */
const validateGameConfig = (updates: Partial<GameConfig>): void => {
  if (updates.scoreMultiplier !== undefined) {
    if (updates.scoreMultiplier < MIN_MULTIPLIER || updates.scoreMultiplier > MAX_MULTIPLIER) {
      throw new Error(`scoreMultiplier must be between ${MIN_MULTIPLIER} and ${MAX_MULTIPLIER}`);
    }
  }
  if (updates.giurosMultiplier !== undefined) {
    if (updates.giurosMultiplier < MIN_MULTIPLIER || updates.giurosMultiplier > MAX_MULTIPLIER) {
      throw new Error(`giurosMultiplier must be between ${MIN_MULTIPLIER} and ${MAX_MULTIPLIER}`);
    }
  }
  if (updates.dailyGameLimit !== undefined) {
    if (updates.dailyGameLimit < 0 || updates.dailyGameLimit > MAX_DAILY_LIMIT) {
      throw new Error(`dailyGameLimit must be between 0 and ${MAX_DAILY_LIMIT}`);
    }
  }
};

/**
 * Get game configuration from Supabase with caching
 * @returns {Promise<GameConfig>}
 */
export const getGameConfig = async (): Promise<GameConfig> => {
  const now = Date.now();

  // Return cached if still valid
  if (cachedGameConfig && now - gameConfigCacheTimestamp < CACHE_TTL) {
    return cachedGameConfig;
  }

  try {
    const client = supabase as AnySupabaseClient;
    const { data, error } = await client
      .from('game_config')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      console.error('[Config] Error fetching game config:', error);
      return DEFAULT_GAME_CONFIG;
    }

    if (data) {
      cachedGameConfig = {
        maintenanceMode: data.maintenance_mode ?? DEFAULT_GAME_CONFIG.maintenanceMode,
        scoreMultiplier:
          data.score_multiplier !== null && data.score_multiplier !== undefined
            ? Number(data.score_multiplier)
            : DEFAULT_GAME_CONFIG.scoreMultiplier,
        giurosMultiplier:
          data.giuros_multiplier !== null && data.giuros_multiplier !== undefined
            ? Number(data.giuros_multiplier)
            : DEFAULT_GAME_CONFIG.giurosMultiplier,
        dailyGameLimit: data.daily_game_limit ?? DEFAULT_GAME_CONFIG.dailyGameLimit,
        announcementBar: data.announcement_bar ?? undefined,
        enabledShopCategories:
          data.enabled_shop_categories ?? DEFAULT_GAME_CONFIG.enabledShopCategories,
      };
    } else {
      cachedGameConfig = DEFAULT_GAME_CONFIG;
    }

    gameConfigCacheTimestamp = now;
    return cachedGameConfig;
  } catch (e) {
    console.error('[Config] Exception fetching game config:', e);
    return DEFAULT_GAME_CONFIG;
  }
};

/**
 * Update game configuration in Supabase (admin only)
 * @param {Partial<GameConfig>} updates
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateGameConfig = async (
  updates: Partial<GameConfig>
): Promise<{ success: boolean; error?: string }> => {
  // Guard: caller must be an admin
  const { requireAdmin } = await import('../../utils/auth');
  await requireAdmin();

  try {
    // Validation: Check values before write
    validateGameConfig(updates);

    // Map GameConfig keys to database column names
    const dbUpdates: Record<string, unknown> = {};

    if (updates.maintenanceMode !== undefined) {
      dbUpdates.maintenance_mode = updates.maintenanceMode;
    }
    if (updates.scoreMultiplier !== undefined) {
      dbUpdates.score_multiplier = updates.scoreMultiplier;
    }
    if (updates.giurosMultiplier !== undefined) {
      dbUpdates.giuros_multiplier = updates.giurosMultiplier;
    }
    if (updates.dailyGameLimit !== undefined) {
      dbUpdates.daily_game_limit = updates.dailyGameLimit;
    }
    if (updates.announcementBar !== undefined) {
      dbUpdates.announcement_bar = updates.announcementBar;
    }
    if (updates.enabledShopCategories !== undefined) {
      dbUpdates.enabled_shop_categories = updates.enabledShopCategories;
    }

    const client = supabase as AnySupabaseClient;
    const { error } = await client
      .from('game_config')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', 'default');

    if (error) {
      console.error('[Config] Error updating game config:', error);
      return { success: false, error: error.message };
    }

    // Clear cache to force refresh
    clearGameConfigCache();

    // Fetch fresh data to update cache
    await getGameConfig();

    // eslint-disable-next-line no-console
    console.log('[Config] Game config updated:', updates);
    return { success: true };
  } catch (error) {
    console.error('[Config] Exception updating game config:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Get default game config (for display/comparison)
 * @returns {GameConfig}
 */
export const getDefaultGameConfig = (): GameConfig => DEFAULT_GAME_CONFIG;

/**
 * Clear the game config cache (useful for testing or admin refresh)
 */
export const clearGameConfigCache = (): void => {
  cachedGameConfig = null;
  gameConfigCacheTimestamp = 0;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Payout config
  getPayoutConfig,
  updatePayoutConfig,
  getDefaultPayouts,
  clearPayoutCache,

  // Game config
  getGameConfig,
  updateGameConfig,
  getDefaultGameConfig,
  clearGameConfigCache,
};
