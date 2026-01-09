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

// Helper to match leaderboard sanitization and ensure consistent IDs (lowercase)
const sanitize = name => name.toLowerCase().replace(/\//g, '_');

/**
 * Search for users by username prefix (using highscores as user index)
 */
export const searchUsers = async searchText => {
  if (!searchText || searchText.length < 2) return [];

  // Remove @ prefix if user typed it
  // Remove @ prefix and normalize to lowercase
  const searchLower = searchText.toLowerCase();
  const cleanSearch = searchLower.startsWith('@') ? searchLower.slice(1) : searchLower;
  const legacySearch = '@' + cleanSearch;

  try {
    // Query 1: Clean usernames (New/Migrated format)
    const q1 = query(
      collection(db, HIGHSCORES_COLLECTION),
      orderBy('username'),
      startAt(cleanSearch),
      endAt(cleanSearch + '\uf8ff'),
      limit(5)
    );

    // Query 2: Legacy usernames (With @ prefix)
    const q2 = query(
      collection(db, HIGHSCORES_COLLECTION),
      orderBy('username'),
      startAt(legacySearch),
      endAt(legacySearch + '\uf8ff'),
      limit(5)
    );

    // Run parallel queries
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    // Merge and deduplicate results
    const results = new Map();

    const processDoc = doc => {
      const data = doc.data();
      const rawUser = data.username;
      // Normalize to key for deduplication
      const key = rawUser.replace(/^@/, '').toLowerCase();

      if (!results.has(key)) {
        // For display: New handles (with #) don't need @. Legacy ones might.
        // If rawUser has #, leave it. If it starts with @, leave it. Else add @.
        const isHandle = rawUser.includes('#');
        const displayUser = isHandle || rawUser.startsWith('@') ? rawUser : '@' + rawUser;

        results.set(key, {
          username: displayUser,
          bestScore: data.score,
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
export const sendFriendRequest = async (fromUsername, toUsername) => {
  if (!fromUsername || !toUsername) return { error: 'Invalid usernames' };

  // SANITIZE BOTH INPUTS STRICTLY
  const fromClean = sanitize(fromUsername);
  let toClean = sanitize(toUsername);

  // STRICT SELF CHECK (after sanitization)
  if (fromClean === toClean) return { error: 'Cannot add yourself' };

  try {
    // 0. Check if target user has migrated
    const targetRef = doc(db, USERS_COLLECTION, toClean);
    const targetDoc = await getDoc(targetRef);
    if (targetDoc.exists()) {
      const data = targetDoc.data();
      if (data.migratedTo) {
        // Redirect request to the new handle
        toClean = sanitize(data.migratedTo);
        // Re-check self after migration redirect
        if (fromClean === toClean) return { error: 'Cannot add yourself' };
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
    const friends = [];

    // Get today's date seed
    const today = new Date();
    const todaySeed = parseInt(
      `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    );

    // For each friend, fetch their profile data
    for (const friendDoc of snapshot.docs) {
      const friendData = friendDoc.data();
      const friendUsername = friendData.username;
      const cleanFriendUsername = friendUsername.startsWith('@')
        ? friendUsername.slice(1)
        : friendUsername;

      try {
        // Fetch user profile for badges
        const userRef = doc(db, USERS_COLLECTION, sanitize(cleanFriendUsername));
        const userSnap = await getDoc(userRef);

        let badges = [];
        let todayGames = 0;

        if (userSnap.exists()) {
          const profileData = userSnap.data();
          badges = profileData.equippedBadges || [];
        }

        // Get today's game count
        const scoresQuery = query(
          collection(db, SCORES_COLLECTION),
          where('username', '==', cleanFriendUsername),
          where('date', '==', todaySeed)
        );

        const scoresSnap = await getDocs(scoresQuery);
        todayGames = scoresSnap.size;

        friends.push({
          ...friendData,
          badges,
          todayGames,
        });
      } catch (profileError) {
        console.warn(`Could not fetch profile for ${friendUsername}:`, profileError);
        friends.push(friendData);
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
 * Returns an array of activity events with types:
 * - daily_score: First daily score from a friend
 * - badge_earned: Friend earned a new badge (future: requires activity tracking)
 * - username_changed: Friend changed their username
 */
export const getFriendFeed = async friendsList => {
  if (!friendsList || friendsList.length === 0) return [];

  // Ensure all friend usernames are without @ prefix for scores query
  // (usernames are stored WITHOUT @ in Firebase)
  const friendNames = friendsList.map(f => {
    const username = f.username;
    return username.startsWith('@') ? username.slice(1) : username;
  });
  const allActivities = [];

  // 1. Fetch GLOBAL recent scores (Last 100) and filter client-side
  // This avoids massive index requirements and handles case-sensitivity robustly
  // (We check if score.username.toLowerCase() is in our friend list)
  const friendSet = new Set(friendNames.map(n => n.toLowerCase()));

  try {
    const q = query(collection(db, SCORES_COLLECTION), orderBy('timestamp', 'desc'), limit(100));

    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const rawUser = data.username || '';
      const lowerUser = rawUser.toLowerCase();

      // Check for match (handling potential @ prefix in data if any, though usually stripped)
      const cleanLower = lowerUser.startsWith('@') ? lowerUser.slice(1) : lowerUser;

      if (friendSet.has(cleanLower)) {
        allActivities.push({
          id: docSnap.id,
          type: 'daily_score',
          username: data.username, // Keep original display casing
          score: data.score,
          time: data.time,
          timestamp: data.timestamp,
        });
      }
    });
  } catch (e) {
    console.error('Feed query failed:', e);
  }

  // 2. Check for username changes (migratedFrom field in user profiles)
  // Re-create chunks for this batch operation
  const chunks = [];
  for (let i = 0; i < friendNames.length; i += 10) {
    chunks.push(friendNames.slice(i, i + 10));
  }

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
