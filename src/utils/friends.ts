import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAt,
  Timestamp,
  where,
} from 'firebase/firestore';
import { SOCIAL } from '../config/constants';
import { db } from '../firebase';

const USERS_COLLECTION = 'users';
// const HIGHSCORES_COLLECTION = 'highscores';
const SCORES_COLLECTION = 'scores';
const BLOCKS_COLLECTION = 'blocks';

const CHUNK_SIZE = 10;
const FEED_LIMIT = 100;
const LEGACY_SEARCH_LIMIT = 5;
const MS_PER_SECOND = 1000;

export interface UserSearchResult {
  username: string;
  bestScore: number;
}

export interface FriendRequest {
  id: string;
  from: string;
  timestamp: Timestamp;
  status: string;
}

export interface Friend {
  username: string;
  since?: Timestamp;
  badges?: string[];
  todayGames?: number;
  avatarId?: number;
}

export interface FeedActivity {
  id: string;
  type: 'daily_score' | 'badge_earned' | 'username_changed' | 'cosmetic_purchased';
  username: string;
  score?: number;
  time?: number;
  timestamp?: Timestamp | { seconds: number };
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

// Helper to match leaderboard sanitization and ensure consistent IDs (lowercase)
const sanitize = (name: string): string => name.toLowerCase().replace(/\//g, '_');

/**
 * Search for users by username prefix (using highscores as user index)
 */
export const searchUsers = async (searchText: string): Promise<UserSearchResult[]> => {
  if (!searchText || searchText.length < 2) {
    return [];
  }

  const searchLower = searchText.toLowerCase();
  const cleanSearch = searchLower.startsWith('@') ? searchLower.slice(1) : searchLower;
  const legacySearch = `@${cleanSearch}`;

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const lowerQuery = cleanSearch;

    const q1 = query(
      usersRef,
      where('username', '>=', lowerQuery),
      where('username', '<=', `${lowerQuery}\uf8ff`),
      limit(SOCIAL.FRIENDS.MAX_DISPLAY)
    );

    const q2 = query(
      collection(db, USERS_COLLECTION),
      orderBy('username'),
      startAt(legacySearch),
      endAt(`${legacySearch}\uf8ff`),
      limit(LEGACY_SEARCH_LIMIT)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const results = new Map<string, UserSearchResult>();

    const processDoc = (docSnap: DocumentData): void => {
      const data = docSnap.data() as DocumentData;
      const rawUser = data.username as string;
      const key = rawUser.replace(/^@/, '').toLowerCase();

      if (!results.has(key)) {
        const isHandle = rawUser.includes('#');
        const displayUser = isHandle || rawUser.startsWith('@') ? rawUser : `@${rawUser}`;

        results.set(key, {
          username: displayUser,
          bestScore: data.score as number,
        });
      }
    };

    snap1.forEach(processDoc);
    snap2.forEach(processDoc);

    return Array.from(results.values());
  } catch (e) {
    console.error('Error searching users:', e);
    return [];
  }
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
    const targetRef = doc(db, USERS_COLLECTION, toClean);
    const targetDoc = await getDoc(targetRef);
    if (targetDoc.exists()) {
      const data = targetDoc.data() as DocumentData;
      if (data.migratedTo) {
        toClean = sanitize(data.migratedTo as string);
        if (fromClean === toClean) {
          return { error: 'Cannot add yourself' };
        }
      }
    }

    const friendshipRef = doc(db, USERS_COLLECTION, fromClean, 'friends', toClean);
    const friendshipSnap = await getDoc(friendshipRef);
    if (friendshipSnap.exists()) {
      return { error: 'Already friends' };
    }

    // Check reverse friendship to be safe
    const reverseFriendshipRef = doc(db, USERS_COLLECTION, toClean, 'friends', fromClean);
    const reverseFriendshipSnap = await getDoc(reverseFriendshipRef);
    if (reverseFriendshipSnap.exists()) {
      // If inconsistent, we can maybe self-heal here, but for now just block
      return { error: 'Already friends' };
    }

    // Check if they already sent YOU a request
    const reverseRequestRef = doc(db, USERS_COLLECTION, fromClean, 'requests', toClean);
    const reverseRequestSnap = await getDoc(reverseRequestRef);
    if (reverseRequestSnap.exists()) {
      return { error: 'They already sent you a request. Check your inbox!' };
    }

    const requestRef = doc(db, USERS_COLLECTION, toClean, 'requests', fromClean);
    const requestSnap = await getDoc(requestRef);
    if (requestSnap.exists()) {
      return { error: 'Request already sent' };
    }

    await setDoc(requestRef, {
      from: fromUsername,
      timestamp: Timestamp.now(),
      status: 'pending',
    });

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

  try {
    const q = query(collection(db, USERS_COLLECTION, clean, 'requests'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as FriendRequest[];
  } catch (e) {
    console.error('Error getting requests:', e);
    return [];
  }
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
    await setDoc(doc(db, USERS_COLLECTION, cleanUser, 'friends', cleanFrom), {
      username: fromUsername,
      since: Timestamp.now(),
    });

    await setDoc(doc(db, USERS_COLLECTION, cleanFrom, 'friends', cleanUser), {
      username: username,
      since: Timestamp.now(),
    });

    await deleteDoc(doc(db, USERS_COLLECTION, cleanUser, 'requests', cleanFrom));

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
    await deleteDoc(doc(db, USERS_COLLECTION, cleanUser, 'requests', cleanFrom));
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
    const snapshot = await getDocs(collection(db, USERS_COLLECTION, clean, 'friends'));
    const friends: Friend[] = [];

    const today = new Date();
    const todaySeed = parseInt(
      `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`,
      10
    );

    for (const friendDoc of snapshot.docs) {
      const friendData = friendDoc.data() as DocumentData;
      const friendUsername = friendData.username as string;
      const cleanFriendUsername = friendUsername.startsWith('@')
        ? friendUsername.slice(1)
        : friendUsername;

      try {
        const userRef = doc(db, USERS_COLLECTION, sanitize(cleanFriendUsername));
        const userSnap = await getDoc(userRef);

        let badges: string[] = [];
        let todayGames = 0;
        let avatarId: number | undefined;

        if (userSnap.exists()) {
          const profileData = userSnap.data() as DocumentData;
          badges = (profileData.equippedBadges as string[]) || [];
          avatarId = profileData.avatarId as number | undefined;
        }

        const scoresQuery = query(
          collection(db, SCORES_COLLECTION),
          where('username', '==', cleanFriendUsername),
          where('date', '==', todaySeed)
        );

        const scoresSnap = await getDocs(scoresQuery);
        todayGames = scoresSnap.size;

        friends.push({
          ...(friendData as Friend),
          badges,
          todayGames,
          avatarId,
        });
      } catch (profileError) {
        console.warn(`Could not fetch profile for ${friendUsername}:`, profileError);
        friends.push(friendData as Friend);
      }
    }

    return friends;
  } catch (e) {
    console.error('Error getting friends:', e);
    return [];
  }
};

/**
 * Get Friend Activity Feed
 */
export const getFriendFeed = async (friendsList: Friend[]): Promise<FeedActivity[]> => {
  if (!friendsList || friendsList.length === 0) {
    return [];
  }

  const friendNames = friendsList.map(f => {
    const username = f.username;
    return username.startsWith('@') ? username.slice(1) : username;
  });
  const allActivities: FeedActivity[] = [];

  const friendSet = new Set(friendNames.map(n => n.toLowerCase()));

  // Create a map for quick friend lookup by username
  const friendMap = new Map<string, Friend>();
  friendsList.forEach(f => {
    const name = f.username.startsWith('@') ? f.username.slice(1) : f.username;
    friendMap.set(name.toLowerCase(), f);
  });

  try {
    const q = query(
      collection(db, SCORES_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(FEED_LIMIT)
    );

    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      const data = docSnap.data() as DocumentData;
      const rawUser = (data.username as string) || '';
      const lowerUser = rawUser.toLowerCase();
      const cleanLower = lowerUser.startsWith('@') ? lowerUser.slice(1) : lowerUser;

      if (friendSet.has(cleanLower)) {
        const friend = friendMap.get(cleanLower);
        allActivities.push({
          id: docSnap.id,
          type: 'daily_score',
          username: data.username as string,
          score: data.score as number,
          time: data.time as number,
          timestamp: data.timestamp as Timestamp,
          avatarId: friend?.avatarId,
        });
      }
    });
  } catch (e) {
    console.error('Feed query failed:', e);
  }

  const chunks: string[][] = [];
  for (let i = 0; i < friendNames.length; i += CHUNK_SIZE) {
    chunks.push(friendNames.slice(i, i + CHUNK_SIZE));
  }

  for (const chunk of chunks) {
    try {
      for (const username of chunk) {
        const userRef = doc(db, USERS_COLLECTION, username);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data() as DocumentData;
          if (data.migratedFrom && data.updatedAt) {
            allActivities.push({
              id: `namechange_${username}`,
              type: 'username_changed',
              username: username,
              oldUsername: data.migratedFrom as string,
              timestamp: data.updatedAt as Timestamp,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error checking username changes:', e);
    }
  }

  allActivities.sort((a, b) => {
    const timeA = (a.timestamp as { seconds?: number })?.seconds || 0;
    const timeB = (b.timestamp as { seconds?: number })?.seconds || 0;
    return timeB - timeA;
  });

  const uniqueActivities: FeedActivity[] = [];
  const seenUserDays = new Set<string>();
  const seenNameChanges = new Set<string>();

  const MAX_FEED_RESULTS = 50;
  for (const activity of allActivities) {
    if (activity.type === 'daily_score') {
      if (!activity.timestamp) {
        continue;
      }
      const seconds = (activity.timestamp as { seconds: number }).seconds;
      const date = new Date(seconds * MS_PER_SECOND).toDateString();
      const key = `${activity.username}_${date}`;
      if (!seenUserDays.has(key)) {
        seenUserDays.add(key);
        uniqueActivities.push(activity);
      }
    } else if (activity.type === 'username_changed') {
      if (!seenNameChanges.has(activity.username)) {
        seenNameChanges.add(activity.username);
        uniqueActivities.push(activity);
      }
    } else {
      uniqueActivities.push(activity);
    }
  }

  return uniqueActivities.slice(0, MAX_FEED_RESULTS);
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
    await deleteDoc(doc(db, USERS_COLLECTION, clean1, 'friends', clean2));
    await deleteDoc(doc(db, USERS_COLLECTION, clean2, 'friends', clean1));
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
    const friendRef = doc(db, USERS_COLLECTION, clean1, 'friends', clean2);
    const friendSnap = await getDoc(friendRef);
    if (friendSnap.exists()) {
      return 'friends';
    }

    const sentRef = doc(db, USERS_COLLECTION, clean2, 'requests', clean1);
    const sentSnap = await getDoc(sentRef);
    if (sentSnap.exists()) {
      return 'pending';
    }

    const receivedRef = doc(db, USERS_COLLECTION, clean1, 'requests', clean2);
    const receivedSnap = await getDoc(receivedRef);
    if (receivedSnap.exists()) {
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

  const blockId = `${sanitize(blocker)}_${sanitize(blocked)}`;
  await setDoc(doc(db, BLOCKS_COLLECTION, blockId), {
    blocker,
    blocked,
    createdAt: Timestamp.now(),
  });
};

/**
 * Unblock a user
 */
export const unblockUser = async (blocker: string, blocked: string): Promise<void> => {
  if (!blocker || !blocked) {
    return;
  }

  const blockId = `${sanitize(blocker)}_${sanitize(blocked)}`;
  const blockRef = doc(db, BLOCKS_COLLECTION, blockId);
  await deleteDoc(blockRef);
};

/**
 * Check if user1 has blocked user2
 */
export const getBlockStatus = async (user1: string, user2: string): Promise<boolean> => {
  try {
    const blockId = `${sanitize(user1)}_${sanitize(user2)}`;
    const blockRef = doc(db, BLOCKS_COLLECTION, blockId);
    const blockDoc = await getDoc(blockRef);
    return blockDoc.exists();
  } catch (e) {
    console.error('Error checking block status:', e);
    return false;
  }
};

/**
 * Get friend count for a user
 */
export const getFriendCount = async (username: string): Promise<number> => {
  if (!username) {
    return 0;
  }

  try {
    const friendsSnapshot = await getDocs(
      collection(db, USERS_COLLECTION, sanitize(username), 'friends')
    );
    return friendsSnapshot.size;
  } catch (e) {
    console.error('Error getting friend count:', e);
    return 0;
  }
};
