import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, Timestamp, addDoc, updateDoc } from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const FRIENDSHIPS_COLLECTION = 'friendships';
const REFERRALS_COLLECTION = 'referrals';

/**
 * Get or create user profile document
 */
export const ensureUserProfile = async (username) => {
    if (!username) return null;

    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        // Create new user profile
        const profileData = {
            username,
            joinedAt: Timestamp.now(),
            friendCount: 0,
            gamesPlayed: 0,
            bestScore: 0,
            referralCode: username.toLowerCase().replace(/[^a-z0-9]/g, '')
        };
        await setDoc(userRef, profileData);
        return profileData;
    }

    return { id: userDoc.id, ...userDoc.data() };
};

/**
 * Get user profile by username
 */
export const getUserProfile = async (username) => {
    if (!username) return null;

    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        // Try to build profile from highscores data
        try {
            const highscoreRef = doc(db, 'highscores', username);
            const highscoreDoc = await getDoc(highscoreRef);
            if (highscoreDoc.exists()) {
                const data = highscoreDoc.data();
                return {
                    username,
                    gamesPlayed: 1,
                    bestScore: data.score || 0,
                    friendCount: 0
                };
            }
        } catch (e) {
            console.error('Error fetching highscore:', e);
        }
        return null;
    }

    return { id: userDoc.id, ...userDoc.data() };
};

/**
 * Update user stats after a game
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
            bestScore: newBestScore
        });
    } else {
        await ensureUserProfile(username);
        await updateDoc(userRef, {
            gamesPlayed: 1,
            bestScore: score
        });
    }
};

/**
 * Send friend request
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
        createdAt: Timestamp.now()
    });
};

/**
 * Accept friend request
 */
export const acceptFriendRequest = async (requestId) => {
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
const incrementFriendCount = async (username) => {
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
export const getFriendCount = async (username) => {
    if (!username) return 0;

    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
        return userDoc.data().friendCount || 0;
    }
    return 0;
};

/**
 * Record a referral
 */
export const recordReferral = async (referrer, referred) => {
    if (!referrer || !referred || referrer === referred) return;

    await addDoc(collection(db, REFERRALS_COLLECTION), {
        referrer,
        referred,
        createdAt: Timestamp.now()
    });
};

/**
 * Get pending friend requests for a user
 */
export const getPendingFriendRequests = async (username) => {
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
        createdAt: Timestamp.now()
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
export const updateUserAvatar = async (username, avatarUrl) => {
    if (!username || !avatarUrl) return;

    const userRef = doc(db, USERS_COLLECTION, username);
    await updateDoc(userRef, { avatarUrl });
};
