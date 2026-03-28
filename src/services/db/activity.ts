/**
 * Activity Feed Database Operations
 *
 * Social activity feed and referrals.
 */

import type { ActivityFeedRow } from '../../types/supabase';
import { normalizeUsername } from '../../utils/format';
import { supabase } from '../supabase';

// ============================================================================
// ACTIVITY FEED
// ============================================================================

export async function getActivityFeed(
  usernames: string[],
  limit = 50,
  offset = 0
): Promise<ActivityFeedRow[]> {
  if (usernames.length === 0) {
    console.warn('[DB] getActivityFeed: No usernames provided');
    return [];
  }

  const normalizedUsernames = usernames.map(u => normalizeUsername(u));
  console.warn(
    `[DB] getActivityFeed: Querying for ${normalizedUsernames.length} users:`,
    normalizedUsernames
  );

  const { data, error } = await supabase
    .from('activity_feed')
    .select('*')
    .in('username', normalizedUsernames)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[DB] getActivityFeed error:', error.message);
    return [];
  }

  console.warn(`[DB] getActivityFeed: Retrieved ${data?.length || 0} activities`);
  return data || [];
}

export async function publishActivity(activity: Omit<ActivityFeedRow, 'id'>): Promise<boolean> {
  const { error } = await supabase.from('activity_feed').insert({
    ...activity,
    username: normalizeUsername(activity.username),
  });

  if (error) {
    console.error('[DB] publishActivity error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// REFERRALS
// ============================================================================

export async function createReferral(
  referrer: string,
  referred: string,
  referrerEmail?: string,
  referredEmail?: string
): Promise<boolean> {
  const { error } = await supabase.from('referrals').insert({
    referrer: normalizeUsername(referrer),
    referred: normalizeUsername(referred),
    referrer_email: referrerEmail || null,
    referred_email: referredEmail || null,
  });

  if (error) {
    console.error('[DB] createReferral error:', error.message);
    return false;
  }
  return true;
}

export async function getReferralCount(username: string): Promise<number> {
  const { count, error } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer', normalizeUsername(username));

  if (error) {
    console.error('[DB] getReferralCount error:', error.message);
    return 0;
  }
  return count || 0;
}
