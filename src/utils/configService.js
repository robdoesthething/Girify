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
  STARTING_GIUROS: 10,
  DAILY_LOGIN_BONUS: 2,
  DAILY_CHALLENGE_BONUS: 5,
  STREAK_WEEK_BONUS: 10,
  PERFECT_SCORE_BONUS: 20,
  REFERRAL_BONUS: 15,
};

// In-memory cache
let cachedPayouts = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get payout configuration from Firestore with caching
 * @returns {Promise<typeof DEFAULT_PAYOUTS>}
 */
export const getPayoutConfig = async () => {
  const now = Date.now();

  // Return cached if still valid
  if (cachedPayouts && now - cacheTimestamp < CACHE_TTL) {
    return cachedPayouts;
  }

  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    const configDoc = await getDoc(configRef);

    if (configDoc.exists() && configDoc.data().payouts) {
      cachedPayouts = { ...DEFAULT_PAYOUTS, ...configDoc.data().payouts };
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
 * @param {Partial<typeof DEFAULT_PAYOUTS>} updates
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updatePayoutConfig = async updates => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    const configDoc = await getDoc(configRef);

    const currentPayouts = configDoc.exists()
      ? { ...DEFAULT_PAYOUTS, ...configDoc.data().payouts }
      : DEFAULT_PAYOUTS;

    const newPayouts = { ...currentPayouts, ...updates };

    await setDoc(configRef, { payouts: newPayouts }, { merge: true });

    // Clear cache to force refresh
    cachedPayouts = newPayouts;
    cacheTimestamp = Date.now();

    // eslint-disable-next-line no-console
    console.log('[Config] Payout config updated:', newPayouts);

    return { success: true };
  } catch (e) {
    console.error('Error updating payout config:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Get default payouts (for display/comparison)
 * @returns {typeof DEFAULT_PAYOUTS}
 */
export const getDefaultPayouts = () => DEFAULT_PAYOUTS;

/**
 * Clear the cache (useful for testing or admin refresh)
 */
export const clearPayoutCache = () => {
  cachedPayouts = null;
  cacheTimestamp = 0;
};
