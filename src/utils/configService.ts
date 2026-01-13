/**
 * Configuration Service
 * Fetches and caches app configuration from Firestore.
 * Allows dynamic configuration of payouts without code changes.
 */
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CONFIG_DOC = 'settings';
const CONFIG_COLLECTION = 'config';

// Default payout values (fallback if Firestore config doesn't exist)
const DEFAULT_PAYOUTS = {
  STARTING_GIUROS: 100, // Increased for better onboarding
  DAILY_LOGIN_BONUS: 50, // Increased significantly
  DAILY_CHALLENGE_BONUS: 100, // Main source of income
  STREAK_WEEK_BONUS: 250, // Big reward for consistency
  PERFECT_SCORE_BONUS: 50, // Skill reward
  REFERRAL_BONUS: 500, // Growth incentive
} as const;

export type PayoutConfig = typeof DEFAULT_PAYOUTS;

// In-memory cache
let cachedPayouts: PayoutConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get payout configuration from Firestore with caching
 * @returns {Promise<PayoutConfig>}
 */
export const getPayoutConfig = async (): Promise<PayoutConfig> => {
  const now = Date.now();

  // Return cached if still valid
  if (cachedPayouts && now - cacheTimestamp < CACHE_TTL) {
    return cachedPayouts;
  }

  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    const configDoc = await getDoc(configRef);

    if (configDoc.exists() && configDoc.data().payouts) {
      // Cast the result to PayoutConfig (safe assumption for now, ideally validate)
      cachedPayouts = { ...DEFAULT_PAYOUTS, ...configDoc.data().payouts } as PayoutConfig;
    } else {
      // Initialize with defaults if doesn't exist
      cachedPayouts = DEFAULT_PAYOUTS;
    }

    cacheTimestamp = now;
    return cachedPayouts;
  } catch (e) {
    console.error('Error fetching payout config:', e);
    return DEFAULT_PAYOUTS;
  }
};

/**
 * Update payout configuration in Firestore (admin only)
 * @param {Partial<PayoutConfig>} updates
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updatePayoutConfig = async (updates: Partial<PayoutConfig>): Promise<{ success: boolean, error?: string }> => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    const configDoc = await getDoc(configRef);

    const currentPayouts = configDoc.exists()
      ? { ...DEFAULT_PAYOUTS, ...configDoc.data().payouts }
      : DEFAULT_PAYOUTS;

    const newPayouts = { ...currentPayouts, ...updates };

    await setDoc(configRef, { payouts: newPayouts }, { merge: true });

    // Clear cache to force refresh
    cachedPayouts = newPayouts as PayoutConfig;
    cacheTimestamp = Date.now();

    // eslint-disable-next-line no-console
    console.log('[Config] Payout config updated:', newPayouts);

    return { success: true };
  } catch (e: any) {
    console.error('Error updating payout config:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Get default payouts (for display/comparison)
 * @returns {PayoutConfig}
 */
export const getDefaultPayouts = (): PayoutConfig => DEFAULT_PAYOUTS;

/**
 * Clear the cache (useful for testing or admin refresh)
 */
export const clearPayoutCache = (): void => {
  cachedPayouts = null;
  cacheTimestamp = 0;
};
