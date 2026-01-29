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
import { normalizeUsername } from '../format';

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
const sanitize = (name: string): string => normalizeUsername(name).replace(/\//g, '_');

/**
 * Search for users by username prefix
 * @param searchText - The search string (min 2 chars)
 * @returns Promise resolving to a list of matching users (username and best score)
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
 * @param fromUsername - The username sending the request
 * @param toUsername - The target username to befriend
 * @returns Promise resolving to success status or error message
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
    // Rate limit check (10 requests per hour)
    // Note: RPC function added via migration, cast needed until types regenerated
    const { data: rateLimitOk, error: rateLimitError } = await (supabase as any).rpc(
      'check_friend_request_rate_limit',
      { p_user_id: fromClean }
    );

    if (rateLimitError) {
      console.error('[Friends] Rate limit check failed:', rateLimitError);
      // Fail open - allow request if rate limit check fails
    } else if (rateLimitOk === false) {
      return { error: 'Too many friend requests. Please wait an hour before sending more.' };
    }

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

    // Check if blocked
    const iBlockedThem = await isUserBlocked(fromClean, toClean);
    const theyBlockedMe = await isUserBlocked(toClean, fromClean);
    if (iBlockedThem || theyBlockedMe) {
      return { error: 'Cannot add this user' };
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
    console.error('[Friends] Error sending request:', e);
    return { error: (e as Error).message };
  }
};

/**
 * Get incoming friend requests
 * @param username - The username to fetch requests for
 * @returns Promise resolving to list of friend requests
 */
export const getIncomingRequests = async (username: string): Promise<FriendRequest[]> => {
  if (!username) {
    console.warn('[Friends] getIncomingRequests called with empty username');
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
 * @param username - The username accepting the request
 * @param fromUsername - The username of the requester
 * @returns Promise resolving to operation result
 */
export const acceptFriendRequest = async (
  username: string,
  fromUsername: string
): Promise<OperationResult> => {
  const cleanUser = sanitize(username);
  const cleanFrom = sanitize(fromUsername);

  try {
    // Check for blocks
    const iBlockedThem = await isUserBlocked(cleanUser, cleanFrom);
    const theyBlockedMe = await isUserBlocked(cleanFrom, cleanUser); // Assuming this checks the reverse

    if (iBlockedThem || theyBlockedMe) {
      return { error: 'Cannot accept request due to block' };
    }

    // Verify request still exists (race condition mitigation)
    const pendingRequests = await getIncomingRequests(cleanUser);
    const validRequest = pendingRequests.some(r => r.from === cleanFrom && r.status === 'pending');
    if (!validRequest) {
      return { error: 'Friend request no longer available' };
    }

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
    console.error('[Friends] Error accepting request:', e);
    return { error: (e as Error).message };
  }
};

/**
 * Decline/Delete friend request
 * @param username - The username declining the request
 * @param fromUsername - The requester username
 * @returns Promise resolving to operation result
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
 * @param username - The username to fetch friends for
 * @returns Promise resolving to list of friends with their stats
 */
export const getFriends = async (username: string): Promise<Friend[]> => {
  if (!username) {
    console.warn('[Friends] getFriends called with empty username');
    return [];
  }
  const clean = sanitize(username);

  try {
    const dbFriends = await dbGetFriends(clean);

    if (dbFriends.length === 0) {
      return [];
    }

    const friendUsernames = dbFriends.map(f => f.friend_username);

    // Batch fetch profiles
    const { data: profiles } = await supabase
      .from('users')
      .select('username, equipped_badges, avatar_id, equipped_cosmetics')
      .in('username', friendUsernames);

    const profilesMap = new Map(profiles?.map(p => [p.username, p]) || []);

    // Batch fetch today's games count
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const { data: todayGamesEntries } = await supabase
      .from('user_games')
      .select('username')
      .eq('date', todayStr as string)
      .in('username', friendUsernames);

    const gamesCountMap = new Map<string, number>();
    todayGamesEntries?.forEach((g: { username: string }) => {
      gamesCountMap.set(g.username, (gamesCountMap.get(g.username) || 0) + 1);
    });

    const friends: Friend[] = dbFriends.map(f => {
      const profile = profilesMap.get(f.friend_username);
      const todayGames = gamesCountMap.get(f.friend_username) || 0;

      return {
        username: f.friend_username,
        since: f.since,
        badges: profile?.equipped_badges || [],
        todayGames,
        avatarId: profile?.avatar_id || undefined,
        equippedCosmetics: (profile?.equipped_cosmetics as Friend['equippedCosmetics']) || {},
      };
    });

    return friends;
  } catch (e) {
    console.error('[Friends] Error getting friends:', e);
    return [];
  }
};

const FEED_LIMIT = 50;

/**
 * Get Friend Activity Feed
 * @param friendsList - The list of friends to fetch activity for
 * @param limit - Max items to fetch
 * @param offset - Offset for pagination
 * @returns Promise resolving to list of activity feed items
 */
export const getFriendFeed = async (
  friendsList: Friend[],
  limit = FEED_LIMIT,
  offset = 0
): Promise<FeedActivity[]> => {
  if (!friendsList || friendsList.length === 0) {
    return [];
  }

  const friendNames = friendsList.map(f => f.username);

  try {
    const activities = await getActivityFeed(friendNames, limit, offset);

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
 * @param user1 - The username initiating removal
 * @param user2 - The friend to remove
 * @returns Promise resolving to operation result
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
 * @param user1 - The first user
 * @param user2 - The second user
 * @returns Promise resolving to status: 'friends', 'pending', or 'none'
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
 * @param blocker - The username blocking the other
 * @param blocked - The username to be blocked
 * @returns Promise resolving when block is complete
 */
export const blockUser = async (blocker: string, blocked: string): Promise<void> => {
  if (!blocker || !blocked || blocker === blocked) {
    return;
  }
  await dbBlockUser(blocker, blocked);
};

/**
 * Unblock a user
 * @param blocker - The username who blocked
 * @param blocked - The username to unblock
 * @returns Promise resolving when unblock is complete
 */
export const unblockUser = async (blocker: string, blocked: string): Promise<void> => {
  if (!blocker || !blocked) {
    return;
  }
  await dbUnblockUser(blocker, blocked);
};

/**
 * Check if user1 has blocked user2
 * @param user1 - The potential blocker
 * @param user2 - The potential blocked user
 * @returns Promise resolving to true if blocked, false otherwise
 */
export const getBlockStatus = async (user1: string, user2: string): Promise<boolean> => {
  return isUserBlocked(user1, user2);
};

/**
 * Get friend count for a user
 * @param username - The username to check
 * @returns Promise resolving to number of friends
 */
export const getFriendCount = async (username: string): Promise<number> => {
  if (!username) {
    return 0;
  }
  // We can query the friends view/function, or just rely on user profile count
  try {
    const user = await getUserByUsername(normalizeUsername(username));
    return user?.friend_count || 0;
  } catch (e) {
    console.error('Error getting friend count:', e);
    return 0;
  }
};
