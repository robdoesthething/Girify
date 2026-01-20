import { supabase } from '../services/supabase';
import { logger } from './logger';

/**
 * Check if the current user is an admin
 * @returns true if the current user is in the admins table
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    // Check admins table
    const { data, error } = await supabase.from('admins').select('uid').eq('uid', user.id).single();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user.id;
};
