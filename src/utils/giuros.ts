import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getPayoutConfig } from './configService';
import { calculateStreakBonus } from '../config/gameConfig';

const USERS_COLLECTION = 'users';

// Default Constants (used as fallback, actual values come from config)
export const STARTING_GIUROS = 10;
export const DAILY_LOGIN_BONUS = 2;
export const DAILY_CHALLENGE_BONUS = 5;
export const STREAK_WEEK_BONUS = 10;
export const PERFECT_SCORE_BONUS = 20;
export const REFERRAL_BONUS = 15;

/**
 * Get user's current giuros balance
 * @param {string} username
 * @returns {Promise<number>}
 */
/**
 * Get user's current giuros balance
 * @param {string} username
 * @returns {Promise<number>}
 */
export const getGiuros = async (username: string | null): Promise<number> => {
  if (!username) {
    return 0;
  }
  try {
    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data()?.giuros ?? STARTING_GIUROS;
    }
    return STARTING_GIUROS;
  } catch (e) {
    console.error('Error getting giuros:', e);
    return 0;
  }
};

/**
 * Add giuros to user's balance
 * @param {string} username
 * @param {number} amount
 * @param {string} reason - For logging/audit
 * @returns {Promise<{success: boolean, newBalance: number}>}
 */
export const addGiuros = async (
  username: string | null,
  amount: number,
  reason: string = ''
): Promise<{ success: boolean; newBalance: number }> => {
  if (!username || amount <= 0) {
    return { success: false, newBalance: 0 };
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, newBalance: 0 };
    }

    const currentBalance = userDoc.data()?.giuros ?? STARTING_GIUROS;
    const newBalance = currentBalance + amount;

    await updateDoc(userRef, { giuros: newBalance });

    // eslint-disable-next-line no-console
    console.log(`[Giuros] +${amount} for ${username} (${reason}). New balance: ${newBalance}`);

    return { success: true, newBalance };
  } catch (e) {
    console.error('Error adding giuros:', e);
    return { success: false, newBalance: 0 };
  }
};

/**
 * Award giuros (wrapper for feedback/other general rewards)
 * @param {string} username
 * @param {number} amount
 * @returns {Promise<{success: boolean, newBalance: number}>}
 */
/**
 * Award giuros (wrapper for feedback/other general rewards)
 * @param {string} username
 * @param {number} amount
 * @returns {Promise<{success: boolean, newBalance: number}>}
 */
export const awardGiuros = (username: string | null, amount: number) =>
  addGiuros(username, amount, 'reward');

/**
 * Spend giuros on a cosmetic item
 * @param {string} username
 * @param {number} cost
 * @param {string} itemId
 * @returns {Promise<{success: boolean, error?: string, newBalance?: number}>}
 */
export const spendGiuros = async (
  username: string | null,
  cost: number,
  itemId: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
  if (!username || cost <= 0 || !itemId) {
    return { success: false, error: 'Invalid parameters' };
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const data = userDoc.data();
    const currentBalance = data?.giuros ?? STARTING_GIUROS;

    if (currentBalance < cost) {
      return { success: false, error: 'Insufficient giuros' };
    }

    const purchasedCosmetics: string[] = data?.purchasedCosmetics || [];

    // Check if already purchased (for non-consumable items)
    if (purchasedCosmetics.includes(itemId) && !itemId.startsWith('handle_change')) {
      return { success: false, error: 'Already owned' };
    }

    const newBalance = currentBalance - cost;
    const newPurchases = [...purchasedCosmetics, itemId];

    await updateDoc(userRef, {
      giuros: newBalance,
      purchasedCosmetics: newPurchases,
    });

    // eslint-disable-next-line no-console
    console.log(
      `[Giuros] -${cost} for ${username} (purchased ${itemId}). New balance: ${newBalance}`
    );

    // Publish activity for friend feed (async, don't await)
    // @ts-ignore - Dynamic import of JS file? Need to check strictness
    import('./publishActivity').then(({ publishCosmeticPurchase }) => {
      // Determine item type from ID prefix
      let itemType = 'item';
      if (itemId.startsWith('badge_')) {
        itemType = 'badge';
      } else if (itemId.startsWith('frame_')) {
        itemType = 'frame';
      } else if (itemId.startsWith('title_')) {
        itemType = 'title';
      }

      publishCosmeticPurchase(username, itemId, itemId, itemType);
    });

    return { success: true, newBalance };
  } catch (e: any) {
    console.error('Error spending giuros:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Claim daily login bonus (once per day)
 * @param {string} username
 * @returns {Promise<{claimed: boolean, bonus: number, newBalance: number}>}
 */
/**
 * Claim daily login bonus (once per day)
 * @param {string} username
 * @returns {Promise<{claimed: boolean, bonus: number, newBalance: number}>}
 */
export const claimDailyLoginBonus = async (
  username: string | null
): Promise<{ claimed: boolean; bonus: number; newBalance: number }> => {
  if (!username) {
    return { claimed: false, bonus: 0, newBalance: 0 };
  }

  try {
    // Fetch dynamic config
    const config = await getPayoutConfig();
    const dailyBonus = config.DAILY_LOGIN_BONUS;
    const startingGiuros = config.STARTING_GIUROS;

    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { claimed: false, bonus: 0, newBalance: 0 };
    }

    const data = userDoc.data();
    const today = new Date().toDateString();
    const lastLogin = data?.lastLoginDate;

    // Already claimed today
    if (lastLogin === today) {
      return { claimed: false, bonus: 0, newBalance: data?.giuros ?? startingGiuros };
    }

    const currentBalance = data?.giuros ?? startingGiuros;
    const newBalance = currentBalance + dailyBonus;

    await updateDoc(userRef, {
      giuros: newBalance,
      lastLoginDate: today,
    });

    // eslint-disable-next-line no-console
    console.log(`[Giuros] Daily login bonus +${dailyBonus} for ${username}`);

    return { claimed: true, bonus: dailyBonus, newBalance };
  } catch (e) {
    console.error('Error claiming daily login:', e);
    return { claimed: false, bonus: 0, newBalance: 0 };
  }
};

/**
 * Award bonus for completing daily challenge
 * @param {string} username
 * @param {number} streak - Current streak for bonus calculation
 * @returns {Promise<{bonus: number, newBalance: number}>}
 */
export const awardChallengeBonus = async (
  username: string | null,
  streak: number = 0
): Promise<{ bonus: number; newBalance: number }> => {
  if (!username) {
    return { bonus: 0, newBalance: 0 };
  }

  // Use centralized game config for calculation
  const bonus = calculateStreakBonus(streak);

  const result = await addGiuros(username, bonus, `daily challenge (streak: ${streak})`);
  return { bonus, newBalance: result.newBalance };
};

/**
 * Award referral bonus when referred user completes first game
 * @param {string} referrerUsername
 * @returns {Promise<{success: boolean, newBalance: number}>}
 */
export const awardReferralBonus = async (
  referrerUsername: string | null
): Promise<{ success: boolean; newBalance: number }> => {
  if (!referrerUsername) {
    return { success: false, newBalance: 0 };
  }

  // Fetch dynamic config
  const config = await getPayoutConfig();
  const result = await addGiuros(referrerUsername, config.REFERRAL_BONUS, 'referral completed');
  return { success: result.success, newBalance: result.newBalance };
};

/**
 * Get user's purchased cosmetics list
 * @param {string} username
 * @returns {Promise<string[]>}
 */
export const getPurchasedCosmetics = async (username: string | null): Promise<string[]> => {
  if (!username) {
    return [];
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data()?.purchasedCosmetics || [];
    }
    return [];
  } catch (e) {
    console.error('Error getting purchased cosmetics:', e);
    return [];
  }
};

/**
 * Set active cosmetics (equipped items)
 * @param {string} username
 * @param {object} equipped - { frameId, badgeIds, titleId }
 */
export const setEquippedCosmetics = async (
  username: string | null,
  equipped: Record<string, any>
): Promise<void> => {
  if (!username) {
    return;
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, username);
    await updateDoc(userRef, { equippedCosmetics: equipped });
  } catch (e) {
    console.error('Error setting equipped cosmetics:', e);
  }
};

/**
 * Get equipped cosmetics
 * @param {string} username
 * @returns {Promise<{frameId?: string, badgeIds?: string[], titleId?: string}>}
 */
export const getEquippedCosmetics = async (
  username: string | null
): Promise<{ frameId?: string; badgeIds?: string[]; titleId?: string } | {}> => {
  if (!username) {
    return {};
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data()?.equippedCosmetics || {};
    }
    return {};
  } catch (e) {
    console.error('Error getting equipped cosmetics:', e);
    return {};
  }
};
