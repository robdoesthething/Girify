import { calculateStreakBonus } from '../../config/gameConfig';
import { getUserByUsername, getUserPurchasedBadges, updateUser } from '../../services/database';
import { getPayoutConfig } from '../../services/db/config';
import { supabase } from '../../services/supabase';
import { assertCurrentUser } from '../auth';
import { normalizeUsername } from '../format';
import { publishCosmeticPurchase } from '../social/publishActivity';

// Default Constants
export const STARTING_GIUROS = 10;
export const DAILY_LOGIN_BONUS = 2;
export const DAILY_CHALLENGE_BONUS = 5;
export const STREAK_WEEK_BONUS = 10;
export const PERFECT_SCORE_BONUS = 20;
export const REFERRAL_BONUS = 15;

/**
 * Get user's current giuros balance
 * @param username - The username to fetch balance for
 * @returns Promise resolving to the current giuros balance (defaults to STARTING_GIUROS)
 */
export const getGiuros = async (username: string | null): Promise<number> => {
  if (!username) {
    return 0;
  }
  const normalizedUsername = normalizeUsername(username);
  try {
    const user = await getUserByUsername(normalizedUsername);
    return user?.giuros ?? STARTING_GIUROS;
  } catch (e) {
    console.error('Error getting giuros:', e);
    return 0;
  }
};

/**
 * Add giuros to user's balance
 * @param username - The username to add giuros to
 * @param amount - The amount to add
 * @param reason - The reason for adding giuros (for logging)
 * @returns Promise resolving to success status and new balance
 */
export const addGiuros = async (
  username: string | null,
  amount: number,
  reason: string = ''
): Promise<{ success: boolean; newBalance: number }> => {
  if (!username || amount <= 0) {
    return { success: false, newBalance: 0 };
  }
  const normalizedUsername = normalizeUsername(username);

  try {
    const user = await getUserByUsername(normalizedUsername);
    if (!user) {
      return { success: false, newBalance: 0 };
    }

    const currentBalance = user.giuros ?? 0;
    const newBalance = currentBalance + amount;

    const success = await updateUser(normalizedUsername, { giuros: newBalance });

    if (success) {
      // eslint-disable-next-line no-console
      console.log(
        `[Giuros] +${amount} for ${normalizedUsername} (${reason}). New balance: ${newBalance}`
      );
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
 * @param username - The username to award giuros to
 * @param amount - The amount to award
 * @returns Promise resolving to success status and new balance
 */
export const awardGiuros = (username: string | null, amount: number) =>
  addGiuros(username, amount, 'reward');

/**
 * Spend giuros on a cosmetic item
 * @param username - The username spending giuros
 * @param cost - The cost of the item
 * @param itemId - The ID of the item being purchased
 * @returns Promise resolving to success status, potential error, and new balance
 */
export const spendGiuros = async (
  username: string | null,
  cost: number,
  itemId: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
  if (!username || cost <= 0 || !itemId) {
    return { success: false, error: 'Invalid parameters' };
  }
  const normalizedUsername = normalizeUsername(username);

  try {
    await assertCurrentUser(normalizedUsername);

    // Use atomic RPC to prevent TOCTOU race conditions
    const { data, error } = await (supabase as any).rpc('spend_giuros', {
      p_username: normalizedUsername,
      p_cost: cost,
      p_item_id: itemId,
    });

    if (error) {
      console.error('[Giuros] RPC error:', error);
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string; new_balance?: number };

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const newBalance = result.new_balance ?? 0;

    // eslint-disable-next-line no-console
    console.log(
      `[Giuros] -${cost} for ${normalizedUsername} (purchased ${itemId}). New balance: ${newBalance}`
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
    publishCosmeticPurchase(normalizedUsername, itemId, itemId, itemType);

    return { success: true, newBalance };
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('Error spending giuros:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Claim daily login bonus
 * @param username - The username claiming the bonus
 * @returns Promise resolving to claim status, bonus amount, and new balance
 */
export const claimDailyLoginBonus = async (
  username: string | null
): Promise<{ claimed: boolean; bonus: number; newBalance: number }> => {
  if (!username) {
    return { claimed: false, bonus: 0, newBalance: 0 };
  }
  const normalizedUsername = normalizeUsername(username);

  try {
    const config = await getPayoutConfig();
    const dailyBonus = config.DAILY_LOGIN_BONUS;

    const user = await getUserByUsername(normalizedUsername);
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

    await updateUser(normalizedUsername, {
      giuros: newBalance,
      last_login_date: today,
    });

    // eslint-disable-next-line no-console
    console.log(`[Giuros] Daily login bonus +${dailyBonus} for ${normalizedUsername}`);

    return { claimed: true, bonus: dailyBonus, newBalance };
  } catch (e) {
    console.error('Error claiming daily login:', e);
    return { claimed: false, bonus: 0, newBalance: 0 };
  }
};

/**
 * Award bonus for completing daily challenge
 * @param username - The username to award bonus to
 * @param streak - The current streak of the user
 * @returns Promise resolving to bonus amount and new balance
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
 * @param referrerUsername - The username of the referrer
 * @returns Promise resolving to success status and new balance
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
 * @param username - The username to fetch cosmetics for
 * @returns Promise resolving to a list of purchased item IDs
 */
export const getPurchasedCosmetics = async (username: string | null): Promise<string[]> => {
  if (!username) {
    return [];
  }
  const normalizedUsername = normalizeUsername(username);
  try {
    const user = await getUserByUsername(normalizedUsername);
    // Combine purchased_cosmetics array + purchased_badges
    const cosmetics = user?.purchased_cosmetics || [];
    const badges = await getUserPurchasedBadges(normalizedUsername);

    return [...cosmetics, ...badges];
  } catch (e) {
    console.error('Error getting purchased cosmetics:', e);
    return [];
  }
};

/**
 * Set active cosmetics
 * @param username - The username updating cosmetics
 * @param equipped - The equipped cosmetics object
 * @returns Promise resolving when update is complete
 */
export const setEquippedCosmetics = async (
  username: string | null,
  equipped: Record<string, unknown>
): Promise<void> => {
  if (!username) {
    return;
  }
  const normalizedUsername = normalizeUsername(username);
  try {
    // Cast to expected Map type. Supabase defines it as Record<string, string>
    // But usage might include non-string values?

    await updateUser(normalizedUsername, { equipped_cosmetics: equipped as any });
  } catch (e) {
    console.error('Error setting equipped cosmetics:', e);
  }
};

/**
 * Get equipped cosmetics
 * @param username - The username to fetch equipped cosmetics for
 * @returns Promise resolving to the equipped cosmetics object
 */
export const getEquippedCosmetics = async (
  username: string | null
): Promise<{ frameId?: string; badgeIds?: string[]; titleId?: string } | {}> => {
  if (!username) {
    return {};
  }
  const normalizedUsername = normalizeUsername(username);
  try {
    const user = await getUserByUsername(normalizedUsername);
    // UserRow equipped_cosmetics is Record<string, string>
    return user?.equipped_cosmetics || {};
  } catch (e) {
    console.error('Error getting equipped cosmetics:', e);
    return {};
  }
};
