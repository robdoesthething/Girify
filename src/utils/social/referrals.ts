/**
 * Referral Functions
 *
 * Functions for managing user referrals and bonuses.
 */

import {
  createReferral,
  getBadgeStats,
  getUserByUsername,
  updateUser,
  upsertBadgeStats,
} from '../../services/database';
import { supabase } from '../../services/supabase';
import { normalizeUsername } from '../format';

/**
 * Record a referral when a new user signs up
 */
export const recordReferral = async (referrer: string, referred: string): Promise<void> => {
  if (!referrer || !referred || referrer === referred) {
    return;
  }

  let referrerEmail: string | null = null;
  let referredEmail: string | null = null;

  try {
    const [r1, r2] = await Promise.all([getUserByUsername(referrer), getUserByUsername(referred)]);

    if (r1) {
      referrerEmail = r1.email;
    }
    if (r2) {
      referredEmail = r2.email;
    }
  } catch (e) {
    console.error('Error fetching emails for referral:', e);
  }

  await createReferral(referrer, referred, referrerEmail || undefined, referredEmail || undefined);

  // Update badge stats for referrer
  const stats = await getBadgeStats(referrer);
  await upsertBadgeStats(referrer, {
    invite_count: (stats?.invite_count || 0) + 1,
  });

  // Update referred user
  await updateUser(referred, { referred_by: referrer });
};

/**
 * Check if the user has a successful referral TODAY
 */
export const hasDailyReferral = async (username: string): Promise<boolean> => {
  if (!username) {
    return false;
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer', normalizeUsername(username))
      .gte('created_at', startOfDay.toISOString())
      .limit(1);

    if (error) {
      return false;
    }

    return data && data.length > 0;
  } catch (e) {
    console.error('Error checking daily referral:', e);
    return false;
  }
};

/**
 * Get the referrer of a user
 */
export const getReferrer = async (username: string): Promise<string | null> => {
  if (!username) {
    return null;
  }

  const normalizedName = normalizeUsername(username);
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('referrer, bonus_awarded')
      .eq('referred', normalizedName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data || data.bonus_awarded) {
      return null;
    }

    // Mark as awarded
    await supabase.from('referrals').update({ bonus_awarded: true }).eq('referred', normalizedName);

    return data.referrer;
  } catch (e) {
    console.error('Error getting referrer:', e);
    return null;
  }
};
