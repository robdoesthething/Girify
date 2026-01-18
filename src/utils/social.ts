import {
  DocumentData,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { SOCIAL } from '../config/constants';
import { DISTRICTS } from '../data/districts';
import { db } from '../firebase';

const USERS_COLLECTION = 'users';
const FRIENDSHIPS_COLLECTION = 'friendships';
const REFERRALS_COLLECTION = 'referrals';
const FEEDBACK_COLLECTION = 'feedback';
const BLOCKS_COLLECTION = 'blocks';
const GAMES_SUBCOLLECTION = 'games';
const DEFAULT_AVATAR_COUNT = 20;
const DEFAULT_GIUROS = 10;
const MS_PER_SECOND = 1000;
const SCORES_LIMIT = 50;
const HISTORY_LIMIT = 100;

export interface NotificationSettings {
  dailyReminder: boolean;
  friendActivity: boolean;
  newsUpdates: boolean;
}

export interface UserProfile {
  id?: string;
  username: string;
  uid?: string | null;
  email?: string | null;
  realName?: string;
  avatarId?: number;
  joinedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  friendCount?: number;
  banned?: boolean;
  gamesPlayed?: number;
  bestScore?: number;
  totalScore?: number;
  referralCode?: string;
  streak?: number;
  maxStreak?: number;
  lastPlayDate?: string | null;
  giuros?: number;
  purchasedCosmetics?: string[];
  equippedCosmetics?: Record<string, string>;
  equippedBadges?: string[];
  lastLoginDate?: string | null;
  language?: string;
  theme?: 'dark' | 'light' | 'auto';
  notificationSettings?: NotificationSettings;
  migratedTo?: string | null;
  migratedFrom?: string | null;
  referredBy?: string | null;
  district?: string;
  team?: string;
}

export interface FeedbackItem {
  id: string;
  username: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  reward?: number | null;
  createdAt?: Timestamp;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  notified?: boolean;
}

export interface GameData {
  score: number;
  date?: number;
  timestamp?: Timestamp | { seconds: number };
  time?: number;
  [key: string]: unknown;
}

interface OperationResult {
  success: boolean;
  error?: string;
  username?: string;
  reward?: number;
  count?: number;
}

interface AdditionalProfileData {
  email?: string;
  realName?: string;
  avatarId?: number;
  language?: string;
  district?: string;
}

interface GameStatsUpdate {
  streak: number;
  totalScore: number;
  lastPlayDate: string;
  currentScore?: number;
}

/**
 * Get or create user profile document in Firestore.
 */
export const ensureUserProfile = async (
  usernameInput: string,
  uid: string | null = null,
  additionalData: AdditionalProfileData = {}
): Promise<UserProfile | null> => {
  if (!usernameInput) {
    return null;
  }
  const username = usernameInput.toLowerCase();

  const userRef = doc(db, USERS_COLLECTION, username);
  const userDoc = await getDoc(userRef);

  if (additionalData.email && !userDoc.exists()) {
    const existingUser = await getUserByEmail(additionalData.email);
    if (existingUser) {
      console.warn(
        `[Auth] Found existing user by email ${additionalData.email}: ${existingUser.username}`
      );
      return existingUser;
    }
  }

  if (!userDoc.exists()) {
    const now = Timestamp.now();
    const profileData: UserProfile = {
      username,
      uid: uid,
      email: additionalData.email ? additionalData.email.toLowerCase().trim() : null,
      realName: additionalData.realName || '',
      avatarId: additionalData.avatarId || Math.floor(Math.random() * DEFAULT_AVATAR_COUNT) + 1,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
      friendCount: 0,
      gamesPlayed: 0,
      bestScore: 0,
      totalScore: 0,
      referralCode: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
      streak: 0,
      maxStreak: 0,
      lastPlayDate: null,
      giuros: DEFAULT_GIUROS,
      purchasedCosmetics: [],
      equippedCosmetics: {},
      lastLoginDate: null,
      language: additionalData.language || 'en',
      theme: 'auto',
      notificationSettings: {
        dailyReminder: true,
        friendActivity: true,
        newsUpdates: true,
      },
      migratedTo: null,
      migratedFrom: null,
      referredBy: null,
      district: additionalData.district,
      team: additionalData.district
        ? DISTRICTS.find(d => d.id === additionalData.district)?.teamName
        : undefined,
    };
    await setDoc(userRef, profileData);
    return profileData;
  }

  const data = userDoc.data() as DocumentData;
  const updates: Record<string, unknown> = {};
  const now = Timestamp.now();

  if (uid && data.uid !== uid) {
    updates.uid = uid;
  }
  if (additionalData.email && !data.email) {
    updates.email = additionalData.email.toLowerCase().trim();
  }
  if (!data.createdAt && data.joinedAt) {
    updates.createdAt = data.joinedAt;
  }
  if (!data.updatedAt) {
    updates.updatedAt = now;
  }
  if (data.streak === undefined) {
    updates.streak = 0;
  }
  if (data.maxStreak === undefined) {
    updates.maxStreak = 0;
  }
  if (data.lastPlayDate === undefined) {
    updates.lastPlayDate = null;
  }
  if (data.totalScore === undefined) {
    updates.totalScore = 0;
  }
  if (data.language === undefined) {
    updates.language = additionalData.language || 'en';
  }
  if (data.theme === undefined) {
    updates.theme = 'auto';
  }
  if (data.notificationSettings === undefined) {
    updates.notificationSettings = {
      dailyReminder: true,
      friendActivity: true,
      newsUpdates: true,
    };
  }
  if (data.gamesPlayed === undefined) {
    updates.gamesPlayed = 0;
  }
  if (data.bestScore === undefined) {
    updates.bestScore = 0;
  }
  // Update district if provided and different from current
  if (additionalData.district && data.district !== additionalData.district) {
    updates.district = additionalData.district;
    updates.team = DISTRICTS.find(d => d.id === additionalData.district)?.teamName;
  }
  // Backfill team if missing and district exists
  if (!data.team && data.district && !updates.team) {
    updates.team = DISTRICTS.find(d => d.id === data.district)?.teamName;
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
    Object.assign(data, updates);
  }

  return { id: userDoc.id, ...data } as UserProfile;
};

/**
 * Look up a user profile by email address
 */
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) {
    return null;
  }
  const cleanEmail = email.toLowerCase().trim();
  try {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', cleanEmail), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (e) {
    console.error('Error fetching user by email:', e);
    return null;
  }
};

/**
 * Look up a user profile by UID
 */
export const getUserByUid = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) {
    return null;
  }
  try {
    const q = query(collection(db, USERS_COLLECTION), where('uid', '==', uid), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (e) {
    console.error('Error fetching user by uid:', e);
    return null;
  }
};

/**
 * Update user stats after a game
 */
export const updateUserGameStats = async (
  username: string,
  { streak, totalScore, lastPlayDate, currentScore }: GameStatsUpdate
): Promise<void> => {
  if (!username) {
    return;
  }
  const lowername = username.toLowerCase();
  const userRef = doc(db, USERS_COLLECTION, lowername);

  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return;
    }

    const currentData = userDoc.data() as DocumentData;
    const updates: Record<string, unknown> = {
      gamesPlayed: ((currentData.gamesPlayed as number) || 0) + 1,
      totalScore: totalScore,
      streak: Math.min(streak, ((currentData.gamesPlayed as number) || 0) + 1),
      lastPlayDate: lastPlayDate,
      updatedAt: Timestamp.now(),
    };

    if (streak > ((currentData.maxStreak as number) || 0)) {
      updates.maxStreak = streak;
    }

    if (currentScore !== undefined) {
      const currentBest = (currentData.bestScore as number) || 0;
      if (currentScore > currentBest) {
        updates.bestScore = currentScore;
      }
    }

    await updateDoc(userRef, updates);

    // Update district score if user has one
    if (currentData.district) {
      await updateDistrictScore(currentData.district, currentScore || 0);
    }
  } catch (e) {
    console.error('Error updating game stats:', e);
  }
};

/**
 * Submit user feedback
 */
export const submitFeedback = async (username: string, text: string): Promise<void> => {
  if (!username || !text) {
    return;
  }
  await addDoc(collection(db, FEEDBACK_COLLECTION), {
    username,
    text,
    status: 'pending',
    reward: null,
    createdAt: Timestamp.now(),
  });
};

/**
 * Get all feedback (Admin only)
 */
export const getFeedbackList = async (): Promise<FeedbackItem[]> => {
  try {
    const q = query(collection(db, FEEDBACK_COLLECTION), limit(HISTORY_LIMIT));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as FeedbackItem[];
  } catch (e) {
    console.error('Error fetching feedback:', e);
    return [];
  }
};

/**
 * Approve feedback and award Giuros (Admin only)
 */
export const approveFeedback = async (
  feedbackId: string,
  giurosAmount = 50
): Promise<OperationResult> => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    const feedbackDoc = await getDoc(feedbackRef);

    if (!feedbackDoc.exists()) {
      throw new Error('Feedback not found');
    }

    const feedbackData = feedbackDoc.data() as DocumentData;
    const username = feedbackData.username as string;

    const { awardGiuros } = await import('./giuros');
    await awardGiuros(username, giurosAmount);

    await updateDoc(feedbackRef, {
      status: 'approved',
      reward: giurosAmount,
      approvedAt: Timestamp.now(),
    });

    return { success: true, username, reward: giurosAmount };
  } catch (e) {
    console.error('Error approving feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Reject feedback (Admin only)
 */
export const rejectFeedback = async (feedbackId: string): Promise<OperationResult> => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await updateDoc(feedbackRef, {
      status: 'rejected',
      rejectedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (e) {
    console.error('Error rejecting feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Delete feedback (Admin only)
 */
export const deleteFeedback = async (feedbackId: string): Promise<OperationResult> => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await deleteDoc(feedbackRef);
    return { success: true };
  } catch (e) {
    console.error('Error deleting feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Check for unseen feedback rewards for a user
 */
export const checkUnseenFeedbackRewards = async (username: string): Promise<FeedbackItem[]> => {
  if (!username) {
    return [];
  }
  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      where('username', '==', username),
      where('status', '==', 'approved'),
      where('notified', '!=', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as FeedbackItem[];
  } catch (e) {
    console.error('Error checking feedback rewards:', e);
    return [];
  }
};

/**
 * Mark feedback reward as seen
 */
export const markFeedbackRewardSeen = async (feedbackId: string): Promise<void> => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await updateDoc(feedbackRef, { notified: true });
  } catch (e) {
    console.error('Error marking feedback reward seen:', e);
  }
};

/**
 * Get all users for admin table
 */
export const getAllUsers = async (limitCount = 50): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, USERS_COLLECTION), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as UserProfile[];
  } catch (e) {
    console.error('Error fetching all users:', e);
    return [];
  }
};

/**
 * Update user data as Admin
 * @throws Error if not authenticated or not an admin
 */
export const updateUserAsAdmin = async (
  targetUsername: string,
  data: Partial<UserProfile>
): Promise<void> => {
  if (!targetUsername || !data) {
    return;
  }

  // Security: Verify admin before write
  const { requireAdmin } = await import('./auth');
  await requireAdmin();

  const userRef = doc(db, USERS_COLLECTION, targetUsername);
  await updateDoc(userRef, data as DocumentData);
};

/**
 * Delete a user and all their associated data
 */
export const deleteUserAndData = async (username: string): Promise<OperationResult> => {
  if (!username) {
    return { success: false, error: 'No username provided' };
  }

  try {
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

    await deleteDoc(doc(db, USERS_COLLECTION, username));

    const sanitizedHighscoreId = cleanUsername.replace(/\//g, '_');
    await deleteDoc(doc(db, 'highscores', sanitizedHighscoreId));

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

    return { success: true, count: operationCount };
  } catch (e) {
    console.error('Error deleting user:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Fetch user profile from Firestore by username
 */
export const getUserProfile = async (username: string): Promise<UserProfile | null> => {
  if (!username) {
    return null;
  }

  const userRef = doc(db, USERS_COLLECTION, username);
  const userDoc = await getDoc(userRef);
  const profileData = userDoc.exists()
    ? ({ id: userDoc.id, ...userDoc.data() } as UserProfile)
    : null;

  if (profileData && (profileData.gamesPlayed || 0) > 0) {
    return profileData;
  }

  try {
    const highscoreRef = doc(db, 'highscores', username);
    const highscoreDoc = await getDoc(highscoreRef);
    let bestScore = 0;
    if (highscoreDoc.exists()) {
      bestScore = (highscoreDoc.data().score as number) || 0;
    }

    const q = query(collection(db, 'scores'), where('username', '==', username));
    const snapshot = await getDocs(q);
    const gamesPlayed = snapshot.size;

    const friendsSnapshot = await getDocs(collection(db, USERS_COLLECTION, username, 'friends'));
    const friendCount = friendsSnapshot.size;

    let joinedAt = profileData?.joinedAt || Timestamp.now();

    if (!snapshot.empty) {
      // Use reduce pattern instead of forEach to help TypeScript track the type
      const earliestGame = snapshot.docs.reduce<Date | null>((earliest, docSnap) => {
        const d = docSnap.data() as DocumentData;
        let t: Date | null = null;
        if (typeof d.timestamp?.toDate === 'function') {
          t = d.timestamp.toDate();
        } else if (d.timestamp?.seconds) {
          t = new Date((d.timestamp.seconds as number) * MS_PER_SECOND);
        } else if (d.timestamp) {
          t = new Date(d.timestamp as string | number);
        }

        if (t && (!earliest || t < earliest)) {
          return t;
        }
        return earliest;
      }, null);

      const currentJoinedDate =
        typeof (joinedAt as Timestamp).toDate === 'function'
          ? (joinedAt as Timestamp).toDate()
          : new Date(((joinedAt as { seconds: number }).seconds || 0) * MS_PER_SECOND);

      if (earliestGame && earliestGame < currentJoinedDate) {
        joinedAt = Timestamp.fromDate(earliestGame);
      }
    }

    const correctedData: Partial<UserProfile> = {
      username,
      gamesPlayed: Math.max(profileData?.gamesPlayed || 0, gamesPlayed),
      bestScore: Math.max(profileData?.bestScore || 0, bestScore),
      friendCount: Math.max(profileData?.friendCount || 0, friendCount),
      joinedAt: joinedAt as Timestamp,
      migratedTo: profileData?.migratedTo || null,
    };

    const needsUpdate =
      correctedData.gamesPlayed !== (profileData?.gamesPlayed || 0) ||
      correctedData.bestScore !== (profileData?.bestScore || 0) ||
      correctedData.friendCount !== (profileData?.friendCount || 0);

    if (needsUpdate || (correctedData.gamesPlayed || 0) > 0) {
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          gamesPlayed: correctedData.gamesPlayed,
          bestScore: correctedData.bestScore,
          friendCount: correctedData.friendCount,
          joinedAt: correctedData.joinedAt,
        });
        console.warn(`[UserProfile] Healed stats for ${username}`);
      } else {
        await setDoc(userRef, {
          ...correctedData,
          createdAt: Timestamp.now(),
        });
      }
    }

    return correctedData as UserProfile;
  } catch (e) {
    console.error('Error healing user profile:', e);
    return profileData || { username, gamesPlayed: 0, bestScore: 0, friendCount: 0 };
  }
};

/**
 * Update user statistics after completing a game
 */
export const updateUserStats = async (username: string, score: number): Promise<void> => {
  if (!username) {
    return;
  }

  const userRef = doc(db, USERS_COLLECTION, username);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data() as DocumentData;
    const newGamesPlayed = ((data.gamesPlayed as number) || 0) + 1;
    const currentBest = Number(data.bestScore) || 0;
    const currentScore = Number(score) || 0;
    const newBestScore = Math.max(currentBest, currentScore);

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
 * Record a referral when a new user signs up
 */
export const recordReferral = async (referrer: string, referred: string): Promise<void> => {
  if (!referrer || !referred || referrer === referred) {
    return;
  }

  let referrerEmail: string | null = null;
  let referredEmail: string | null = null;
  try {
    const [r1Doc, r2Doc] = await Promise.all([
      getDoc(doc(db, USERS_COLLECTION, referrer)),
      getDoc(doc(db, USERS_COLLECTION, referred)),
    ]);
    if (r1Doc.exists()) {
      referrerEmail = (r1Doc.data().email as string) || null;
    }
    if (r2Doc.exists()) {
      referredEmail = (r2Doc.data().email as string) || null;
    }
  } catch (e) {
    console.error('Error fetching emails for referral:', e);
  }

  const batch = writeBatch(db);
  const referralRef = doc(collection(db, REFERRALS_COLLECTION));
  batch.set(referralRef, {
    referrer,
    referred,
    referrerEmail,
    referredEmail,
    createdAt: Timestamp.now(),
  });

  const referrerStatsRef = doc(db, USERS_COLLECTION, referrer, 'badgeStats', 'current');
  batch.set(referrerStatsRef, { inviteCount: increment(1) }, { merge: true });

  const referredUserRef = doc(db, USERS_COLLECTION, referred);
  batch.update(referredUserRef, { referredBy: referrer });

  await batch.commit();
};

/**
 * Get pending friend requests for a user
 */
export const getPendingFriendRequests = async (
  username: string
): Promise<Array<{ id: string; [key: string]: unknown }>> => {
  if (!username) {
    return [];
  }

  const q = query(
    collection(db, FRIENDSHIPS_COLLECTION),
    where('user2', '==', username),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  const requests: Array<{ id: string; [key: string]: unknown }> = [];
  snapshot.forEach(docSnap => requests.push({ id: docSnap.id, ...docSnap.data() }));
  return requests;
};

/**
 * Block a user
 */
export const blockUser = async (blocker: string, blocked: string): Promise<void> => {
  if (!blocker || !blocked || blocker === blocked) {
    return;
  }

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
export const unblockUser = async (blocker: string, blocked: string): Promise<void> => {
  if (!blocker || !blocked) {
    return;
  }

  const blockId = `${blocker}_${blocked}`;
  const blockRef = doc(db, BLOCKS_COLLECTION, blockId);
  await deleteDoc(blockRef);
};

/**
 * Check if user1 has blocked user2
 */
export const getBlockStatus = async (user1: string, user2: string): Promise<boolean> => {
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
 * Update user profile data
 */
export const updateUserProfile = async (
  username: string,
  data: Partial<UserProfile>
): Promise<void> => {
  if (!username || !data) {
    return;
  }

  const userRef = doc(db, USERS_COLLECTION, username);
  await updateDoc(userRef, data as DocumentData);
};

/**
 * Migrate a user from an old username to a new handle
 */
export const migrateUser = async (oldUsername: string, newHandle: string): Promise<void> => {
  if (!oldUsername || !newHandle || oldUsername === newHandle) {
    return;
  }

  try {
    const oldRef = doc(db, USERS_COLLECTION, oldUsername);
    const oldDoc = await getDoc(oldRef);
    let profileData: DocumentData = {};

    if (oldDoc.exists()) {
      profileData = oldDoc.data();
      await updateDoc(oldRef, { migratedTo: newHandle });
    }

    const newRef = doc(db, USERS_COLLECTION, newHandle);
    const newData = {
      ...profileData,
      username: newHandle,
      realName: (profileData.realName as string) || oldUsername,
      avatarId:
        (profileData.avatarId as number) || Math.floor(Math.random() * DEFAULT_AVATAR_COUNT) + 1,
      purchasedCosmetics: (profileData.purchasedCosmetics as string[]) || [],
      equippedCosmetics: (profileData.equippedCosmetics as Record<string, string>) || {},
      giuros: (profileData.giuros as number) ?? DEFAULT_GIUROS,
      streak: (profileData.streak as number) || 0,
      maxStreak: (profileData.maxStreak as number) || 0,
      totalScore: (profileData.totalScore as number) || 0,
      lastPlayDate: (profileData.lastPlayDate as string) || null,
      notificationSettings: (profileData.notificationSettings as NotificationSettings) || {
        dailyReminder: true,
        friendActivity: true,
        newsUpdates: true,
      },
      theme: (profileData.theme as string) || 'auto',
      language: (profileData.language as string) || 'en',
      joinedAt: (profileData.joinedAt as Timestamp) || Timestamp.now(),
      migratedFrom: oldUsername,
      updatedAt: Timestamp.now(),
      id: newHandle,
    };
    await setDoc(newRef, newData);

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
      await deleteDoc(oldHighscoreRef);
    }

    try {
      const scoresQ = query(
        collection(db, 'scores'),
        where('username', '==', oldUsername),
        limit(SCORES_LIMIT)
      );
      const scoresSnap = await getDocs(scoresQ);
      const batch = writeBatch(db);

      let batchCount = 0;
      scoresSnap.forEach(scoreDoc => {
        batch.update(scoreDoc.ref, { username: newHandle });
        batchCount++;
      });

      if (batchCount > 0) {
        await batch.commit();
        console.warn(`[Migration] Migrated ${batchCount} recent scores.`);
      }
    } catch (e) {
      console.warn('[Migration] Failed to migrate scores (non-critical):', e);
    }

    const subcollections = ['requests', 'friends', 'games'];
    for (const sub of subcollections) {
      try {
        const subQ = query(collection(db, USERS_COLLECTION, oldUsername, sub));
        const subSnap = await getDocs(subQ);

        for (const docMsg of subSnap.docs) {
          const data = docMsg.data();
          await setDoc(doc(db, USERS_COLLECTION, newHandle, sub, docMsg.id), data);
          await deleteDoc(docMsg.ref);
        }

        if (!subSnap.empty) {
          console.warn(`[Migration] Migrated ${subSnap.size} documents in '${sub}'`);
        }
      } catch (e) {
        console.warn(`[Migration] Failed to migrate subcollection ${sub}:`, e);
      }
    }

    console.warn(`[Migration] Successfully migrated ${oldUsername} to ${newHandle}`);
  } catch (error) {
    console.error('[Migration] Error migrating user:', error);
    throw error;
  }
};

/**
 * Self-healing/Repair function for migrations
 */
export const healMigration = async (handle: string): Promise<void> => {
  if (!handle) {
    return;
  }
  try {
    const userRef = doc(db, USERS_COLLECTION, handle);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return;
    }

    const data = userDoc.data() as DocumentData;
    const oldName = data.migratedFrom as string | undefined;

    if (oldName && oldName !== handle) {
      const oldUserRef = doc(db, USERS_COLLECTION, oldName);
      const oldUserDoc = await getDoc(oldUserRef);

      if (oldUserDoc.exists()) {
        const oldData = oldUserDoc.data() as DocumentData;
        if (oldData.migratedTo !== handle) {
          await updateDoc(oldUserRef, { migratedTo: handle });
          console.warn(`[Heal] Fixed migratedTo link for ${oldName}`);
        }
      }

      const oldHsRef = doc(db, 'highscores', oldName);
      const oldHsDoc = await getDoc(oldHsRef);
      if (oldHsDoc.exists()) {
        await deleteDoc(oldHsRef);
        console.warn(`[Heal] Removed ghost highscore for ${oldName}`);
      }
    }
  } catch (e) {
    console.warn('[Heal] Migration repair failed:', e);
  }
};

/**
 * Check if the user has a successful referral TODAY
 */
export const hasDailyReferral = async (username: string): Promise<boolean> => {
  if (!username) {
    return false;
  }

  try {
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
 * Get the referrer of a user
 */
export const getReferrer = async (username: string): Promise<string | null> => {
  if (!username) {
    return null;
  }

  try {
    const q = query(
      collection(db, REFERRALS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(SOCIAL.NEWS.MAX_ITEMS)
    );

    const snap = await getDocs(q);
    if (snap.empty) {
      return null;
    }

    const referralDoc = snap.docs[0];
    const data = referralDoc.data() as DocumentData;

    if (data.bonusAwarded) {
      return null;
    }

    await updateDoc(referralDoc.ref, { bonusAwarded: true });

    return data.referrer as string;
  } catch (e) {
    console.error('Error getting referrer:', e);
    return null;
  }
};

/**
 * Save game result to user's personal history subcollection
 */
export const saveUserGameResult = async (username: string, gameData: GameData): Promise<void> => {
  if (!username) {
    return;
  }
  try {
    const gamesRef = collection(db, USERS_COLLECTION, username.toLowerCase(), GAMES_SUBCOLLECTION);
    await addDoc(gamesRef, {
      ...gameData,
      savedAt: Timestamp.now(),
    });
  } catch (e) {
    console.error('Error saving user game result:', e);
  }
};

/**
 * Get user's game history
 */
/**
 * Get user's game history
 */
export const getUserGameHistory = async (username: string): Promise<GameData[]> => {
  if (!username) {
    return [];
  }
  try {
    const cleanUsername = username.toLowerCase().replace(/^@/, '');
    const originalUsername = username.toLowerCase();

    // Strategy: Fetch from both sources in parallel and merge them.
    // 1. 'games' subcollection (personal history)
    // 2. 'scores' collection (global leaderboard entries)

    // Prepare queries
    const gamesRef = collection(db, USERS_COLLECTION, cleanUsername, GAMES_SUBCOLLECTION);
    const gamesQuery = query(gamesRef, limit(HISTORY_LIMIT));

    const scoresRef = collection(db, 'scores');
    const scoresQueryClean = query(
      scoresRef,
      where('username', '==', cleanUsername),
      limit(HISTORY_LIMIT)
    );
    const scoresQueryOriginal =
      originalUsername !== cleanUsername
        ? query(scoresRef, where('username', '==', originalUsername), limit(HISTORY_LIMIT))
        : null;

    // Execute all queries
    const [gamesSnap, scoresCleanSnap, scoresOriginalSnap] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getDocs(gamesQuery).catch(() => ({ docs: [] }) as any), // safely handle error if subcollection doesn't exist
      getDocs(scoresQueryClean),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scoresQueryOriginal ? getDocs(scoresQueryOriginal) : Promise.resolve({ docs: [] } as any),
    ]);

    // Merge strategy: Use a Map keyed by a unique identifier relative to the game.
    // Since IDs might differ between collections, we'll try to dedup by timestamp/date if possible,
    // or just simply merge all unique document IDs if they represent unique games.
    // Note: 'scores' docs and 'games' docs are different documents.
    // 'scores' are definitive for completed daily games.
    // 'games' might contain local history syncs.
    // We will prioritize 'scores' data for display as it's the official record.

    const allGames: GameData[] = [];
    const seenSignatures = new Set<string>();

    const processDoc = (d: DocumentData) => {
      const data = d.data ? d.data() : d; // Handle both QueryDocumentSnapshot and raw data

      // Normalize Date
      let timestamp = 0;
      if (data.timestamp?.toMillis) {
        timestamp = data.timestamp.toMillis();
      } else if (data.timestamp?.seconds) {
        timestamp = data.timestamp.seconds * 1000;
      } else if (typeof data.timestamp === 'number') {
        timestamp = data.timestamp;
      } else if (data.date) {
        // Try to parse YYYYMMDD
        const dStr = data.date.toString();
        // eslint-disable-next-line no-magic-numbers
        if (dStr.length === 8) {
          // eslint-disable-next-line no-magic-numbers
          const y = parseInt(dStr.slice(0, 4), 10);
          // eslint-disable-next-line no-magic-numbers
          const m = parseInt(dStr.slice(4, 6), 10) - 1;
          // eslint-disable-next-line no-magic-numbers
          const dd = parseInt(dStr.slice(6, 8), 10);
          timestamp = new Date(y, m, dd).getTime();
        }
      }

      // Generate a signature to deduplicate: Date + Score
      // This handles the case where the same game exists in both collections
      const dateKey =
        (data.date as number) ||
        parseInt(new Date(timestamp).toISOString().slice(0, 10).replace(/-/g, ''), 10);

      const signature = `${dateKey}_${data.score}`;

      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        allGames.push({
          ...data,
          date: dateKey,
          score: (data.score as number) || 0,
          timestamp: timestamp || Date.now(), // Ensure valid timestamp
        } as GameData);
      }
    };

    // Process scores first (highest priority/validity)
    scoresCleanSnap.docs.forEach((d: DocumentData) => processDoc(d));
    scoresOriginalSnap.docs.forEach((d: DocumentData) => processDoc(d));

    // Then process games (personal history, might contain partials or unsynced)
    gamesSnap.docs.forEach((d: DocumentData) => processDoc(d));

    // If we still found nothing and clean != original, try 'games' on original username as last resort
    if (allGames.length === 0 && cleanUsername !== originalUsername) {
      const altGamesRef = collection(db, USERS_COLLECTION, originalUsername, GAMES_SUBCOLLECTION);
      const altSnap = await getDocs(query(altGamesRef, limit(HISTORY_LIMIT)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      altSnap.docs.forEach((d: any) => processDoc(d));
    }

    // Sort by Date descending
    allGames.sort((a, b) => {
      const dateA = a.date ? Number(a.date.toString().replace(/-/g, '')) : 0;
      const dateB = b.date ? Number(b.date.toString().replace(/-/g, '')) : 0;
      return dateB - dateA;
    });

    return allGames;
  } catch (e) {
    console.error('Error fetching user game history:', e);
    return [];
  }
};

/**
 * Update district score
 */
export const updateDistrictScore = async (districtId: string, score: number): Promise<void> => {
  if (!districtId || !score) {
    return;
  }

  try {
    const districtRef = doc(db, 'districts', districtId);
    await setDoc(
      districtRef,
      {
        score: increment(score),
        name: districtId, // We can improve this to rely on ID mapping or store name
      },
      { merge: true }
    );
  } catch (e) {
    console.error('Error updating district score:', e);
  }
};

/**
 * Get district rankings
 */
export const getDistrictRankings = async (): Promise<{ id: string; score: number }[]> => {
  try {
    const q = query(collection(db, 'districts'), orderBy('score', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as { id: string; score: number });
  } catch (e) {
    console.error('Error fetching district rankings:', e);
    return [];
  }
};
