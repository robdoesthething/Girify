/**
 * Admin Profile Management Functions
 *
 * Admin-only operations for user profiles.
 * These functions require admin privileges.
 */

import { supabase } from '../../services/supabase';
import { updateUser } from '../../services/database';
import type { UserProfile } from './types';
import { normalizeUsername } from '../format';
import { rowToProfile } from './profile';

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
