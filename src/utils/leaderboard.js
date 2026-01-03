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
 * @returns {Promise<void>}
 *
 * @example
 * await saveScore('JohnDoe', 1850, '8.5');
 * // Saves to history and updates personal best if score > previous best
 */
export const saveScore = async (username, score, time) => {
  // eslint-disable-next-line no-console
  console.log(`[Leaderboard] saveScore called for ${username}. Score: ${score}, Time: ${time}`);
  if (!username) {
    console.warn('[Leaderboard] saveScore called without username, skipping.');
    return;
  }

  try {
    const now = Timestamp.now();
    const scoreData = {
      username,
      score,
      time: parseFloat(time),
      date: getTodaySeed(),
      timestamp: now,
      platform: 'web',
    };

    await addDoc(collection(db, SCORES_COLLECTION), scoreData);

    // 2. Check & Update Personal Best (All Time)
    const sanitizedUsername = username.replace(/\//g, '_');
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
    let scores = [];

    if (period === 'all') {
      // Efficient: Just query the Pre-Calculated Highscores
      const q = query(collection(db, HIGHSCORES_COLLECTION), orderBy('score', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => scores.push({ id: doc.id, ...doc.data() }));
    } else {
      // For periods, we query the history 'scores' collection.
      const scoresRef = collection(db, SCORES_COLLECTION);
      const q = query(scoresRef, orderBy('timestamp', 'desc'), limit(1000));
      // eslint-disable-next-line no-console
      console.log(`[Leaderboard] Fetching scores for period: ${period}`);
      const snapshot = await getDocs(q);
      // eslint-disable-next-line no-console
      console.log(`[Leaderboard] Fetched ${snapshot.size} documents from 'scores'`);

      const now = new Date();
      now.setHours(23, 59, 59, 999); // End of today for safer comparison? No, start of day for start dates.
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

      // eslint-disable-next-line no-console
      console.log(
        `[Leaderboard] Filters - TodaySeed: ${todaySeed}, StartOfWeek: ${startOfWeek.toISOString()}, StartOfMonth: ${startOfMonth.toISOString()}`
      );

      snapshot.forEach(doc => {
        const data = doc.data();
        // Handle different timestamp formats
        let date;
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          date = data.timestamp.toDate();
        } else if (data.timestamp && data.timestamp.seconds) {
          // Handle raw Firestore obj if slightly malformed
          date = new Date(data.timestamp.seconds * 1000);
        } else if (data.timestamp) {
          date = new Date(data.timestamp);
        } else {
          date = new Date(0);
        }

        let include = false;
        if (period === 'daily') {
          // Robust check: try seed match OR date match
          if (data.date === todaySeed) {
            include = true;
          } else {
            // Fallback: check if date is today
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() === todayStart.getTime()) include = true;
          }
        } else if (period === 'weekly') {
          if (date >= startOfWeek) include = true;
        } else if (period === 'monthly') {
          if (date >= startOfMonth) include = true;
        }

        if (include) {
          scores.push({ id: doc.id, ...data, sortDate: date });
        }
      });

      // eslint-disable-next-line no-console
      console.log(`[Leaderboard] Scores after filtering for '${period}': ${scores.length}`);

      // Deduplicate: Keep best score per user
      scores = deduplicateScores(scores);
    }

    // Sort Final Result (Score DESC, Time ASC)
    scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    });

    return scores.slice(0, 50); // Top 50
  } catch (e) {
    console.error('Error getting leaderboard: ', e);
    return [];
  }
};

/**
 * Deduplicate scores array to keep only the best score per user.
 * If scores are equal, keeps the one with faster time.
 *
 * @param {Array<{username: string, score: number, time: number}>} scores - Array of score objects
 * @returns {Array<{username: string, score: number, time: number}>} Deduplicated scores
 * @private
 */
const deduplicateScores = scores => {
  const userBest = {};
  scores.forEach(s => {
    if (!userBest[s.username]) {
      userBest[s.username] = s;
    } else {
      // Check if this new score is better
      const best = userBest[s.username];
      if (s.score > best.score || (s.score === best.score && s.time < best.time)) {
        userBest[s.username] = s;
      }
    }
  });
  return Object.values(userBest);
};
