import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
  updateDoc,
  limit,
  deleteDoc,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const FRIENDSHIPS_COLLECTION = 'friendships';
const REFERRALS_COLLECTION = 'referrals';

/**
 * Get or create user profile document in Firestore.
 * If user doesn't exist, creates a new profile with default values.
 *
 * @param {string} username - User's display name (used as document ID)
 * @param {string} uid - Firebase Auth UID
 * @param {object} additionalData - Additional profile data (realName, avatarId, email)
 * @returns {Promise<{username: string, joinedAt: Timestamp, friendCount: number, gamesPlayed: number, bestScore: number, referralCode: string}|null>}
 *          User profile object or null if username is invalid
 *
 * @example
 * const profile = await ensureUserProfile('JohnDoe', 'uid123', { email: 'john@example.com' });
 * // Returns existing profile or creates new one with defaults
 */
export const ensureUserProfile = async (usernameInput, uid = null, additionalData = {}) => {
  if (!usernameInput) return null;
  const username = usernameInput.toLowerCase();

  const userRef = doc(db, USERS_COLLECTION, username);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // Create new user profile
    const now = Timestamp.now();
    const profileData = {
      username,
      uid: uid, // Store Firebase Auth UID for permissions
      email: additionalData.email || null, // Store email for admin lookup
      realName: additionalData.realName || '',
      avatarId: additionalData.avatarId || Math.floor(Math.random() * 20) + 1,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
      friendCount: 0,
      gamesPlayed: 0,
      bestScore: 0,
      totalScore: 0, // Cumulative score (sum of first daily games)
      referralCode: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
      // Streak tracking
      streak: 0,
      maxStreak: 0,
      lastPlayDate: null, // YYYYMMDD format
      // Giuros currency system
      giuros: 10,
      purchasedCosmetics: [],
      equippedCosmetics: {},
      lastLoginDate: null,
      // User preferences
      language: additionalData.language || 'en',
      theme: 'auto', // 'dark' | 'light' | 'auto'
      notificationSettings: {
        dailyReminder: true,
        friendActivity: true,
        newsUpdates: true,
      },
    };
    await setDoc(userRef, profileData);
    return profileData;
  }

  const data = userDoc.data();
  // SELF-HEAL: If profile exists but missing UID or email, update if provided
  const updates = {};
  if (uid && data.uid !== uid) {
    updates.uid = uid;
  }
  if (additionalData.email && !data.email) {
    updates.email = additionalData.email;
  }
  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
    Object.assign(data, updates);
  }

  return { id: userDoc.id, ...data };
};

/**
 * Look up a user profile by email address.
 * Used during registration to prevent duplicate accounts.
 *
 * @param {string} email
 * @returns {Promise<{username: string, ...}|null>}
 */
export const getUserByEmail = async email => {
  if (!email) return null;
  try {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (e) {
    console.error('Error fetching user by email:', e);
    return null;
  }
};

// --- ADMIN & FEEDBACK FUNCTIONS ---

const FEEDBACK_COLLECTION = 'feedback';

/**
 * Submit user feedback
 */
export const submitFeedback = async (username, text) => {
  if (!username || !text) return;
  await addDoc(collection(db, FEEDBACK_COLLECTION), {
    username,
    text,
    status: 'pending', // pending, approved, rejected
    reward: null, // Set when approved
    createdAt: Timestamp.now(),
  });
};

/**
 * Get all feedback (Admin only)
 */
export const getFeedbackList = async () => {
  try {
    const q = query(collection(db, FEEDBACK_COLLECTION), limit(100)); // Simple limit for now
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('Error fetching feedback:', e);
    return [];
  }
};

/**
 * Approve feedback and award Giuros (Admin only)
 */
export const approveFeedback = async (feedbackId, giurosAmount = 50) => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    const feedbackDoc = await getDoc(feedbackRef);

    if (!feedbackDoc.exists()) {
      throw new Error('Feedback not found');
    }

    const feedbackData = feedbackDoc.data();
    const username = feedbackData.username;

    // Award Giuros using the giuros utility
    const { awardGiuros } = await import('./giuros');
    await awardGiuros(username, giurosAmount);

    // Update feedback status
    await updateDoc(feedbackRef, {
      status: 'approved',
      reward: giurosAmount,
      approvedAt: Timestamp.now(),
    });

    return { success: true, username, reward: giurosAmount };
  } catch (e) {
    console.error('Error approving feedback:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Reject feedback (Admin only)
 */
export const rejectFeedback = async feedbackId => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await updateDoc(feedbackRef, {
      status: 'rejected',
      rejectedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (e) {
    console.error('Error rejecting feedback:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Delete feedback (Admin only)
 */
export const deleteFeedback = async feedbackId => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(feedbackRef);
    return { success: true };
  } catch (e) {
    console.error('Error deleting feedback:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Check for unseen feedback rewards for a user
 */
export const checkUnseenFeedbackRewards = async username => {
  if (!username) return [];
  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      where('username', '==', username),
      where('status', '==', 'approved'),
      where('notified', '!=', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('Error checking feedback rewards:', e);
    return [];
  }
};

/**
 * Mark feedback reward as seen
 */
export const markFeedbackRewardSeen = async feedbackId => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await updateDoc(feedbackRef, { notified: true });
  } catch (e) {
    console.error('Error marking feedback reward seen:', e);
  }
};

/**
 * Get all users for admin table (Paginated or Limited)
 */
export const getAllUsers = async (limitCount = 50) => {
  try {
    const q = query(collection(db, USERS_COLLECTION), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('Error fetching all users:', e);
    return [];
  }
};

/**
 * Update user data as Admin (bypass usual checks, trust rules)
 */
export const updateUserAsAdmin = async (targetUsername, data) => {
  if (!targetUsername || !data) return;
  const userRef = doc(db, USERS_COLLECTION, targetUsername);
  await updateDoc(userRef, data);
};

// --- END ADMIN FUNCTIONS ---

/**
 * Delete a user and all their associated data (Highscores, History, Subcollections).
 * @param {string} username - The username to delete.
 */
export const deleteUserAndData = async username => {
  if (!username) return { success: false, error: 'No username provided' };

  try {
    const { deleteDoc, writeBatch } = await import('firebase/firestore');

    // Internal helper to strip @ for scores
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

    // 1. Delete User Profile
    await deleteDoc(doc(db, USERS_COLLECTION, username));

    // 2. Delete Highscore (Leaderboard Entry)
    // Highscores typically use the sanitized username as ID (e.g. replacing / with _)
    const sanitizedHighscoreId = cleanUsername.replace(/\//g, '_');
    await deleteDoc(doc(db, 'highscores', sanitizedHighscoreId));

    // 3. Delete Score History (Batch Delete)
    // Query scores where username matches. This might be large, so we batch it.
    const scoresRef = collection(db, 'scores');
    const q = query(scoresRef, where('username', '==', cleanUsername));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    let operationCount = 0;

    snapshot.docs.forEach(scoreDoc => {
      batch.delete(scoreDoc.ref);
      operationCount++;
    });

    if (operationCount > 0) {
      await batch.commit();
    }

    // 4. (Optional) We could delete subcollections like 'friends' but that requires recursive fetch.
    // For now, this covers the critical "leaderboard/score" requirement.

    return { success: true, count: operationCount };
  } catch (e) {
    console.error('Error deleting user:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Fetch user profile from Firestore by username.
 * Falls back to highscores collection if user profile doesn't exist.
 *
 * @param {string} username - User's display name
 * @returns {Promise<{username: string, gamesPlayed: number, bestScore: number, friendCount: number}|null>}
 *          User profile object or null if not found
 *
 * @example
 * const profile = await getUserProfile('JohnDoe');
 * // Returns: { username: 'JohnDoe', gamesPlayed: 15, bestScore: 1850, ... }
 */
export const getUserProfile = async username => {
  if (!username) return null;

  const userRef = doc(db, USERS_COLLECTION, username);
  const userDoc = await getDoc(userRef);
  const profileData = userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;

  // FAST PATH: If we have a healthy profile, return it
  if (profileData && profileData.gamesPlayed > 0) {
    return profileData;
  }

  // SLOW PATH / HEALING: Missing profile or zero stats. Check legacy collections.
  try {
    // 1. Check Highscore (Best Score)
    const highscoreRef = doc(db, 'highscores', username);
    const highscoreDoc = await getDoc(highscoreRef);
    let bestScore = 0;
    if (highscoreDoc.exists()) {
      bestScore = highscoreDoc.data().score || 0;
    }

    // 2. Count Total Games from 'scores' collection
    // Note: 'countFromServer' is efficient but requires backend support.
    // If not available in this client SDK version, we standard query.
    // Optimizing by selecting only one field.
    const q = query(collection(db, 'scores'), where('username', '==', username));
    const snapshot = await getDocs(q); // Iterate to count. Expensive but necessary for healing.
    const gamesPlayed = snapshot.size;

    // 3. Count Friends from subcollection (matches friends.js storage)
    const friendsSnapshot = await getDocs(collection(db, USERS_COLLECTION, username, 'friends'));
    const friendCount = friendsSnapshot.size;

    // 4. Determine "Player Since" (First Game Date)
    // If we have scores, find the earliest one
    let joinedAt = profileData?.joinedAt || Timestamp.now();
    if (!snapshot.empty) {
      let earliestGame = null;
      snapshot.forEach(doc => {
        const d = doc.data();
        let t = null;
        if (d.timestamp?.toDate) t = d.timestamp.toDate();
        else if (d.timestamp?.seconds) t = new Date(d.timestamp.seconds * 1000);
        else if (d.timestamp) t = new Date(d.timestamp); // Number or string

        if (t) {
          if (!earliestGame || t < earliestGame) {
            earliestGame = t;
          }
        }
      });

      // If earliest game is older than current joinedAt (or joinedAt is essentially "now" from defaults), update it
      const currentJoinedDate = joinedAt.toDate
        ? joinedAt.toDate()
        : new Date(joinedAt.seconds * 1000);

      // Heuristic: If earliest game is essentially older, or we have a default "now" joinedAt
      if (earliestGame && earliestGame < currentJoinedDate) {
        joinedAt = Timestamp.fromDate(earliestGame);
      }
    }

    // 5. Construct Corrected Data
    const correctedData = {
      username,
      gamesPlayed: Math.max(profileData?.gamesPlayed || 0, gamesPlayed),
      bestScore: Math.max(profileData?.bestScore || 0, bestScore),
      friendCount: Math.max(profileData?.friendCount || 0, friendCount),
      joinedAt: joinedAt,
      migratedTo: profileData?.migratedTo || null,
    };

    // 6. SELF-HEAL: Update Firestore if we found data
    const needsUpdate =
      correctedData.gamesPlayed !== (profileData?.gamesPlayed || 0) ||
      correctedData.bestScore !== (profileData?.bestScore || 0) ||
      correctedData.friendCount !== (profileData?.friendCount || 0) ||
      // Simple timestamp comparison (seconds)
      correctedData.joinedAt.seconds !== (profileData?.joinedAt?.seconds || 0);

    if (needsUpdate || correctedData.gamesPlayed > 0) {
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          gamesPlayed: correctedData.gamesPlayed,
          bestScore: correctedData.bestScore,
          friendCount: correctedData.friendCount,
          joinedAt: correctedData.joinedAt,
        });
        // eslint-disable-next-line no-console
        console.log(
          `[UserProfile] Healed stats for ${username}: Games=${correctedData.gamesPlayed}, Friends=${correctedData.friendCount}, Since=${correctedData.joinedAt.toDate()}`
        );
      } else {
        // If profile didn't exist at all, create it
        await setDoc(userRef, {
          ...correctedData,
          createdAt: Timestamp.now(),
        });
      }
    }

    return correctedData;
  } catch (e) {
    console.error('Error healing user profile:', e);
    // Return what we have as fallback
    return profileData || { username, gamesPlayed: 0, bestScore: 0, friendCount: 0 };
  }
};

/**
 * Update user statistics after completing a game.
 * Increments games played count and updates best score if improved.
 *
 * @param {string} username - User's display name
 * @param {number} score - Score achieved in the game
 * @returns {Promise<void>}
 *
 * @example
 * await updateUserStats('JohnDoe', 1900);
 * // Updates gamesPlayed and bestScore if 1900 > previous best
 */
export const updateUserStats = async (username, score) => {
  if (!username) return;

  const userRef = doc(db, USERS_COLLECTION, username);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    const newGamesPlayed = (data.gamesPlayed || 0) + 1;
    const newBestScore = Math.max(data.bestScore || 0, score);

    await updateDoc(userRef, {
      gamesPlayed: newGamesPlayed,
      bestScore: newBestScore,
    });
  } else {
    await ensureUserProfile(username);
    await updateDoc(userRef, {
      gamesPlayed: 1,
      bestScore: score,
    });
  }
};

/**
 * Send a friend request from one user to another.
 * Checks if friendship already exists before creating request.
 *
 * @param {string} fromUser - Username of requester
 * @param {string} toUser - Username of recipient
 * @returns {Promise<void>}
 *
 * @example
 * await sendFriendRequest('JohnDoe', 'JaneSmith');
 * // Creates pending friendship document in Firestore
 */
export const sendFriendRequest = async (fromUser, toUser) => {
  if (!fromUser || !toUser || fromUser === toUser) return;

  // Check if friendship already exists
  const existing = await getFriendshipStatus(fromUser, toUser);
  if (existing !== 'none') return;

  await addDoc(collection(db, FRIENDSHIPS_COLLECTION), {
    user1: fromUser,
    user2: toUser,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
};

/**
 * Accept friend request
 */
export const acceptFriendRequest = async requestId => {
  const requestRef = doc(db, FRIENDSHIPS_COLLECTION, requestId);
  await updateDoc(requestRef, { status: 'accepted' });

  // Update friend counts
  const requestDoc = await getDoc(requestRef);
  if (requestDoc.exists()) {
    const data = requestDoc.data();
    await incrementFriendCount(data.user1);
    await incrementFriendCount(data.user2);
  }
};

/**
 * Increment friend count
 */
const incrementFriendCount = async username => {
  const userRef = doc(db, USERS_COLLECTION, username);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const data = userDoc.data();
    await updateDoc(userRef, { friendCount: (data.friendCount || 0) + 1 });
  }
};

/**
 * Get friendship status between two users
 */
export const getFriendshipStatus = async (user1, user2) => {
  try {
    // Check both directions
    const q1 = query(
      collection(db, FRIENDSHIPS_COLLECTION),
      where('user1', '==', user1),
      where('user2', '==', user2)
    );
    const q2 = query(
      collection(db, FRIENDSHIPS_COLLECTION),
      where('user1', '==', user2),
      where('user2', '==', user1)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    let status = 'none';
    snap1.forEach(doc => {
      const data = doc.data();
      if (data.status === 'accepted') status = 'friends';
      else if (data.status === 'pending') status = 'pending';
    });
    snap2.forEach(doc => {
      const data = doc.data();
      if (data.status === 'accepted') status = 'friends';
      else if (data.status === 'pending') status = 'pending';
    });

    return status;
  } catch (e) {
    console.error('Error checking friendship:', e);
    return 'none';
  }
};

/**
 * Get friend count for a user
 */
export const getFriendCount = async username => {
  if (!username) return 0;

  try {
    // Count friends from subcollection (matches friends.js storage)
    const friendsSnapshot = await getDocs(collection(db, USERS_COLLECTION, username, 'friends'));
    return friendsSnapshot.size;
  } catch (e) {
    console.error('Error getting friend count:', e);
    return 0;
  }
};

/**
 * Record a referral when a new user signs up via referral link.
 * Creates a document in the referrals collection.
 *
 * @param {string} referrer - Username of the user who referred
 * @param {string} referred - Username of the new user
 * @returns {Promise<void>}
 *
 * @example
 * await recordReferral('JohnDoe', 'NewUser123');
 * // Saves referral record with timestamp
 */
export const recordReferral = async (referrer, referred) => {
  if (!referrer || !referred || referrer === referred) return;

  await addDoc(collection(db, REFERRALS_COLLECTION), {
    referrer,
    referred,
    createdAt: Timestamp.now(),
  });
};

/**
 * Get pending friend requests for a user
 */
export const getPendingFriendRequests = async username => {
  if (!username) return [];

  const q = query(
    collection(db, FRIENDSHIPS_COLLECTION),
    where('user2', '==', username),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  const requests = [];
  snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
  return requests;
};

const BLOCKS_COLLECTION = 'blocks';

/**
 * Block a user
 */
export const blockUser = async (blocker, blocked) => {
  if (!blocker || !blocked || blocker === blocked) return;

  const blockId = `${blocker}_${blocked}`;
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

  const blockId = `${blocker}_${blocked}`;
  const blockRef = doc(db, BLOCKS_COLLECTION, blockId);
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(blockRef);
};

/**
 * Check if user1 has blocked user2
 */
export const getBlockStatus = async (user1, user2) => {
  try {
    const blockId = `${user1}_${user2}`;
    const blockRef = doc(db, BLOCKS_COLLECTION, blockId);
    const blockDoc = await getDoc(blockRef);
    return blockDoc.exists();
  } catch (e) {
    console.error('Error checking block status:', e);
    return false;
  }
};

/**
 * Update user profile with avatar URL
 */
/**
 * Update user profile data
 */
export const updateUserProfile = async (username, data) => {
  if (!username || !data) return;

  const userRef = doc(db, USERS_COLLECTION, username);
  await updateDoc(userRef, data);
};

/**
 * Migrate a user from an old username/real name to a new handle.
 * Copies all profile data (gamesPlayed, bestScore, etc.) to the new document.
 *
 * @param {string} oldUsername - The old username (e.g. "Roberto")
 * @param {string} newHandle - The new handle (e.g. "Roberto#1234")
 * @returns {Promise<void>}
 */
export const migrateUser = async (oldUsername, newHandle) => {
  if (!oldUsername || !newHandle || oldUsername === newHandle) return;

  try {
    const oldRef = doc(db, USERS_COLLECTION, oldUsername);
    const oldDoc = await getDoc(oldRef);
    let profileData = {};

    if (oldDoc.exists()) {
      profileData = oldDoc.data();
      // Mark old profile as migrated
      await updateDoc(oldRef, { migratedTo: newHandle });
    }

    // 1. Migrate User Profile
    const newRef = doc(db, USERS_COLLECTION, newHandle);
    const newData = {
      ...profileData,
      username: newHandle,
      realName: profileData.realName || oldUsername,
      avatarId: profileData.avatarId || Math.floor(Math.random() * 20) + 1,
      // Preserve joinedAt strictly
      joinedAt: profileData.joinedAt || Timestamp.now(),
      migratedFrom: oldUsername,
      updatedAt: Timestamp.now(),
      id: newHandle,
    };
    await setDoc(newRef, newData);

    // 2. Migrate Highscore (Search Index)
    // This ensures 'searchUsers' finds the NEW handle and NOT the old name
    const oldHighscoreRef = doc(db, 'highscores', oldUsername);
    const oldHighscoreDoc = await getDoc(oldHighscoreRef);

    if (oldHighscoreDoc.exists()) {
      const hsData = oldHighscoreDoc.data();
      const newHighscoreRef = doc(db, 'highscores', newHandle);
      await setDoc(newHighscoreRef, {
        ...hsData,
        username: newHandle,
        migratedFrom: oldUsername,
      });
      // Delete old highscore to remove from search results
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(oldHighscoreRef);
    }

    // 3. Migrate Recent Scores (Best Effort)
    try {
      const scoresQ = query(
        collection(db, 'scores'),
        where('username', '==', oldUsername),
        limit(50)
      );
      const scoresSnap = await getDocs(scoresQ);
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);

      let batchCount = 0;
      scoresSnap.forEach(scoreDoc => {
        batch.update(scoreDoc.ref, { username: newHandle });
        batchCount++;
      });

      if (batchCount > 0) {
        await batch.commit();
        // eslint-disable-next-line no-console
        console.log(`[Migration] Migrated ${batchCount} recent scores.`);
      }
    } catch (e) {
      console.warn('[Migration] Failed to migrate scores (non-critical):', e);
    }

    // 4. Migrate Subcollections (Requests & Friends)
    const subcollections = ['requests', 'friends'];
    for (const sub of subcollections) {
      try {
        const subQ = query(collection(db, USERS_COLLECTION, oldUsername, sub));
        const subSnap = await getDocs(subQ);

        subSnap.forEach(async docMsg => {
          const data = docMsg.data();
          // Copy to new handle profile
          await setDoc(doc(db, USERS_COLLECTION, newHandle, sub, docMsg.id), data);
          // Delete from old profile
          await deleteDoc(docMsg.ref);
        });

        if (!subSnap.empty)
          // eslint-disable-next-line no-console
          console.log(`[Migration] Migrated ${subSnap.size} documents in '${sub}'`);
      } catch (e) {
        console.warn(`[Migration] Failed to migrate subcollection ${sub}:`, e);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[Migration] Successfully migrated ${oldUsername} to ${newHandle}`);
  } catch (error) {
    console.error('[Migration] Error migrating user:', error);
    throw error;
  }
};

/**
 * Self-healing/Repair function.
 * Ensures that if a user claims to be migratedFrom 'OldName',
 * that 'OldName' actually points to them, and 'OldName' is removed from highscores.
 */
export const healMigration = async handle => {
  if (!handle) return;
  try {
    const userRef = doc(db, USERS_COLLECTION, handle);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const data = userDoc.data();
    const oldName = data.migratedFrom;

    if (oldName && oldName !== handle) {
      // 1. Ensure Backward Link (Old -> New)
      const oldUserRef = doc(db, USERS_COLLECTION, oldName);
      const oldUserDoc = await getDoc(oldUserRef);

      // If old doc exists but doesn't point to us, fix it
      if (oldUserDoc.exists()) {
        const oldData = oldUserDoc.data();
        if (oldData.migratedTo !== handle) {
          await updateDoc(oldUserRef, { migratedTo: handle });
          // eslint-disable-next-line no-console
          console.log(`[Heal] Fixed migratedTo link for ${oldName}`);
        }
      } else {
        // If old doc is gone, we might want to recreate a tombstone?
        // For now, assume if it's gone, people naturally won't find it effectively
        // unless highscore exists.
      }

      // 2. Cleanup Old Highscore (Ghost Search Result)
      const oldHsRef = doc(db, 'highscores', oldName);
      const oldHsDoc = await getDoc(oldHsRef);
      if (oldHsDoc.exists()) {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(oldHsRef);
        // eslint-disable-next-line no-console
        console.log(`[Heal] Removed ghost highscore for ${oldName}`);
      }
    }
  } catch (e) {
    console.warn('[Heal] Migration repair failed:', e);
  }
};

/**
 * Check if the user has a successful referral TODAY.
 * Used to grant a "Retry" bonus for the daily challenge.
 */
export const hasDailyReferral = async username => {
  if (!username) return false;

  try {
    // Helper functionality usually relies on timestamp query
    // Let's use Timestamp.now() filtering

    // We need to import getTodaySeed or replicate logic.
    // Easier to just query by timestamp > start of day.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, REFERRALS_COLLECTION),
      where('referrer', '==', username),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay))
    );

    const snap = await getDocs(q);
    return !snap.empty;
  } catch (e) {
    console.error('Error checking daily referral:', e);
    return false;
  }
};

/**
 * Get the referrer of a user (who sent them the referral link)
 * Returns null if user was not referred or bonus already awarded
 * @param {string} username - The referred user's username
 * @returns {Promise<string|null>} - The referrer's username or null
 */
export const getReferrer = async username => {
  if (!username) return null;

  try {
    const q = query(
      collection(db, REFERRALS_COLLECTION),
      where('referred', '==', username),
      limit(1)
    );

    const snap = await getDocs(q);
    if (snap.empty) return null;

    const referralDoc = snap.docs[0];
    const data = referralDoc.data();

    // Check if bonus was already awarded
    if (data.bonusAwarded) return null;

    // Mark bonus as awarded
    await updateDoc(referralDoc.ref, { bonusAwarded: true });

    return data.referrer;
  } catch (e) {
    console.error('Error getting referrer:', e);
    return null;
  }
};
