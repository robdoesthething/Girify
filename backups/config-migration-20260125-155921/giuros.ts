import { calculateStreakBonus } from '../config/gameConfig';
import {
  addPurchasedBadge,
  getUserByUsername,
  getUserPurchasedBadges,
  updateUser,
} from '../services/database';
import { getPayoutConfig } from '../services/db/config';
import { publishCosmeticPurchase } from './publishActivity'; // Low priority util, but we can keep importing it if it hasn't been migrated yet, or check if it needs migration.

// Default Constants
export const STARTING_GIUROS = 10;
export const DAILY_LOGIN_BONUS = 2;
export const DAILY_CHALLENGE_BONUS = 5;
export const STREAK_WEEK_BONUS = 10;
export const PERFECT_SCORE_BONUS = 20;
export const REFERRAL_BONUS = 15;

/**
 * Get user's current giuros balance
 */
export const getGiuros = async (username: string | null): Promise<number> => {
  if (!username) {
    return 0;
  }
  try {
    const user = await getUserByUsername(username);
    return user?.giuros ?? STARTING_GIUROS;
  } catch (e) {
    console.error('Error getting giuros:', e);
    return 0;
  }
};

/**
 * Add giuros to user's balance
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
    const user = await getUserByUsername(username);
    if (!user) {
      return { success: false, newBalance: 0 };
    }

    const currentBalance = user.giuros ?? 0;
    const newBalance = currentBalance + amount;

    const success = await updateUser(username, { giuros: newBalance });

    if (success) {
      // eslint-disable-next-line no-console
      console.log(`[Giuros] +${amount} for ${username} (${reason}). New balance: ${newBalance}`);
      return { success: true, newBalance };
    }
    return { success: false, newBalance: 0 };
  } catch (e) {
    console.error('Error adding giuros:', e);
    return { success: false, newBalance: 0 };
  }
};

/**
 * Award giuros (wrapper)
 */
export const awardGiuros = (username: string | null, amount: number) =>
  addGiuros(username, amount, 'reward');

/**
 * Spend giuros on a cosmetic item
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
    const user = await getUserByUsername(username);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const currentBalance = user.giuros ?? 0;

    if (currentBalance < cost) {
      return { success: false, error: 'Insufficient giuros' };
    }

    // Check ownership
    // Badges are in a separate table, other cosmetics in purchased_cosmetics array
    if (itemId.startsWith('badge_')) {
      // Check purchased_badges table
      const purchasedBadges = await getUserPurchasedBadges(username);
      if (purchasedBadges.includes(itemId)) {
        return { success: false, error: 'Already owned' };
      }
    } else {
      const purchasedCosmetics: string[] = user.purchased_cosmetics || [];
      if (purchasedCosmetics.includes(itemId) && !itemId.startsWith('handle_change')) {
        return { success: false, error: 'Already owned' };
      }
    }

    const newBalance = currentBalance - cost;

    // Transaction needed ideally
    // Update balance
    const success = await updateUser(username, { giuros: newBalance });
    if (!success) {
      return { success: false, error: 'Failed to update balance' };
    }

    // Add item
    if (itemId.startsWith('badge_')) {
      await addPurchasedBadge(username, itemId);
    } else {
      const purchasedCosmetics: string[] = user.purchased_cosmetics || [];
      // Re-read or just append? Appending is risky if concurrent.
      // Ideally we use array_append in Supabase but updateUser takes the whole array.
      // For now, re-use list from variable.
      const newPurchases = [...purchasedCosmetics, itemId];
      await updateUser(username, { purchased_cosmetics: newPurchases });
    }

    // eslint-disable-next-line no-console
    console.log(
      `[Giuros] -${cost} for ${username} (purchased ${itemId}). New balance: ${newBalance}`
    );

    // Publish activity
    let itemType = 'item';
    if (itemId.startsWith('badge_')) {
      itemType = 'badge';
    } else if (itemId.startsWith('frame_')) {
      itemType = 'frame';
    } else if (itemId.startsWith('title_')) {
      itemType = 'title';
    }
    publishCosmeticPurchase(username, itemId, itemId, itemType);

    return { success: true, newBalance };
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('Error spending giuros:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Claim daily login bonus
 */
export const claimDailyLoginBonus = async (
  username: string | null
): Promise<{ claimed: boolean; bonus: number; newBalance: number }> => {
  if (!username) {
    return { claimed: false, bonus: 0, newBalance: 0 };
  }

  try {
    const config = await getPayoutConfig();
    const dailyBonus = config.DAILY_LOGIN_BONUS;

    const user = await getUserByUsername(username);
    if (!user) {
      return { claimed: false, bonus: 0, newBalance: 0 };
    }

    // Compare simple date string YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.last_login_date; // Database returns YYYY-MM-DD string for DATE type

    if (lastLogin === today) {
      return { claimed: false, bonus: 0, newBalance: user.giuros ?? 0 };
    }

    const newBalance = (user.giuros ?? 0) + dailyBonus;

    await updateUser(username, {
      giuros: newBalance,
      last_login_date: today,
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
 */
export const awardChallengeBonus = async (
  username: string | null,
  streak: number = 0
): Promise<{ bonus: number; newBalance: number }> => {
  if (!username) {
    return { bonus: 0, newBalance: 0 };
  }
  const bonus = calculateStreakBonus(streak);
  const result = await addGiuros(username, bonus, `daily challenge (streak: ${streak})`);
  return { bonus, newBalance: result.newBalance };
};

/**
 * Award referral bonus
 */
export const awardReferralBonus = async (
  referrerUsername: string | null
): Promise<{ success: boolean; newBalance: number }> => {
  if (!referrerUsername) {
    return { success: false, newBalance: 0 };
  }
  const config = await getPayoutConfig();
  const result = await addGiuros(referrerUsername, config.REFERRAL_BONUS, 'referral completed');
  return { success: result.success, newBalance: result.newBalance };
};

/**
 * Get user's purchased cosmetics list
 */
export const getPurchasedCosmetics = async (username: string | null): Promise<string[]> => {
  if (!username) {
    return [];
  }
  try {
    const user = await getUserByUsername(username);
    // Combine purchased_cosmetics array + purchased_badges
    const cosmetics = user?.purchased_cosmetics || [];
    const badges = await getUserPurchasedBadges(username);

    return [...cosmetics, ...badges];
  } catch (e) {
    console.error('Error getting purchased cosmetics:', e);
    return [];
  }
};

/**
 * Set active cosmetics
 */
export const setEquippedCosmetics = async (
  username: string | null,
  equipped: Record<string, unknown>
): Promise<void> => {
  if (!username) {
    return;
  }
  try {
    // Cast to expected Map type. Supabase defines it as Record<string, string>
    // But usage might include non-string values?
    await updateUser(username, { equipped_cosmetics: equipped as any });
  } catch (e) {
    console.error('Error setting equipped cosmetics:', e);
  }
};

/**
 * Get equipped cosmetics
 */
export const getEquippedCosmetics = async (
  username: string | null
): Promise<{ frameId?: string; badgeIds?: string[]; titleId?: string } | {}> => {
  if (!username) {
    return {};
  }
  try {
    const user = await getUserByUsername(username);
    // UserRow equipped_cosmetics is Record<string, string>
    return user?.equipped_cosmetics || {};
  } catch (e) {
    console.error('Error getting equipped cosmetics:', e);
    return {};
  }
};
