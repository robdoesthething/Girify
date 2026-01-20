import { Timestamp } from 'firebase/firestore';
import { DISTRICTS } from '../data/districts';
import {
  getUserByUsername,
  getUserByUid as dbGetUserByUid,
  createUser,
  updateUser,
  upsertUser,
  getBadgeStats,
  upsertBadgeStats,
  submitFeedback as dbSubmitFeedback,
  getApprovedFeedbackRewards,
  markFeedbackNotified,
  blockUser as dbBlockUser,
  unblockUser as dbUnblockUser,
  isUserBlocked,
  createReferral,
  getUserGameHistory as dbGetUserGameHistory,
  saveUserGame,
  getDistricts,
  updateDistrictScore as dbUpdateDistrictScore,
} from '../services/database';
import { supabase } from '../services/supabase';
import type { UserRow, FeedbackRow } from '../types/supabase';

const DEFAULT_AVATAR_COUNT = 20;
const DEFAULT_GIUROS = 10;

export interface NotificationSettings {
  dailyReminder: boolean;
  friendActivity: boolean;
  newsUpdates: boolean;
}

export interface UserProfile {
  id?: string;
  username: string;
  uid?: string | null;
  email?: string | null;
  realName?: string;
  avatarId?: number;
  joinedAt?: Timestamp | string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  friendCount?: number;
  banned?: boolean;
  gamesPlayed?: number;
  bestScore?: number;
  totalScore?: number;
  referralCode?: string;
  streak?: number;
  maxStreak?: number;
  lastPlayDate?: string | null;
  giuros?: number;
  purchasedCosmetics?: string[];
  equippedCosmetics?: Record<string, string>;
  equippedBadges?: string[];
  lastLoginDate?: string | null;
  language?: string;
  theme?: 'dark' | 'light' | 'auto';
  notificationSettings?: NotificationSettings;
  migratedTo?: string | null;
  migratedFrom?: string | null;
  referredBy?: string | null;
  district?: string;
  team?: string;
}

export interface FeedbackItem {
  id: string;
  username: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  reward?: number | null;
  createdAt?: Timestamp | string;
  approvedAt?: Timestamp | string;
  rejectedAt?: Timestamp | string;
  notified?: boolean;
}

export interface GameData {
  score: number;
  date?: number | string;
  timestamp?: Timestamp | { seconds: number } | number;
  time?: number;
  [key: string]: unknown;
}

interface OperationResult {
  success: boolean;
  error?: string;
  username?: string;
  reward?: number;
  count?: number;
}

interface AdditionalProfileData {
  email?: string;
  realName?: string;
  avatarId?: number;
  language?: string;
  district?: string;
}

interface GameStatsUpdate {
  streak: number;
  totalScore: number;
  lastPlayDate: string;
  currentScore?: number;
}

// Helper to convert Supabase UserRow to UserProfile
function rowToProfile(row: UserRow): UserProfile {
  return {
    id: row.username,
    username: row.username,
    uid: row.uid,
    email: row.email,
    realName: row.real_name || '',
    avatarId: row.avatar_id,
    joinedAt: row.joined_at || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
    friendCount: row.friend_count,
    banned: row.banned,
    gamesPlayed: row.games_played,
    bestScore: row.best_score,
    totalScore: row.total_score,
    referralCode: row.referral_code || undefined,
    streak: row.streak,
    maxStreak: row.max_streak,
    lastPlayDate: row.last_play_date,
    giuros: row.giuros,
    purchasedCosmetics: row.purchased_cosmetics,
    equippedCosmetics: row.equipped_cosmetics,
    equippedBadges: row.equipped_badges,
    lastLoginDate: row.last_login_date,
    language: row.language,
    theme: row.theme as 'dark' | 'light' | 'auto',
    notificationSettings: row.notification_settings,
    migratedTo: row.migrated_to,
    migratedFrom: row.migrated_from,
    referredBy: row.referred_by,
    district: row.district || undefined,
    team: row.team || undefined,
  };
}

/**
 * Get or create user profile document in Supabase.
 */
export const ensureUserProfile = async (
  usernameInput: string,
  uid: string | null = null,
  additionalData: AdditionalProfileData = {}
): Promise<UserProfile | null> => {
  if (!usernameInput) {
    return null;
  }
  const username = usernameInput.toLowerCase();

  // Check if user exists
  const existingUser = await getUserByUsername(username);

  // Check by email if provided and user doesn't exist
  if (additionalData.email && !existingUser) {
    const userByEmail = await getUserByEmail(additionalData.email);
    if (userByEmail) {
      console.warn(
        `[Auth] Found existing user by email ${additionalData.email}: ${userByEmail.username}`
      );
      return userByEmail;
    }
  }

  if (!existingUser) {
    // Create new user
    const selectedDistrictId =
      additionalData.district || DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)].id;
    const selectedTeamName = DISTRICTS.find(d => d.id === selectedDistrictId)?.teamName;

    const newUser = await createUser({
      username,
      uid: uid,
      email: additionalData.email ? additionalData.email.toLowerCase().trim() : null,
      real_name: additionalData.realName || null,
      avatar_id: additionalData.avatarId || Math.floor(Math.random() * DEFAULT_AVATAR_COUNT) + 1,
      friend_count: 0,
      games_played: 0,
      best_score: 0,
      total_score: 0,
      referral_code: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
      streak: 0,
      max_streak: 0,
      last_play_date: null,
      giuros: DEFAULT_GIUROS,
      purchased_cosmetics: [],
      equipped_cosmetics: {},
      equipped_badges: [],
      last_login_date: null,
      language: additionalData.language || 'en',
      theme: 'auto',
      notification_settings: {
        dailyReminder: true,
        friendActivity: true,
        newsUpdates: true,
      },
      migrated_to: null,
      migrated_from: null,
      referred_by: null,
      district: selectedDistrictId,
      team: selectedTeamName || null,
      banned: false,
    });

    if (newUser) {
      return rowToProfile(newUser);
    }
    return null;
  }

  // Update existing user if needed
  const updates: Record<string, unknown> = {};

  if (uid && existingUser.uid !== uid) {
    updates.uid = uid;
  }
  if (additionalData.email && !existingUser.email) {
    updates.email = additionalData.email.toLowerCase().trim();
  }
  if (additionalData.district && existingUser.district !== additionalData.district) {
    updates.district = additionalData.district;
    updates.team = DISTRICTS.find(d => d.id === additionalData.district)?.teamName || null;
  }
  if (!existingUser.team && existingUser.district) {
    updates.team = DISTRICTS.find(d => d.id === existingUser.district)?.teamName || null;
  }

  if (Object.keys(updates).length > 0) {
    await updateUser(username, updates);
    Object.assign(existingUser, updates);
  }

  return rowToProfile(existingUser);
};

/**
 * Look up a user profile by email address
 */
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) {
    return null;
  }
  const cleanEmail = email.toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }
    return rowToProfile(data);
  } catch (e) {
    console.error('Error fetching user by email:', e);
    return null;
  }
};

/**
 * Look up a user profile by UID
 */
export const getUserByUid = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) {
    return null;
  }

  const user = await dbGetUserByUid(uid);
  if (user) {
    return rowToProfile(user);
  }
  return null;
};

/**
 * Update user stats after a game
 */
export const updateUserGameStats = async (
  username: string,
  { streak, totalScore, lastPlayDate, currentScore }: GameStatsUpdate
): Promise<void> => {
  if (!username) {
    return;
  }
  const lowername = username.toLowerCase();

  try {
    const existingUser = await getUserByUsername(lowername);
    if (!existingUser) {
      return;
    }

    const updates: Record<string, unknown> = {
      games_played: existingUser.games_played + 1,
      total_score: totalScore,
      streak: Math.min(streak, existingUser.games_played + 1),
      last_play_date: lastPlayDate,
    };

    if (streak > existingUser.max_streak) {
      updates.max_streak = streak;
    }

    if (currentScore !== undefined && currentScore > existingUser.best_score) {
      updates.best_score = currentScore;
    }

    await updateUser(lowername, updates);

    // Update district score if user has one
    if (existingUser.district && currentScore) {
      await dbUpdateDistrictScore(existingUser.district, currentScore);
    }
  } catch (e) {
    console.error('Error updating game stats:', e);
  }
};

/**
 * Submit user feedback
 */
export const submitFeedback = async (username: string, text: string): Promise<void> => {
  if (!username || !text) {
    return;
  }
  await dbSubmitFeedback(username, text);
};

/**
 * Get all feedback (Admin only)
 */
export const getFeedbackList = async (): Promise<FeedbackItem[]> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      return [];
    }

    return data.map((f: FeedbackRow) => ({
      id: f.id.toString(),
      username: f.username,
      text: f.text,
      status: f.status,
      reward: f.reward,
      createdAt: f.created_at,
      approvedAt: f.approved_at || undefined,
      rejectedAt: f.rejected_at || undefined,
      notified: f.notified,
    }));
  } catch (e) {
    console.error('Error fetching feedback:', e);
    return [];
  }
};

/**
 * Approve feedback and award Giuros (Admin only)
 */
export const approveFeedback = async (
  feedbackId: string,
  giurosAmount = 50
): Promise<OperationResult> => {
  try {
    const { data: feedback, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', parseInt(feedbackId, 10))
      .single();

    if (fetchError || !feedback) {
      throw new Error('Feedback not found');
    }

    const { awardGiuros } = await import('./giuros');
    await awardGiuros(feedback.username, giurosAmount);

    const { error: updateError } = await supabase
      .from('feedback')
      .update({
        status: 'approved',
        reward: giurosAmount,
        approved_at: new Date().toISOString(),
      })
      .eq('id', parseInt(feedbackId, 10));

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { success: true, username: feedback.username, reward: giurosAmount };
  } catch (e) {
    console.error('Error approving feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Reject feedback (Admin only)
 */
export const rejectFeedback = async (feedbackId: string): Promise<OperationResult> => {
  try {
    const { error } = await supabase
      .from('feedback')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', parseInt(feedbackId, 10));

    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  } catch (e) {
    console.error('Error rejecting feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Delete feedback (Admin only)
 */
export const deleteFeedback = async (feedbackId: string): Promise<OperationResult> => {
  try {
    const { error } = await supabase.from('feedback').delete().eq('id', parseInt(feedbackId, 10));

    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  } catch (e) {
    console.error('Error deleting feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Check for unseen feedback rewards for a user
 */
export const checkUnseenFeedbackRewards = async (username: string): Promise<FeedbackItem[]> => {
  if (!username) {
    return [];
  }

  const rewards = await getApprovedFeedbackRewards(username);
  return rewards.map((f: FeedbackRow) => ({
    id: f.id.toString(),
    username: f.username,
    text: f.text,
    status: f.status,
    reward: f.reward,
    createdAt: f.created_at,
    approvedAt: f.approved_at || undefined,
    rejectedAt: f.rejected_at || undefined,
    notified: f.notified,
  }));
};

/**
 * Mark feedback reward as seen
 */
export const markFeedbackRewardSeen = async (feedbackId: string): Promise<void> => {
  await markFeedbackNotified(parseInt(feedbackId, 10));
};

/**
 * Get all users for admin table
 */
export const getAllUsers = async (limitCount = 50): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(limitCount);

    if (error || !data) {
      return [];
    }

    return data.map(rowToProfile);
  } catch (e) {
    console.error('Error fetching all users:', e);
    return [];
  }
};

/**
 * Update user data as Admin
 */
export const updateUserAsAdmin = async (
  targetUsername: string,
  data: Partial<UserProfile>
): Promise<void> => {
  if (!targetUsername || !data) {
    return;
  }

  const { requireAdmin } = await import('./auth');
  await requireAdmin();

  // Convert UserProfile to database format
  const dbData: Record<string, unknown> = {};
  if (data.realName !== undefined) {
    dbData.real_name = data.realName;
  }
  if (data.avatarId !== undefined) {
    dbData.avatar_id = data.avatarId;
  }
  if (data.giuros !== undefined) {
    dbData.giuros = data.giuros;
  }
  if (data.banned !== undefined) {
    dbData.banned = data.banned;
  }
  if (data.streak !== undefined) {
    dbData.streak = data.streak;
  }
  if (data.district !== undefined) {
    dbData.district = data.district;
  }
  if (data.team !== undefined) {
    dbData.team = data.team;
  }

  await updateUser(targetUsername, dbData);
};

/**
 * Delete a user and all their associated data
 */
export const deleteUserAndData = async (username: string): Promise<OperationResult> => {
  if (!username) {
    return { success: false, error: 'No username provided' };
  }

  try {
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

    // Delete user (cascade will handle related tables)
    const { error } = await supabase.from('users').delete().eq('username', cleanUsername);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (e) {
    console.error('Error deleting user:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Fetch user profile from Supabase by username
 */
export const getUserProfile = async (username: string): Promise<UserProfile | null> => {
  if (!username) {
    return null;
  }

  const user = await getUserByUsername(username.toLowerCase());
  if (user) {
    return rowToProfile(user);
  }

  return null;
};

/**
 * Update user statistics after completing a game
 */
export const updateUserStats = async (username: string, score: number): Promise<void> => {
  if (!username) {
    return;
  }

  const existingUser = await getUserByUsername(username);

  if (existingUser) {
    const newGamesPlayed = existingUser.games_played + 1;
    const newBestScore = Math.max(existingUser.best_score, score);

    await updateUser(username, {
      games_played: newGamesPlayed,
      best_score: newBestScore,
    });
  } else {
    await ensureUserProfile(username);
    await updateUser(username, {
      games_played: 1,
      best_score: score,
    });
  }
};

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
 * Get pending friend requests for a user
 * (Moved to friends.ts, but keeping for backward compatibility)
 */
export const getPendingFriendRequests = async (
  username: string
): Promise<Array<{ id: string; [key: string]: unknown }>> => {
  const { getPendingRequests } = await import('./friends');
  const requests = await getPendingRequests(username);
  return requests.map(r => ({
    id: r.id.toString(),
    from: r.from_user,
    timestamp: r.created_at,
    status: r.status,
  }));
};

/**
 * Block a user
 */
export const blockUser = async (blocker: string, blocked: string): Promise<void> => {
  if (!blocker || !blocked || blocker === blocked) {
    return;
  }
  await dbBlockUser(blocker, blocked);
};

/**
 * Unblock a user
 */
export const unblockUser = async (blocker: string, blocked: string): Promise<void> => {
  if (!blocker || !blocked) {
    return;
  }
  await dbUnblockUser(blocker, blocked);
};

/**
 * Check if user1 has blocked user2
 */
export const getBlockStatus = async (user1: string, user2: string): Promise<boolean> => {
  return isUserBlocked(user1, user2);
};

/**
 * Update user profile data
 */
export const updateUserProfile = async (
  username: string,
  data: Partial<UserProfile>
): Promise<void> => {
  if (!username || !data) {
    return;
  }

  // Convert UserProfile to database format
  const dbData: Record<string, unknown> = {};
  if (data.realName !== undefined) {
    dbData.real_name = data.realName;
  }
  if (data.avatarId !== undefined) {
    dbData.avatar_id = data.avatarId;
  }
  if (data.giuros !== undefined) {
    dbData.giuros = data.giuros;
  }
  if (data.streak !== undefined) {
    dbData.streak = data.streak;
  }
  if (data.maxStreak !== undefined) {
    dbData.max_streak = data.maxStreak;
  }
  if (data.totalScore !== undefined) {
    dbData.total_score = data.totalScore;
  }
  if (data.lastPlayDate !== undefined) {
    dbData.last_play_date = data.lastPlayDate;
  }
  if (data.lastLoginDate !== undefined) {
    dbData.last_login_date = data.lastLoginDate;
  }
  if (data.language !== undefined) {
    dbData.language = data.language;
  }
  if (data.theme !== undefined) {
    dbData.theme = data.theme;
  }
  if (data.notificationSettings !== undefined) {
    dbData.notification_settings = data.notificationSettings;
  }
  if (data.purchasedCosmetics !== undefined) {
    dbData.purchased_cosmetics = data.purchasedCosmetics;
  }
  if (data.equippedCosmetics !== undefined) {
    dbData.equipped_cosmetics = data.equippedCosmetics;
  }
  if (data.equippedBadges !== undefined) {
    dbData.equipped_badges = data.equippedBadges;
  }
  if (data.district !== undefined) {
    dbData.district = data.district;
  }
  if (data.team !== undefined) {
    dbData.team = data.team;
  }

  await updateUser(username, dbData);
};

/**
 * Migrate a user from an old username to a new handle
 */
export const migrateUser = async (oldUsername: string, newHandle: string): Promise<void> => {
  if (!oldUsername || !newHandle || oldUsername === newHandle) {
    return;
  }

  try {
    const oldUser = await getUserByUsername(oldUsername);

    if (oldUser) {
      // Mark old user as migrated
      await updateUser(oldUsername, { migrated_to: newHandle });

      // Create new user with old user's data
      await upsertUser({
        username: newHandle,
        uid: oldUser.uid,
        email: oldUser.email,
        real_name: oldUser.real_name || oldUsername,
        avatar_id: oldUser.avatar_id,
        friend_count: oldUser.friend_count,
        games_played: oldUser.games_played,
        best_score: oldUser.best_score,
        total_score: oldUser.total_score,
        referral_code: newHandle.toLowerCase().replace(/[^a-z0-9]/g, ''),
        streak: oldUser.streak,
        max_streak: oldUser.max_streak,
        last_play_date: oldUser.last_play_date,
        giuros: oldUser.giuros,
        purchased_cosmetics: oldUser.purchased_cosmetics,
        equipped_cosmetics: oldUser.equipped_cosmetics,
        equipped_badges: oldUser.equipped_badges,
        last_login_date: oldUser.last_login_date,
        language: oldUser.language,
        theme: oldUser.theme,
        notification_settings: oldUser.notification_settings,
        migrated_from: oldUsername,
        district: oldUser.district,
        team: oldUser.team,
      });

      // Update game_results to point to new username
      await supabase.from('game_results').update({ user_id: newHandle }).eq('user_id', oldUsername);

      console.warn(`[Migration] Successfully migrated ${oldUsername} to ${newHandle}`);
    }
  } catch (error) {
    console.error('[Migration] Error migrating user:', error);
    throw error;
  }
};

/**
 * Self-healing/Repair function for migrations
 */
export const healMigration = async (handle: string): Promise<void> => {
  if (!handle) {
    return;
  }

  try {
    const user = await getUserByUsername(handle);
    if (!user) {
      return;
    }

    const oldName = user.migrated_from;
    if (oldName && oldName !== handle) {
      const oldUser = await getUserByUsername(oldName);
      if (oldUser && oldUser.migrated_to !== handle) {
        await updateUser(oldName, { migrated_to: handle });
        console.warn(`[Heal] Fixed migratedTo link for ${oldName}`);
      }
    }
  } catch (e) {
    console.warn('[Heal] Migration repair failed:', e);
  }
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
      .eq('referrer', username.toLowerCase())
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

  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('referrer, bonus_awarded')
      .eq('referred', username.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data || data.bonus_awarded) {
      return null;
    }

    // Mark as awarded
    await supabase
      .from('referrals')
      .update({ bonus_awarded: true })
      .eq('referred', username.toLowerCase());

    return data.referrer;
  } catch (e) {
    console.error('Error getting referrer:', e);
    return null;
  }
};

/**
 * Save game result to user's personal history
 */
export const saveUserGameResult = async (username: string, gameData: GameData): Promise<void> => {
  if (!username) {
    return;
  }

  try {
    let dateStr: string;
    if (gameData.date) {
      if (typeof gameData.date === 'number') {
        // Convert YYYYMMDD to YYYY-MM-DD
        const d = gameData.date;
        const year = Math.floor(d / 10000);
        const month = Math.floor((d % 10000) / 100);
        const day = d % 100;
        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else {
        dateStr = gameData.date;
      }
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }

    await saveUserGame({
      username: username.toLowerCase(),
      date: dateStr,
      score: gameData.score,
      avgTime: gameData.time,
    });
  } catch (e) {
    console.error('Error saving user game result:', e);
  }
};

/**
 * Get user's game history
 */
export const getUserGameHistory = async (username: string): Promise<GameData[]> => {
  if (!username) {
    return [];
  }

  try {
    const games = await dbGetUserGameHistory(username.toLowerCase());

    return games.map(g => ({
      score: g.score,
      date: parseInt(g.date.replace(/-/g, ''), 10),
      time: g.avg_time || undefined,
      timestamp: new Date(g.played_at).getTime(),
    }));
  } catch (e) {
    console.error('Error fetching user game history:', e);
    return [];
  }
};

/**
 * Update district score
 */
export const updateDistrictScore = async (districtId: string, score: number): Promise<void> => {
  if (!districtId || !score) {
    return;
  }
  await dbUpdateDistrictScore(districtId, score);
};

/**
 * Get district rankings
 */
export const getDistrictRankings = async (): Promise<{ id: string; score: number }[]> => {
  try {
    const districts = await getDistricts();
    return districts.map(d => ({ id: d.id, score: d.score }));
  } catch (e) {
    console.error('Error fetching district rankings:', e);
    return [];
  }
};
