import { auth } from '../firebase';
import { supabase } from '../services/supabase';
import { normalizeUsername } from './format';
import { logger } from './logger';

/**
 * Check if the current user is an admin
 * @returns true if the current user is in the admins table
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    // Check admins table
    const { data, error } = await supabase
      .from('admins')
      .select('uid')
      .eq('uid', user.uid)
      .single();

    if (error || !data) {
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Error checking admin status', { error });
    return false;
  }
};

/**
 * Require the current user to be an admin
 * @throws Error if not authenticated or not an admin
 */
export const requireAdmin = async (): Promise<void> => {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error('Not authorized: Admin access required');
  }
};

/**
 * Get the current user's UID
 * @throws Error if not authenticated
 */
export const requireAuth = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user.uid;
};

/**
 * Get the current authenticated user's username from the database
 * @returns The normalized username or null if not authenticated/found
 */
export const getCurrentUsername = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('uid', user.uid)
    .single();

  if (error || !data) {
    return null;
  }
  return data.username;
};

/**
 * Assert that the given username belongs to the currently authenticated user.
 * @throws Error if not authenticated or username doesn't match
 */
export const assertCurrentUser = async (username: string): Promise<void> => {
  const currentUsername = await getCurrentUsername();
  if (!currentUsername) {
    throw new Error('Not authenticated');
  }
  if (normalizeUsername(username) !== normalizeUsername(currentUsername)) {
    throw new Error('Unauthorized: username does not match authenticated user');
  }
};
