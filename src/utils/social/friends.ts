import { Timestamp } from 'firebase/firestore'; // Keep for type compatibility if needed, or remove if unused. Types often used in UI.
import { SOCIAL } from '../../config/constants';
import {
  addFriendship,
  areFriends,
  createFriendRequest,
  blockUser as dbBlockUser,
  getFriends as dbGetFriends,
  searchUsers as dbSearchUsers,
  unblockUser as dbUnblockUser,
  deleteFriendRequest,
  getActivityFeed,
  getPendingFriendRequests,
  getSentFriendRequests,
  getUserByUsername,
  isUserBlocked,
  removeFriendship,
  updateFriendRequestStatus,
} from '../../services/database';
import { supabase } from '../../services/supabase';

export interface UserSearchResult {
  username: string;
  bestScore: number;
}

export interface FriendRequest {
  id: string;
  from: string;
  timestamp: Timestamp | string;
  status: string;
}

export interface Friend {
  username: string;
  since?: Timestamp | string;
  badges?: string[];
  todayGames?: number;
  avatarId?: number;
  equippedCosmetics?: {
    avatarId?: string;
    frameId?: string;
    titleId?: string;
  };
}

export interface FeedActivity {
  id: string;
  type: 'daily_score' | 'badge_earned' | 'username_changed' | 'cosmetic_purchased';
  username: string;
  score?: number;
  time?: number;
  timestamp?: Timestamp | { seconds: number } | string;
  oldUsername?: string;
  avatarId?: number;
  itemName?: string;
  badge?: { name: string; emoji: string };
}

type FriendshipStatus = 'friends' | 'pending' | 'none';

interface OperationResult {
  success?: boolean;
  error?: string;
}

// Helper to normalize usernames
const sanitize = (name: string): string => name.toLowerCase().replace(/\//g, '_');

/**
 * Search for users by username prefix
 */
export const searchUsers = async (searchText: string): Promise<UserSearchResult[]> => {
  if (!searchText || searchText.length < 2) {
    return [];
  }

  const users = await dbSearchUsers(searchText, SOCIAL.FRIENDS.MAX_DISPLAY);

  return users.map(user => ({
    username: user.username,
    bestScore: user.best_score || 0,
  }));
};

/**
 * Send a friend request
 */
export const sendFriendRequest = async (
  fromUsername: string,
  toUsername: string
): Promise<OperationResult> => {
  if (!fromUsername || !toUsername) {
    return { error: 'Invalid usernames' };
  }

  const fromClean = sanitize(fromUsername);
  let toClean = sanitize(toUsername);

  if (fromClean === toClean) {
    return { error: 'Cannot add yourself' };
  }

  try {
    // Check if target user exists and handle migration
    const targetUser = await getUserByUsername(toClean);
    if (targetUser) {
      if (targetUser.migrated_to) {
        toClean = sanitize(targetUser.migrated_to);
        if (fromClean === toClean) {
          return { error: 'Cannot add yourself' };
        }
      }
    } else {
      // User not found
      return { error: 'User not found' };
    }

    // Check if already friends
    const isFriend = await areFriends(fromClean, toClean);
    if (isFriend) {
      return { error: 'Already friends' };
    }

    // Check if they already sent YOU a request
    const pendingRequests = await getPendingFriendRequests(fromClean);
    const hasIncoming = pendingRequests.some(r => r.from_user === toClean);
    if (hasIncoming) {
      return { error: 'They already sent you a request. Check your inbox!' };
    }

    // Check if YOU already sent THEM a request
    const sentRequests = await getSentFriendRequests(fromClean);
    const hasSent = sentRequests.some(r => r.to_user === toClean);
    if (hasSent) {
      return { error: 'Request already sent' };
    }

    // Create request
    const success = await createFriendRequest(fromClean, toClean);
    if (!success) {
      throw new Error('Failed to create friend request');
    }

    return { success: true };
  } catch (e) {
    console.error('Error sending request:', e);
    return { error: (e as Error).message };
  }
};

/**
 * Get incoming friend requests
 */
export const getIncomingRequests = async (username: string): Promise<FriendRequest[]> => {
  if (!username) {
    return [];
  }
  const clean = sanitize(username);

  const requests = await getPendingFriendRequests(clean);
  return requests.map(r => ({
    id: r.id.toString(),
    from: r.from_user,
    timestamp: r.created_at || new Date().toISOString(),
    status: r.status || 'pending',
  }));
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (
  username: string,
  fromUsername: string
): Promise<OperationResult> => {
  const cleanUser = sanitize(username);
  const cleanFrom = sanitize(fromUsername);

  try {
    // Transactional logic ideally, but sequential is fine for now
    const added = await addFriendship(cleanUser, cleanFrom);
    if (!added) {
      throw new Error('Failed to create friendship');
    }

    await updateFriendRequestStatus(cleanFrom, cleanUser, 'accepted');
    // If update fails but friendship created, we might have a dangling request.
    // Ideally we delete it.
    await deleteFriendRequest(cleanFrom, cleanUser);

    return { success: true };
  } catch (e) {
    console.error('Error accepting request:', e);
    return { error: (e as Error).message };
  }
};

/**
 * Decline/Delete friend request
 */
export const declineFriendRequest = async (
  username: string,
  fromUsername: string
): Promise<OperationResult> => {
  const cleanUser = sanitize(username);
  const cleanFrom = sanitize(fromUsername);
  try {
    await deleteFriendRequest(cleanFrom, cleanUser);
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
};

/**
 * Get my friends list
 */
export const getFriends = async (username: string): Promise<Friend[]> => {
  if (!username) {
    return [];
  }
  const clean = sanitize(username);

  try {
    const dbFriends = await dbGetFriends(clean);

    // Enrich with profile data and daily stats
    // This could be optimized with a specific Supabase RPC or view
    const friends: Friend[] = [];
    const today = new Date();
    // YYYYMMDD format for score date check if compatible, otherwise use date string
    // Supabase user_games uses 'date' column as DATE type (YYYY-MM-DD)
    const todayStr = today.toISOString().split('T')[0];

    for (const f of dbFriends) {
      const friendProfile = await getUserByUsername(f.friend_username);
      let badges: string[] = [];
      let todayGames = 0;
      let avatarId: number | undefined;
      let equippedCosmetics: Friend['equippedCosmetics'] = {};

      if (friendProfile) {
        badges = friendProfile.equipped_badges || [];
        avatarId = friendProfile.avatar_id || undefined;
        equippedCosmetics = (friendProfile.equipped_cosmetics as Friend['equippedCosmetics']) || {};
      }

      // Get today's games count
      const { count } = await supabase
        .from('user_games')
        .select('*', { count: 'exact', head: true })
        .eq('username', f.friend_username)
        .eq('date', todayStr as string);

      todayGames = count || 0;

      friends.push({
        username: f.friend_username,
        since: f.since,
        badges,
        todayGames,
        avatarId,
        equippedCosmetics,
      });
    }

    return friends;
  } catch (e) {
    console.error('Error getting friends:', e);
    return [];
  }
};

// Increased limit for debugging data persistence issues
// TODO: Consider implementing proper pagination once data is confirmed working
const FEED_LIMIT = 200;

/**
 * Get Friend Activity Feed
 */
export const getFriendFeed = async (friendsList: Friend[]): Promise<FeedActivity[]> => {
  if (!friendsList || friendsList.length === 0) {
    return [];
  }

  const friendNames = friendsList.map(f => f.username);

  try {
    const activities = await getActivityFeed(friendNames, FEED_LIMIT);

    return activities.map(a => ({
      id: a.id.toString(),
      type: a.type as FeedActivity['type'],
      username: a.username,
      score: a.score || undefined,
      time: a.time_taken || undefined,
      timestamp: a.created_at || new Date().toISOString(),
      oldUsername: a.old_username || undefined,
      avatarId: undefined, // Need to fetch or map from friendsList
      itemName: a.item_name || undefined,
      badge: a.badge_name ? { name: a.badge_name, emoji: '🏆' } : undefined, // Simplified
    }));
  } catch (e) {
    console.error('Feed query failed:', e);
    return [];
  }
};

/**
 * Remove a friend
 */
export const removeFriend = async (user1: string, user2: string): Promise<OperationResult> => {
  if (!user1 || !user2) {
    return { error: 'Invalid users' };
  }
  const clean1 = sanitize(user1);
  const clean2 = sanitize(user2);

  try {
    await removeFriendship(clean1, clean2);
    return { success: true };
  } catch (e) {
    console.error('Error removing friend:', e);
    return { error: (e as Error).message };
  }
};

/**
 * Get friendship status between two users
 */
export const getFriendshipStatus = async (
  user1: string,
  user2: string
): Promise<FriendshipStatus> => {
  if (!user1 || !user2) {
    return 'none';
  }
  const clean1 = sanitize(user1);
  const clean2 = sanitize(user2);

  try {
    if (await areFriends(clean1, clean2)) {
      return 'friends';
    }

    const pending = await getPendingFriendRequests(clean1);
    const hasIncoming = pending.some(r => r.from_user === clean2);
    if (hasIncoming) {
      return 'pending';
    }

    const sent = await getSentFriendRequests(clean1);
    const hasSent = sent.some(r => r.to_user === clean2);
    if (hasSent) {
      return 'pending';
    }

    return 'none';
  } catch (e) {
    console.error('Error checking friendship:', e);
    return 'none';
  }
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
 * Get friend count for a user
 */
export const getFriendCount = async (username: string): Promise<number> => {
  if (!username) {
    return 0;
  }
  // We can query the friends view/function, or just rely on user profile count
  try {
    const user = await getUserByUsername(username);
    return user?.friend_count || 0;
  } catch (e) {
    console.error('Error getting friend count:', e);
    return 0;
  }
};
