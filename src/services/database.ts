/**
 * Database Abstraction Layer
 *
 * Provides a clean interface for all Supabase database operations.
 * This centralizes database access and makes it easier to maintain.
 */

import type {
  AchievementRow,
  ActivityFeedRow,
  AnnouncementRow,
  BadgeStatsRow,
  BadgeStatsUpdate,
  FeedbackRow,
  FriendRequestRow,
  GameResultRow,
  QuestRow,
  ShopItemRow,
  UserGameRow,
  UserInsert,
  UserRow,
  UserUpdate,
} from '../types/supabase';
import { supabase } from './supabase';

// ============================================================================
// USERS
// ============================================================================

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    } // Not found
    console.error('[DB] getUserByUsername error:', error.message);
    return null;
  }
  return data;
}

export async function getUserByUid(uid: string): Promise<UserRow | null> {
  const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getUserByUid error:', error.message);
    return null;
  }
  return data;
}

export async function createUser(user: UserInsert): Promise<UserRow | null> {
  const { data, error } = await supabase.from('users').insert(user).select().single();

  if (error) {
    console.error('[DB] createUser error:', error.message);
    return null;
  }
  return data;
}

export async function updateUser(username: string, updates: UserUpdate): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('username', username.toLowerCase());

  if (error) {
    console.error('[DB] updateUser error:', error.message);
    return false;
  }
  return true;
}

export async function upsertUser(user: UserInsert): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'username' })
    .select()
    .single();

  if (error) {
    console.error('[DB] upsertUser error:', error.message);
    return null;
  }
  return data;
}

// ============================================================================
// SEARCH
// ============================================================================

export async function searchUsers(query: string, limit = 20): Promise<UserRow[]> {
  const searchTerm = query.toLowerCase().replace(/^@/, '');
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', `${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('[DB] searchUsers error:', error.message);
    return [];
  }
  return data || [];
}

// ============================================================================
// BADGE STATS
// ============================================================================

export async function getBadgeStats(username: string): Promise<BadgeStatsRow | null> {
  const { data, error } = await supabase
    .from('badge_stats')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getBadgeStats error:', error.message);
    return null;
  }
  return data;
}

export async function upsertBadgeStats(
  username: string,
  stats: BadgeStatsUpdate
): Promise<boolean> {
  const { error } = await supabase
    .from('badge_stats')
    .upsert({ username: username.toLowerCase(), ...stats }, { onConflict: 'username' });

  if (error) {
    console.error('[DB] upsertBadgeStats error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// FRIENDSHIPS
// ============================================================================

export async function getFriends(
  username: string
): Promise<Array<{ friend_username: string; since: string }>> {
  const { data, error } = await supabase.rpc('get_friends', {
    user_username: username.toLowerCase(),
  });

  if (error) {
    console.error('[DB] getFriends error:', error.message);
    return [];
  }
  return data || [];
}

export async function areFriends(user1: string, user2: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('are_friends', {
    user1: user1.toLowerCase(),
    user2: user2.toLowerCase(),
  });

  if (error) {
    console.error('[DB] areFriends error:', error.message);
    return false;
  }
  return data || false;
}

export async function addFriendship(user1: string, user2: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('add_friendship', {
    user1: user1.toLowerCase(),
    user2: user2.toLowerCase(),
  });

  if (error) {
    console.error('[DB] addFriendship error:', error.message);
    return false;
  }
  return data || false;
}

export async function removeFriendship(user1: string, user2: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('remove_friendship', {
    user1: user1.toLowerCase(),
    user2: user2.toLowerCase(),
  });

  if (error) {
    console.error('[DB] removeFriendship error:', error.message);
    return false;
  }
  return data || false;
}

// ============================================================================
// FRIEND REQUESTS
// ============================================================================

export async function getPendingFriendRequests(username: string): Promise<FriendRequestRow[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('to_user', username.toLowerCase())
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] getPendingFriendRequests error:', error.message);
    return [];
  }
  return data || [];
}

export async function getSentFriendRequests(username: string): Promise<FriendRequestRow[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('from_user', username.toLowerCase())
    .eq('status', 'pending');

  if (error) {
    console.error('[DB] getSentFriendRequests error:', error.message);
    return [];
  }
  return data || [];
}

export async function createFriendRequest(fromUser: string, toUser: string): Promise<boolean> {
  const { error } = await supabase.from('friend_requests').insert({
    from_user: fromUser.toLowerCase(),
    to_user: toUser.toLowerCase(),
    status: 'pending',
  });

  if (error) {
    console.error('[DB] createFriendRequest error:', error.message);
    return false;
  }
  return true;
}

export async function updateFriendRequestStatus(
  fromUser: string,
  toUser: string,
  status: 'accepted' | 'rejected'
): Promise<boolean> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status })
    .eq('from_user', fromUser.toLowerCase())
    .eq('to_user', toUser.toLowerCase());

  if (error) {
    console.error('[DB] updateFriendRequestStatus error:', error.message);
    return false;
  }
  return true;
}

export async function deleteFriendRequest(fromUser: string, toUser: string): Promise<boolean> {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('from_user', fromUser.toLowerCase())
    .eq('to_user', toUser.toLowerCase());

  if (error) {
    console.error('[DB] deleteFriendRequest error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// BLOCKS
// ============================================================================

export async function getBlockedUsers(username: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked')
    .eq('blocker', username.toLowerCase());

  if (error) {
    console.error('[DB] getBlockedUsers error:', error.message);
    return [];
  }
  return data?.map(b => b.blocked) || [];
}

export async function isUserBlocked(blocker: string, blocked: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocker')
    .eq('blocker', blocker.toLowerCase())
    .eq('blocked', blocked.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return false;
    }
    console.error('[DB] isUserBlocked error:', error.message);
    return false;
  }
  return !!data;
}

export async function blockUser(blocker: string, blocked: string): Promise<boolean> {
  const { error } = await supabase.from('blocks').insert({
    blocker: blocker.toLowerCase(),
    blocked: blocked.toLowerCase(),
  });

  if (error) {
    console.error('[DB] blockUser error:', error.message);
    return false;
  }
  return true;
}

export async function unblockUser(blocker: string, blocked: string): Promise<boolean> {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker', blocker.toLowerCase())
    .eq('blocked', blocked.toLowerCase());

  if (error) {
    console.error('[DB] unblockUser error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// SHOP ITEMS
// ============================================================================

export async function getShopItems(): Promise<ShopItemRow[]> {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('type')
    .order('cost');

  if (error) {
    console.error('[DB] getShopItems error:', error.message);
    return [];
  }
  return data || [];
}

export async function getShopItemById(id: string): Promise<ShopItemRow | null> {
  const { data, error } = await supabase.from('shop_items').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getShopItemById error:', error.message);
    return null;
  }
  return data;
}

export async function createShopItem(item: ShopItemRow): Promise<boolean> {
  const { error } = await supabase.from('shop_items').insert(item);

  if (error) {
    console.error('[DB] createShopItem error:', error.message);
    return false;
  }
  return true;
}

export async function updateShopItem(id: string, updates: Partial<ShopItemRow>): Promise<boolean> {
  const { error } = await supabase.from('shop_items').update(updates).eq('id', id);

  if (error) {
    console.error('[DB] updateShopItem error:', error.message);
    return false;
  }
  return true;
}

export async function deleteShopItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('shop_items').delete().eq('id', id);

  if (error) {
    console.error('[DB] deleteShopItem error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export async function getAchievements(): Promise<AchievementRow[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('[DB] getAchievements error:', error.message);
    return [];
  }
  return data || [];
}

export async function getAchievementById(id: string): Promise<AchievementRow | null> {
  const { data, error } = await supabase.from('achievements').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getAchievementById error:', error.message);
    return null;
  }
  return data;
}

export async function createAchievement(achievement: AchievementRow): Promise<boolean> {
  const { error } = await supabase.from('achievements').insert(achievement);

  if (error) {
    console.error('[DB] createAchievement error:', error.message);
    return false;
  }
  return true;
}

export async function updateAchievement(
  id: string,
  updates: Partial<AchievementRow>
): Promise<boolean> {
  const { error } = await supabase.from('achievements').update(updates).eq('id', id);

  if (error) {
    console.error('[DB] updateAchievement error:', error.message);
    return false;
  }
  return true;
}

export async function deleteAchievement(id: string): Promise<boolean> {
  const { error } = await supabase.from('achievements').delete().eq('id', id);

  if (error) {
    console.error('[DB] deleteAchievement error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// PURCHASED BADGES
// ============================================================================

export async function getUserPurchasedBadges(username: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('purchased_badges')
    .select('badge_id')
    .eq('username', username.toLowerCase());

  if (error) {
    console.error('[DB] getUserPurchasedBadges error:', error.message);
    return [];
  }
  return data?.map(b => b.badge_id) || [];
}

export async function addPurchasedBadge(username: string, badgeId: string): Promise<boolean> {
  const { error } = await supabase.from('purchased_badges').insert({
    username: username.toLowerCase(),
    badge_id: badgeId,
  });

  if (error) {
    console.error('[DB] addPurchasedBadge error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// QUESTS
// ============================================================================

export async function getActiveQuests(): Promise<QuestRow[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('is_active', true)
    .or(`active_date.is.null,active_date.eq.${today}`);

  if (error) {
    console.error('[DB] getActiveQuests error:', error.message);
    return [];
  }
  return data || [];
}

export async function getTodaysQuest(): Promise<QuestRow | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('is_active', true)
    .eq('active_date', today)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getTodaysQuest error:', error.message);
    return null;
  }
  return data;
}

export async function getAllQuests(): Promise<QuestRow[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] getAllQuests error:', error.message);
    return [];
  }
  return data || [];
}

export async function createQuest(
  quest: Omit<QuestRow, 'id' | 'created_at'>
): Promise<string | null> {
  const { data, error } = await supabase.from('quests').insert(quest).select().single();

  if (error) {
    console.error('[DB] createQuest error:', error.message);
    return null;
  }
  return data?.id?.toString() || null;
}

export async function updateQuest(id: number, updates: Partial<QuestRow>): Promise<boolean> {
  const { error } = await supabase.from('quests').update(updates).eq('id', id);

  if (error) {
    console.error('[DB] updateQuest error:', error.message);
    return false;
  }
  return true;
}

export async function deleteQuest(id: number): Promise<boolean> {
  const { error } = await supabase.from('quests').delete().eq('id', id);

  if (error) {
    console.error('[DB] deleteQuest error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

export async function getActiveAnnouncements(): Promise<AnnouncementRow[]> {
  // TEMPORARY: Date filters relaxed for debugging data persistence issues
  // TODO: Re-enable date filters once announcements are confirmed working
  // Original filters:
  // const now = new Date().toISOString();
  // .lte('publish_date', now)
  // .or(`expiry_date.is.null,expiry_date.gte.${now}`)

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    // Temporarily show all announcements regardless of publish/expiry dates
    .order('priority', { ascending: false })
    .order('publish_date', { ascending: false });

  if (error) {
    console.error('[DB] getActiveAnnouncements error:', error.message);
    return [];
  }

  return data || [];
}

export async function getAllAnnouncements(): Promise<AnnouncementRow[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('publish_date', { ascending: false });

  if (error) {
    console.error('[DB] getAllAnnouncements error:', error.message);
    return [];
  }
  return data || [];
}

export async function createAnnouncement(
  announcement: Omit<AnnouncementRow, 'id' | 'created_at'>
): Promise<string | null> {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select()
    .single();

  if (error) {
    console.error('[DB] createAnnouncement error:', error.message);
    return null;
  }
  return data?.id?.toString() || null;
}

export async function updateAnnouncement(
  id: number,
  updates: Partial<AnnouncementRow>
): Promise<boolean> {
  const { error } = await supabase.from('announcements').update(updates).eq('id', id);

  if (error) {
    console.error('[DB] updateAnnouncement error:', error.message);
    return false;
  }
  return true;
}

export async function deleteAnnouncement(id: number): Promise<boolean> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);

  if (error) {
    console.error('[DB] deleteAnnouncement error:', error.message);
    return false;
  }
  return true;
}

export async function getReadAnnouncementIds(username: string): Promise<number[]> {
  const { data, error } = await supabase
    .from('user_read_announcements')
    .select('announcement_id')
    .eq('username', username.toLowerCase());

  if (error) {
    console.error('[DB] getReadAnnouncementIds error:', error.message);
    return [];
  }
  return data?.map(r => r.announcement_id) || [];
}

export async function markAnnouncementAsRead(
  username: string,
  announcementId: number
): Promise<boolean> {
  const { error } = await supabase.from('user_read_announcements').insert({
    username: username.toLowerCase(),
    announcement_id: announcementId,
  });

  if (error) {
    console.error('[DB] markAnnouncementAsRead error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// FEEDBACK
// ============================================================================

export async function submitFeedback(username: string, text: string): Promise<boolean> {
  const { error } = await supabase.from('feedback').insert({
    username: username.toLowerCase(),
    text,
  });

  if (error) {
    console.error('[DB] submitFeedback error:', error.message);
    return false;
  }
  return true;
}

export async function getApprovedFeedbackRewards(username: string): Promise<FeedbackRow[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('username', username.toLowerCase())
    .eq('status', 'approved')
    .eq('notified', false);

  if (error) {
    console.error('[DB] getApprovedFeedbackRewards error:', error.message);
    return [];
  }
  return data || [];
}

export async function markFeedbackNotified(feedbackId: number): Promise<boolean> {
  const { error } = await supabase.from('feedback').update({ notified: true }).eq('id', feedbackId);

  if (error) {
    console.error('[DB] markFeedbackNotified error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// ACTIVITY FEED
// ============================================================================

export async function getActivityFeed(
  usernames: string[],
  limit = 50,
  offset = 0
): Promise<ActivityFeedRow[]> {
  if (usernames.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('activity_feed')
    .select('*')
    .in(
      'username',
      usernames.map(u => u.toLowerCase())
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[DB] getActivityFeed error:', error.message);
    return [];
  }
  return data || [];
}

export async function publishActivity(activity: Omit<ActivityFeedRow, 'id'>): Promise<boolean> {
  const { error } = await supabase.from('activity_feed').insert({
    ...activity,
    username: activity.username.toLowerCase(),
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
    referrer: referrer.toLowerCase(),
    referred: referred.toLowerCase(),
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
    .eq('referrer', username.toLowerCase());

  if (error) {
    console.error('[DB] getReferralCount error:', error.message);
    return 0;
  }
  return count || 0;
}

// ============================================================================
// GAME RESULTS
// ============================================================================

export async function getLeaderboardScores(
  period: 'all' | 'daily' | 'weekly' | 'monthly',
  limit = 100
): Promise<GameResultRow[]> {
  let query = supabase
    .from('game_results')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit * 4); // Fetch more for deduplication

  const now = new Date();

  if (period === 'daily') {
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    query = query.gte('played_at', startOfDay);
  } else if (period === 'weekly') {
    const d = new Date(now);
    const currentDay = d.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    d.setDate(d.getDate() - distanceToMonday);
    d.setHours(0, 0, 0, 0);
    query = query.gte('played_at', d.toISOString());
  } else if (period === 'monthly') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    query = query.gte('played_at', startOfMonth);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DB] getLeaderboardScores error:', error.message);
    return [];
  }
  return data || [];
}

export async function getUserGameHistory(username: string, limit = 30): Promise<UserGameRow[]> {
  const { data, error } = await supabase
    .from('user_games')
    .select('*')
    .eq('username', username.toLowerCase())
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[DB] getUserGameHistory error:', error.message);
    return [];
  }
  return data || [];
}

export async function saveUserGame(game: {
  username: string;
  date: string;
  score: number;
  avgTime?: number;
  incomplete?: boolean;
  correctAnswers?: number;
  questionCount?: number;
}): Promise<boolean> {
  const { error } = await supabase.from('user_games').insert({
    username: game.username.toLowerCase(),
    date: game.date,
    score: game.score,
    avg_time: game.avgTime ?? null,
    incomplete: game.incomplete ?? false,
    correct_answers: game.correctAnswers ?? null,
    question_count: game.questionCount ?? null,
  });

  if (error) {
    console.error('[DB] saveUserGame error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// DISTRICTS
// ============================================================================

export async function getDistricts(): Promise<
  Array<{ id: string; name: string; team_name: string | null; score: number }>
> {
  const { data, error } = await supabase
    .from('districts')
    .select('id, name, team_name, score')
    .order('score', { ascending: false });

  if (error) {
    console.error('[DB] getDistricts error:', error.message);
    return [];
  }
  return data || [];
}

export async function updateDistrictScore(
  districtId: string,
  scoreToAdd: number
): Promise<boolean> {
  // First get current score
  const { data: district, error: fetchError } = await supabase
    .from('districts')
    .select('score')
    .eq('id', districtId)
    .single();

  if (fetchError || !district) {
    console.error('[DB] updateDistrictScore fetch error:', fetchError?.message);
    return false;
  }

  const { error } = await supabase
    .from('districts')
    .update({ score: district.score + scoreToAdd })
    .eq('id', districtId);

  if (error) {
    console.error('[DB] updateDistrictScore error:', error.message);
    return false;
  }
  return true;
}
