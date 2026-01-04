import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  Timestamp,
  startAt,
  endAt,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users'; // Store user profiles/friends here
const HIGHSCORES_COLLECTION = 'highscores'; // For searching users
const SCORES_COLLECTION = 'scores'; // For feed
const BLOCKS_COLLECTION = 'blocks';

// Helper to match leaderboard sanitization
const sanitize = name => name.replace(/\//g, '_');

/**
 * Search for users by username prefix (using highscores as user index)
 */
export const searchUsers = async searchText => {
  if (!searchText || searchText.length < 2) return [];

  try {
    const q = query(
      collection(db, HIGHSCORES_COLLECTION),
      orderBy('username'),
      startAt(searchText),
      endAt(searchText + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      username: doc.data().username,
      // We could return high score too if we want
      bestScore: doc.data().score,
    }));
  } catch (e) {
    console.error('Error searching users:', e);
    return [];
  }
};

/**
 * Send a friend request
 */
export const sendFriendRequest = async (fromUsername, toUsername) => {
  if (!fromUsername || !toUsername) return { error: 'Invalid usernames' };
  if (fromUsername === toUsername) return { error: 'Cannot add yourself' };

  const fromClean = sanitize(fromUsername);
  let toClean = sanitize(toUsername);

  try {
    // 0. Check if target user has migrated
    const targetRef = doc(db, USERS_COLLECTION, toClean);
    const targetDoc = await getDoc(targetRef);
    if (targetDoc.exists()) {
      const data = targetDoc.data();
      if (data.migratedTo) {
        // Redirect request to the new handle
        toClean = sanitize(data.migratedTo);
        // Note: We don't update toUsername variable, but we use toClean for paths
      }
    }
    // Check if already friends
    const friendshipRef = doc(db, USERS_COLLECTION, fromClean, 'friends', toClean);
    const friendshipSnap = await getDoc(friendshipRef);
    if (friendshipSnap.exists()) return { error: 'Already friends' };

    // Check if request already sent
    const requestRef = doc(db, USERS_COLLECTION, toClean, 'requests', fromClean);
    const requestSnap = await getDoc(requestRef);
    if (requestSnap.exists()) return { error: 'Request already sent' };

    // Create request
    await setDoc(requestRef, {
      from: fromUsername,
      timestamp: Timestamp.now(),
      status: 'pending',
    });

    return { success: true };
  } catch (e) {
    console.error('Error sending request:', e);
    return { error: e.message };
  }
};

/**
 * Get incoming friend requests
 */
export const getIncomingRequests = async username => {
  if (!username) return [];
  const clean = sanitize(username);

  try {
    const q = query(collection(db, USERS_COLLECTION, clean, 'requests'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (e) {
    console.error('Error getting requests:', e);
    return [];
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (username, fromUsername) => {
  const cleanUser = sanitize(username);
  const cleanFrom = sanitize(fromUsername);

  try {
    // 1. Add to my friends
    await setDoc(doc(db, USERS_COLLECTION, cleanUser, 'friends', cleanFrom), {
      username: fromUsername,
      since: Timestamp.now(),
    });

    // 2. Add me to their friends (Mutual)
    await setDoc(doc(db, USERS_COLLECTION, cleanFrom, 'friends', cleanUser), {
      username: username,
      since: Timestamp.now(),
    });

    // 3. Delete request
    await deleteDoc(doc(db, USERS_COLLECTION, cleanUser, 'requests', cleanFrom));

    return { success: true };
  } catch (e) {
    console.error('Error accepting request:', e);
    return { error: e.message };
  }
};

/**
 * Decline/Delete friend request
 */
export const declineFriendRequest = async (username, fromUsername) => {
  const cleanUser = sanitize(username);
  const cleanFrom = sanitize(fromUsername);
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, cleanUser, 'requests', cleanFrom));
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
};

/**
 * Get my friends list
 */
export const getFriends = async username => {
  if (!username) return [];
  const clean = sanitize(username);

  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION, clean, 'friends'));
    return snapshot.docs.map(doc => doc.data());
  } catch (e) {
    console.error('Error getting friends:', e);
    return [];
  }
};

/**
 * Get Friend Activity Feed
 */
export const getFriendFeed = async friendsList => {
  if (!friendsList || friendsList.length === 0) return [];

  // Firestore 'in' query supports up to 10 items.
  // If friends > 10, we need to batch or just fetch recent scores and filter client side?
  // Fetching ALL recent scores is expensive.
  // We'll limit to 10 friends for now or do multiple queries.
  // Optimized: Filter by username 'in' [array of usernames].

  const friendNames = friendsList.map(f => f.username);

  // Chunk into batches of 10
  const chunks = [];
  for (let i = 0; i < friendNames.length; i += 10) {
    chunks.push(friendNames.slice(i, i + 10));
  }

  const allScores = [];

  for (const chunk of chunks) {
    const q = query(
      collection(db, SCORES_COLLECTION),
      where('username', 'in', chunk),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    // Note: requires composite index. If fails, user needs to create index link.
    // simpler: order client side? No, 'in' query works with order by?
    // "OrderBy must match the field in the equality filter" -> NO.
    // "You can perform range (<, <=, >, >=) or inequality (!=) comparisons..."
    // 'IN' is equality.
    // However, if we order by timestamp, we need index: username ASC timestamp DESC.

    try {
      const snap = await getDocs(q);
      snap.forEach(doc => allScores.push({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Feed query failed (likely missing index):', e);
      // Fallback: fetch without ordering? Or just return empty.
    }
  }

  // Sort client side (merge chunks)
  allScores.sort((a, b) => b.timestamp - a.timestamp);
  return allScores.slice(0, 50);
};

/**
 * Get friendship status between two users (using subcollections)
 */
export const getFriendshipStatus = async (user1, user2) => {
  if (!user1 || !user2) return 'none';
  const clean1 = sanitize(user1);
  const clean2 = sanitize(user2);

  try {
    // Check if friends
    const friendRef = doc(db, USERS_COLLECTION, clean1, 'friends', clean2);
    const friendSnap = await getDoc(friendRef);
    if (friendSnap.exists()) return 'friends';

    // Check if I sent request
    const sentRef = doc(db, USERS_COLLECTION, clean2, 'requests', clean1);
    const sentSnap = await getDoc(sentRef);
    if (sentSnap.exists()) return 'pending';

    // Check if they sent request
    const receivedRef = doc(db, USERS_COLLECTION, clean1, 'requests', clean2);
    const receivedSnap = await getDoc(receivedRef);
    if (receivedSnap.exists()) return 'pending';

    return 'none';
  } catch (e) {
    console.error('Error checking friendship:', e);
    return 'none';
  }
};

/**
 * Block a user
 */
export const blockUser = async (blocker, blocked) => {
  if (!blocker || !blocked || blocker === blocked) return;

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
export const unblockUser = async (blocker, blocked) => {
  if (!blocker || !blocked) return;

  const blockId = `${sanitize(blocker)}_${sanitize(blocked)}`;
  const blockRef = doc(db, BLOCKS_COLLECTION, blockId);
  await deleteDoc(blockRef);
};

/**
 * Check if user1 has blocked user2
 */
export const getBlockStatus = async (user1, user2) => {
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
