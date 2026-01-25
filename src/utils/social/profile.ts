/**
 * Profile Management Functions
 *
 * Functions for user profile CRUD operations, lookups, and updates.
 */

import { DISTRICTS } from '../../data/districts';
import {
  createUser,
  getUserByUid as dbGetUserByUid,
  getUserByUsername,
  updateUser,
  upsertUser,
} from '../../services/database';
import { supabase } from '../../services/supabase';
import type { UserRow } from '../../types/supabase';
import { normalizeUsername } from '../format';

import type { AdditionalProfileData, NotificationSettings, UserProfile } from './types';

const DEFAULT_AVATAR_COUNT = 20;
const DEFAULT_GIUROS = 10;

/**
 * Helper to convert Supabase UserRow to UserProfile
 * @param row - The raw database row
 * @returns The structured UserProfile object
 */
export function rowToProfile(row: UserRow): UserProfile {
  return {
    id: row.username,
    username: row.username,
    uid: row.uid,
    email: row.email,
    realName: row.real_name || '',
    avatarId: row.avatar_id || undefined,
    joinedAt: row.joined_at || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
    friendCount: row.friend_count ?? 0,
    banned: row.banned ?? false,
    gamesPlayed: row.games_played ?? 0,
    bestScore: row.best_score ?? 0,
    totalScore: row.total_score ?? 0,
    referralCode: row.referral_code || undefined,
    streak: row.streak ?? 0,
    maxStreak: row.max_streak ?? 0,
    lastPlayDate: row.last_play_date,
    giuros: row.giuros ?? 0,
    purchasedCosmetics: row.purchased_cosmetics || [],
    equippedCosmetics: (row.equipped_cosmetics as Record<string, string>) || {},
    equippedBadges: row.equipped_badges || [],
    lastLoginDate: row.last_login_date,
    language: row.language || 'en',
    theme: (row.theme as 'dark' | 'light' | 'auto') || 'auto',
    notificationSettings:
      (row.notification_settings as unknown as NotificationSettings) || undefined,
    migratedTo: row.migrated_to,
    migratedFrom: row.migrated_from,
    referredBy: row.referred_by,
    district: row.district || undefined,
    team: row.team || undefined,
    role: ((row as unknown as { role?: string }).role as 'admin' | 'user' | undefined) || undefined,
  };
}

/**
 * Get or create user profile document in Supabase.
 * @param usernameInput - The desired username (will be normalized)
 * @param uid - Optional Auth UID to link
 * @param additionalData - Optional metadata to populate profile
 * @returns Promise resolving to the user profile or null if failed
 */
export const ensureUserProfile = async (
  usernameInput: string,
  uid: string | null = null,
  additionalData: AdditionalProfileData = {}
): Promise<UserProfile | null> => {
  if (!usernameInput) {
    return null;
  }
  const username = normalizeUsername(usernameInput);

  const existingUser = await getUserByUsername(username);

  let userDbRecord = existingUser;
  if (additionalData.email && !existingUser) {
    const foundByEmail = await getUserByEmail(additionalData.email);
    if (foundByEmail) {
      console.warn(
        `[Auth] Found existing user by email ${additionalData.email}: ${foundByEmail.username}`
      );
      userDbRecord = await getUserByUsername(foundByEmail.username);
    }
  }

  if (!userDbRecord) {
    const selectedDistrictId =
      additionalData.district ||
      (DISTRICTS.length > 0
        ? DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)]!.id
        : 'ciutat_vella');
    const selectedTeamName =
      DISTRICTS.find(d => d.id === selectedDistrictId)?.teamName || 'Giraffe Team';

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

  const updates: Record<string, unknown> = {};

  if (uid && userDbRecord.uid !== uid) {
    updates.uid = uid;
  }
  if (additionalData.email && !userDbRecord.email) {
    updates.email = additionalData.email.toLowerCase().trim();
  }
  if (additionalData.district && userDbRecord.district !== additionalData.district) {
    updates.district = additionalData.district;
    updates.team = DISTRICTS.find(d => d.id === additionalData.district)?.teamName || null;
  }
  if (!userDbRecord.team && userDbRecord.district) {
    updates.team = DISTRICTS.find(d => d.id === userDbRecord.district)?.teamName || null;
  }

  if (Object.keys(updates).length > 0) {
    await updateUser(userDbRecord.username, updates);
    Object.assign(userDbRecord, updates);
  }

  return rowToProfile(userDbRecord);
};

/**
 * Look up a user profile by email address
 * @param email - The email to search for
 * @returns Promise resolving to profile or null if not found
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
 * @param uid - The firebase auth UID
 * @returns Promise resolving to profile or null if not found
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
 * Fetch user profile from Supabase by username
 * @param username - The username to search for
 * @returns Promise resolving to profile or null if not found
 */
export const getUserProfile = async (username: string): Promise<UserProfile | null> => {
  if (!username) {
    return null;
  }

  const user = await getUserByUsername(normalizeUsername(username));
  if (user) {
    return rowToProfile(user);
  }

  return null;
};

/**
 * Update user profile data
 * @param username - The username to update
 * @param data - The partial profile data to update
 * @returns Promise resolving when update is complete
 */
export const updateUserProfile = async (
  username: string,
  data: Partial<UserProfile>
): Promise<void> => {
  if (!username || !data) {
    return;
  }

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
 * Get all users for admin table
 * @param limitCount - Max users to return (default 50)
 * @returns Promise resolving to list of all user profiles
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
 * @param targetUsername - The user to update
 * @param data - The data fields to change
 * @returns Promise resolving when update is complete
 */
export const updateUserAsAdmin = async (
  targetUsername: string,
  data: Partial<UserProfile>
): Promise<void> => {
  if (!targetUsername || !data) {
    return;
  }

  const { requireAdmin } = await import('../auth');
  await requireAdmin();

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
 * @param username - The username to delete
 * @returns Promise resolving to operation success status
 */
export const deleteUserAndData = async (
  username: string
): Promise<{ success: boolean; error?: string }> => {
  if (!username) {
    return { success: false, error: 'No username provided' };
  }

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('username', normalizeUsername(username));

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
 * Migrate a user from an old username to a new handle
 * @param oldUsername - The username to migrate from
 * @param newHandle - The new username handle
 * @returns Promise resolving when migration is complete
 */
export const migrateUser = async (oldUsername: string, newHandle: string): Promise<void> => {
  if (!oldUsername || !newHandle || oldUsername === newHandle) {
    return;
  }

  try {
    const oldUser = await getUserByUsername(oldUsername);

    if (oldUser) {
      await updateUser(oldUsername, { migrated_to: newHandle });

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
 * @param handle - The current or potential handle to check
 * @returns Promise resolving when check/repair is complete
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
