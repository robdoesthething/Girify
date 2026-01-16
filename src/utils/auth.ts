import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { logger } from './logger';

/**
 * Check if the current user is an admin
 * @returns true if the current user has an admin document
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }

  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists();
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
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const adminDoc = await getDoc(doc(db, 'admins', user.uid));
  if (!adminDoc.exists()) {
    throw new Error('Not authorized: Admin access required');
  }
};

/**
 * Get the current user's UID
 * @throws Error if not authenticated
 */
export const requireAuth = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user.uid;
};
