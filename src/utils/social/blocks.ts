/**
 * Block and Friend Request Functions
 *
 * Functions for managing user blocks and friend requests.
 */

import {
  blockUser as dbBlockUser,
  getPendingFriendRequests as dbGetPendingFriendRequests,
  unblockUser as dbUnblockUser,
  isUserBlocked,
} from '../../services/database';

/**
 * Get pending friend requests for a user
 * @param username - The username to check
 * @returns Promise resolving to list of pending requests
 */
export const getPendingFriendRequests = async (
  username: string
): Promise<Array<{ id: string; [key: string]: unknown }>> => {
  const requests = await dbGetPendingFriendRequests(username);
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
