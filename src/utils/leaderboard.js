import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  where,
} from 'firebase/firestore';
import { getTodaySeed } from './dailyChallenge';

const HIGHSCORES_COLLECTION = 'highscores'; // Personal Bests (All Time)
const SCORES_COLLECTION = 'scores'; // Full History

/**
 * Save user's score to Firestore in two collections:
 * 1. 'scores' collection - Full history for daily/weekly/monthly rankings
 * 2. 'highscores' collection - Personal best (all-time), updated only if improved
 *
 * @param {string} username - User's display name
 * @param {number} score - Total points earned (0-2000 for 20 questions)
 * @param {number|string} time - Average time per question in seconds
 * @param {Object} options - Additional options
 * @param {boolean} options.isBonus - If true, this score is a "Retry" allowed by referral
 * @param {number} options.correctAnswers - Number of correct answers
 * @param {number} options.questionCount - Total questions attempted
 * @param {number} options.streakAtPlay - User's streak value at time of play
 * @returns {Promise<void>}
 */
export const saveScore = async (username, score, time, options = {}) => {
  const {
    isBonus = false,
    correctAnswers = null,
    questionCount = 10,
    streakAtPlay = null,
  } = options;
  // eslint-disable-next-line no-console
  console.log(
    `[Leaderboard] saveScore called for ${username}. Score: ${score}, Time: ${time}, Bonus: ${isBonus}`
  );
  if (!username) {
    console.warn('[Leaderboard] saveScore called without username, skipping.');
    return;
  }

  try {
    const now = Timestamp.now();
    // Strip @ prefix from username before saving (usernames stored WITHOUT @ in Firebase)
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    const scoreData = {
      username: cleanUsername,
      score,
      time: parseFloat(time),
      date: getTodaySeed(),
      timestamp: now,
      platform: 'web',
      isBonus, // Store bonus flag
      correctAnswers, // Number of correct responses
      questionCount, // Total questions (for partial games)
      streakAtPlay, // Streak value at time of game
      email: options.email || null, // Store email for integrity/contact
    };

    await addDoc(collection(db, SCORES_COLLECTION), scoreData);

    // 2. Check & Update Personal Best (All Time)
    const sanitizedUsername = cleanUsername.replace(/\//g, '_');
    const userDocRef = doc(db, HIGHSCORES_COLLECTION, sanitizedUsername);
    const userDoc = await getDoc(userDocRef);
    let shouldUpdate = false;

    if (userDoc.exists()) {
      const data = userDoc.data();
      if (score > data.score) {
        shouldUpdate = true;
      } else if (score === data.score && parseFloat(time) < parseFloat(data.time)) {
        shouldUpdate = true;
      }
    } else {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      await setDoc(userDocRef, scoreData);
    }
  } catch (e) {
    console.error('Error saving score: ', e);
    console.error('[Leaderboard] Full error details:', e.code, e.message);
  }
};

/**
 * Fetch leaderboard scores with automatic deduplication (one entry per user).
 * For 'all' period, queries pre-calculated highscores for efficiency.
 * For time-based periods, fetches recent history and filters in-memory.
 *
 * @param {('all'|'daily'|'weekly'|'monthly')} period - Time period for leaderboard
 * @returns {Promise<Array<{id: string, username: string, score: number, time: number, date: number, timestamp: Timestamp}>>}
 *          Top 50 scores, sorted by score (desc) then time (asc)
 *
 * @example
 * const topScores = await getLeaderboard('daily');
 * // Returns today's top 50 scores, one per user
 *
 * @example
 * const allTimeScores = await getLeaderboard('all');
 * // Returns all-time personal bests, top 50
 */
export const getLeaderboard = async (period = 'all') => {
  try {
    // For all periods (including 'all'), we now need cumulative history from 'scores'.
    // 'all' = Cumulative score of 1st game of every day.
    // 'highscores' collection is now only for "Best Single Game" which might be used elsewhere,
    // but for this specific leaderboard requirement, we query 'scores'.

    const scoresRef = collection(db, SCORES_COLLECTION);
    // Increase limit to capture more history for 'all' time aggregation
    // Long term: Move this aggregation to backend (Cloud Functions)
    const q = query(scoresRef, orderBy('timestamp', 'desc'), limit(2000));

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[Leaderboard] Fetching scores for period: ${period}`);
    }

    // Parallel fetch: Scores AND Migration Data
    // We need to know which users have migrated to merge their scores
    // Note: 'orderBy' implicitly filters for existence of field.
    // Or we just fetch all users if dataset is small, but let's try to be specific.
    // Actually, simple way: fetch all users (assuming < 1000 active for now) or just ignore perfectly.
    // Better: Query specifically for migrated fields.
    // For now, let's just fetch scores first. Real-time migration merging might be heavy if many users.

    // Let's use a smarter approach: Just fetch scores.
    const snapshot = await getDocs(q);

    // FETCH MIGRATIONS:
    // To properly deduplicate, we need to know who maps to whom.
    // We'll fetch users acting as tombstones (having migratedTo).
    // This requires an index usually: where('migratedTo', '!=', null).
    // As a fallback without index, we might miss some, but this is critical for the request.
    // Let's try to just fetch the unique usernames found in scores and check their profiles? expensive.
    // Let's assume we can fetch 'users' where migratedTo > '' (non-empty string).

    const migrationMap = {};
    try {
      const usersRef = collection(db, 'users');
      const migrationSnap = await getDocs(query(usersRef, where('migratedTo', '!=', null)));
      migrationSnap.forEach(doc => {
        const d = doc.data();
        if (d.migratedTo) {
          migrationMap[doc.id.toLowerCase()] = d.migratedTo.toLowerCase();
          // Also handle case where username in score might be without @
          // but our map keys should be consistent.
        }
      });
    } catch (e) {
      console.warn('[Leaderboard] Could not fetch migrations (requires index?):', e);
    }

    // Also hardcode the known one from the user request if needed, but the DB should have it.

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `[Leaderboard] Fetched ${snapshot.size} scores, ${Object.keys(migrationMap).length} migrations`
      );
    }

    const rawScores = [];
    // Reset to start of today for comparisons
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Start of Week (Monday)
    const day = todayStart.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const startOfWeek = new Date(todayStart);
    startOfWeek.setDate(todayStart.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of Month
    const startOfMonth = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const todaySeed = getTodaySeed();

    const seenEntries = new Set(); // Prevent duplicate processing of exact same doc

    snapshot.forEach(doc => {
      if (seenEntries.has(doc.id)) return;
      seenEntries.add(doc.id);

      const data = doc.data();
      // Handle different timestamp formats
      let date;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        date = data.timestamp.toDate();
      } else if (data.timestamp && data.timestamp.seconds) {
        date = new Date(data.timestamp.seconds * 1000);
      } else if (data.timestamp) {
        date = new Date(data.timestamp);
      } else {
        date = new Date(0);
      }

      let include = false;
      // Better username handling - use the username from data, or doc ID as fallback
      let rawUsername = data.username?.toLowerCase() || doc.id.toLowerCase() || 'unknown user';

      // NORMALIZE USERNAME: Check migration map
      // If this username is a legacy one, map it to the new one
      if (migrationMap[rawUsername]) {
        rawUsername = migrationMap[rawUsername];
      }
      // Also check keys with/without @ if mismatch
      const withoutAt = rawUsername.replace('@', '');
      if (migrationMap[withoutAt]) {
        rawUsername = migrationMap[withoutAt];
      }

      // Ensure display format has @ prefix (stored without @ in Firebase usually)
      const loweredUsername = rawUsername.startsWith('@') ? rawUsername : '@' + rawUsername;

      if (period === 'daily') {
        // Daily: Only today's games
        if (data.date === todaySeed) {
          include = true;
        } else {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() === todayStart.getTime()) include = true;
        }
      } else if (period === 'weekly') {
        if (date >= startOfWeek) include = true;
      } else if (period === 'monthly') {
        if (date >= startOfMonth) include = true;
      } else if (period === 'all') {
        include = true;
      }

      if (include) {
        rawScores.push({ id: doc.id, ...data, username: loweredUsername, sortDate: date });
      }
    });

    let finalScores = [];

    if (period === 'daily') {
      // Daily: Keep BEST result (Max Score, Min Time)
      finalScores = deduplicateBestScore(rawScores);
    } else {
      // Weekly/Monthly/All: Cumulative sum of 1st result of each day
      finalScores = aggregateCumulativeScores(rawScores);
    }

    // Sort Final Result (Score DESC, Time ASC)
    finalScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    });

    // Safety check: ensure unique users in final list (double check)
    const seen = new Set();
    finalScores = finalScores.filter(s => {
      const u = s.username.toLowerCase();
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });

    return finalScores.slice(0, 50); // Top 50
  } catch (e) {
    console.error('Error getting leaderboard: ', e);
    return [];
  }
};

/**
 * Daily Mode: Keep FIRST score per user (First Attempt).
 * EXCEPTION: If 'isBonus' is true (Referral Retry), allow REPLACEMENT if score is better.
 */
const deduplicateBestScore = scores => {
  const userEntry = {};

  // Sort by time ASC to process chronological order
  const sorted = [...scores].sort((a, b) => a.sortDate - b.sortDate);

  sorted.forEach(s => {
    if (!userEntry[s.username]) {
      // First attempt of the day -> Keep it
      userEntry[s.username] = s;
    } else {
      const current = userEntry[s.username];

      // If this subsequent attempt is a BONUS and is BETTER, replace
      if (s.isBonus && s.score > current.score) {
        userEntry[s.username] = s;
      }
      // Otherwise ignore (Strict First Attempt Rule)
    }
  });
  return Object.values(userEntry);
};

/**
 * Cumulative Mode: Sum of 'First Game of the Day' for each user.
 */
const aggregateCumulativeScores = scores => {
  const userDailyGames = {}; // { username: { dateString: firstGameObj } }

  scores.forEach(s => {
    const dateKey = s.sortDate.toISOString().split('T')[0];
    const username = s.username;

    if (!userDailyGames[username]) {
      userDailyGames[username] = {};
    }

    if (!userDailyGames[username][dateKey]) {
      userDailyGames[username][dateKey] = s;
    } else {
      // Keep the EARLIEST game of the day
      const currentFirst = userDailyGames[username][dateKey];
      if (s.sortDate < currentFirst.sortDate) {
        userDailyGames[username][dateKey] = s;
      }
    }
  });

  // Sum up valid daily games
  const aggregated = [];
  Object.keys(userDailyGames).forEach(username => {
    const dailyGames = Object.values(userDailyGames[username]);
    let totalScore = 0;
    let totalTime = 0;

    dailyGames.forEach(g => {
      totalScore += g.score;
      totalTime += g.time;
    });

    aggregated.push({
      id: username,
      username: username,
      score: totalScore,
      time: dailyGames.length ? totalTime / dailyGames.length : 0, // Average time per game
      gamesCount: dailyGames.length,
    });
  });

  return aggregated;
};
