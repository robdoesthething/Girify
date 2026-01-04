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
 * Returns an array of activity events with types:
 * - daily_score: First daily score from a friend
 * - badge_earned: Friend earned a new badge (future: requires activity tracking)
 * - username_changed: Friend changed their username
 */
export const getFriendFeed = async friendsList => {
  if (!friendsList || friendsList.length === 0) return [];

  const friendNames = friendsList.map(f => f.username);
  const allActivities = [];

  // 1. Fetch daily scores
  const chunks = [];
  for (let i = 0; i < friendNames.length; i += 10) {
    chunks.push(friendNames.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const q = query(
      collection(db, SCORES_COLLECTION),
      where('username', 'in', chunk),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    try {
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        const data = docSnap.data();
        allActivities.push({
          id: docSnap.id,
          type: 'daily_score',
          username: data.username,
          score: data.score,
          time: data.time,
          timestamp: data.timestamp,
        });
      });
    } catch (e) {
      console.warn('Feed query failed (likely missing index):', e);
    }
  }

  // 2. Check for username changes (migratedFrom field in user profiles)
  for (const chunk of chunks) {
    try {
      for (const username of chunk) {
        const userRef = doc(db, USERS_COLLECTION, username);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.migratedFrom && data.updatedAt) {
            allActivities.push({
              id: `namechange_${username}`,
              type: 'username_changed',
              username: username,
              oldUsername: data.migratedFrom,
              timestamp: data.updatedAt,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error checking username changes:', e);
    }
  }

  // Sort all activities by timestamp
  allActivities.sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeB - timeA;
  });

  // Filter: Only keep the FIRST score per user per day for score activities
  const uniqueActivities = [];
  const seenUserDays = new Set();
  const seenNameChanges = new Set();

  for (const activity of allActivities) {
    if (activity.type === 'daily_score') {
      if (!activity.timestamp) continue;
      const date = new Date(activity.timestamp.seconds * 1000).toDateString();
      const key = `${activity.username}_${date}`;
      if (!seenUserDays.has(key)) {
        seenUserDays.add(key);
        uniqueActivities.push(activity);
      }
    } else if (activity.type === 'username_changed') {
      // Only show each name change once
      if (!seenNameChanges.has(activity.username)) {
        seenNameChanges.add(activity.username);
        uniqueActivities.push(activity);
      }
    } else {
      // Other activity types (badge_earned, etc.) - add directly
      uniqueActivities.push(activity);
    }
  }

  return uniqueActivities.slice(0, 50);
};

/**
 * Remove a friend
 */
export const removeFriend = async (user1, user2) => {
  if (!user1 || !user2) return { error: 'Invalid users' };
  const clean1 = sanitize(user1);
  const clean2 = sanitize(user2);

  try {
    await deleteDoc(doc(db, USERS_COLLECTION, clean1, 'friends', clean2));
    await deleteDoc(doc(db, USERS_COLLECTION, clean2, 'friends', clean1));
    return { success: true };
  } catch (e) {
    console.error('Error removing friend:', e);
    return { error: e.message };
  }
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
