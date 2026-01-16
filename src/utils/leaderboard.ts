import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { SOCIAL } from '../config/constants';
import { db } from '../firebase';
import { getTodaySeed } from './dailyChallenge';

const HIGHSCORES_COLLECTION = 'highscores';
const SCORES_COLLECTION = 'scores';

export type LeaderboardPeriod = 'all' | 'daily' | 'weekly' | 'monthly';

export interface ScoreEntry {
  id: string;
  username: string;
  score: number;
  time: number;
  date?: number;
  timestamp?: Timestamp;
  platform?: string;
  isBonus?: boolean;
  correctAnswers?: number | null;
  questionCount?: number;
  streakAtPlay?: number | null;
  email?: string | null;
  sortDate?: Date;
  gamesCount?: number;
}

interface SaveScoreOptions {
  isBonus?: boolean;
  correctAnswers?: number | null;
  questionCount?: number;
  streakAtPlay?: number | null;
  email?: string | null;
}

/**
 * Save user's score to Firestore
 */
export const saveScore = async (
  username: string,
  score: number,
  time: number | string,
  options: SaveScoreOptions = {}
): Promise<void> => {
  const {
    isBonus = false,
    correctAnswers = null,
    questionCount = 10,
    streakAtPlay = null,
  } = options;

  console.warn(
    `[Leaderboard] saveScore called for ${username}. Score: ${score}, Time: ${time}, Bonus: ${isBonus}`
  );
  if (!username) {
    console.warn('[Leaderboard] saveScore called without username, skipping.');
    return;
  }

  try {
    const now = Timestamp.now();
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    const scoreData = {
      username: cleanUsername,
      score,
      time: parseFloat(String(time)),
      date: getTodaySeed(),
      timestamp: now,
      platform: 'web',
      isBonus,
      correctAnswers,
      questionCount,
      streakAtPlay,
      email: options.email || null,
    };

    await addDoc(collection(db, SCORES_COLLECTION), scoreData);

    const sanitizedUsername = cleanUsername.replace(/\//g, '_');
    const userDocRef = doc(db, HIGHSCORES_COLLECTION, sanitizedUsername);
    const userDoc = await getDoc(userDocRef);
    let shouldUpdate = false;

    if (userDoc.exists()) {
      const data = userDoc.data() as DocumentData;
      if (score > data.score) {
        shouldUpdate = true;
      } else if (score === data.score && parseFloat(String(time)) < parseFloat(String(data.time))) {
        shouldUpdate = true;
      }
    } else {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      await setDoc(userDocRef, scoreData);
    }

    // [New] Also update the User Profile stats (for 'bestScore' consistency)
    // Dynamic import to avoid circular dependency if possible, or direct if allowed.
    // Assuming circular dependency is handled or fine.
    const { updateUserGameStats } = await import('./social');
    await updateUserGameStats(username, {
      streak: streakAtPlay || 0,
      totalScore: score, // This adds to total score in updateUserGameStats
      lastPlayDate: new Date().toISOString(),
      currentScore: score,
    });
  } catch (e) {
    console.error('Error saving score: ', e);
    console.error(
      '[Leaderboard] Full error details:',
      (e as { code?: string }).code,
      (e as Error).message
    );
  }
};

/**
 * Fetch leaderboard scores with automatic deduplication (one entry per user)
 */
export const getLeaderboard = async (period: LeaderboardPeriod = 'all'): Promise<ScoreEntry[]> => {
  try {
    const scoresRef = collection(db, SCORES_COLLECTION);
    const q = query(scoresRef, orderBy('timestamp', 'desc'), limit(SOCIAL.LEADERBOARD.FETCH_LIMIT));

    if (import.meta.env.DEV) {
      console.warn(`[Leaderboard] Fetching scores for period: ${period}`);
    }

    const migrationMap: Record<string, string> = {};
    try {
      const usersRef = collection(db, 'users');
      const migrationSnap = await getDocs(query(usersRef, where('migratedTo', '!=', null)));
      migrationSnap.forEach(docSnap => {
        const d = docSnap.data() as DocumentData;
        if (d.migratedTo) {
          migrationMap[docSnap.id.toLowerCase()] = (d.migratedTo as string).toLowerCase();
        }
      });
    } catch (e) {
      console.warn('[Leaderboard] Could not fetch migrations (requires index?):', e);
    }

    const snapshot = await getDocs(q);

    if (import.meta.env.DEV) {
      console.warn(
        `[Leaderboard] Fetched ${snapshot.size} scores, ${Object.keys(migrationMap).length} migrations`
      );
    }

    const rawScores: ScoreEntry[] = [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const day = todayStart.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const startOfWeek = new Date(todayStart);
    startOfWeek.setDate(todayStart.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const todaySeed = getTodaySeed();
    const seenEntries = new Set<string>();

    snapshot.forEach(docSnap => {
      if (seenEntries.has(docSnap.id)) {
        return;
      }
      seenEntries.add(docSnap.id);

      const data = docSnap.data() as DocumentData;
      let date: Date;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        date = data.timestamp.toDate();
      } else if (data.timestamp?.seconds) {
        const MS_PER_SECOND = 1000;
        date = new Date(data.timestamp.seconds * MS_PER_SECOND);
      } else if (data.timestamp) {
        date = new Date(data.timestamp);
      } else {
        date = new Date(0);
      }

      let include = false;
      let rawUsername =
        (data.username as string)?.toLowerCase() || docSnap.id.toLowerCase() || 'unknown user';

      if (migrationMap[rawUsername]) {
        rawUsername = migrationMap[rawUsername];
      }
      const withoutAt = rawUsername.replace('@', '');
      if (migrationMap[withoutAt]) {
        rawUsername = migrationMap[withoutAt];
      }

      const loweredUsername = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;

      if (period === 'daily') {
        if (data.date === todaySeed) {
          include = true;
        } else {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() === todayStart.getTime()) {
            include = true;
          }
        }
      } else if (period === 'weekly') {
        if (date >= startOfWeek) {
          include = true;
        }
      } else if (period === 'monthly') {
        if (date >= startOfMonth) {
          include = true;
        }
      } else if (period === 'all') {
        include = true;
      }

      if (include) {
        rawScores.push({
          id: docSnap.id,
          username: loweredUsername,
          score: data.score as number,
          time: data.time as number,
          date: data.date as number,
          isBonus: data.isBonus as boolean,
          sortDate: date,
        });
      }
    });

    let finalScores: ScoreEntry[] = [];

    if (period === 'daily') {
      finalScores = deduplicateBestScore(rawScores);
    } else {
      finalScores = aggregateCumulativeScores(rawScores);
    }

    finalScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.time - b.time;
    });

    const seen = new Set<string>();
    finalScores = finalScores.filter(s => {
      const u = s.username.toLowerCase();
      if (seen.has(u)) {
        return false;
      }
      seen.add(u);
      return true;
    });

    const TOP_LIMIT = 50;
    return finalScores.slice(0, TOP_LIMIT);
  } catch (e) {
    console.error('Error getting leaderboard: ', e);
    return [];
  }
};

/**
 * Daily Mode: Keep FIRST score per user (First Attempt).
 */
const deduplicateBestScore = (scores: ScoreEntry[]): ScoreEntry[] => {
  const userEntry: Record<string, ScoreEntry> = {};

  const sorted = [...scores].sort((a, b) => {
    const aTime = a.sortDate?.getTime() || 0;
    const bTime = b.sortDate?.getTime() || 0;
    return aTime - bTime;
  });

  sorted.forEach(s => {
    if (!userEntry[s.username]) {
      userEntry[s.username] = s;
    } else {
      const current = userEntry[s.username];
      if (s.isBonus && s.score > current.score) {
        userEntry[s.username] = s;
      }
    }
  });
  return Object.values(userEntry);
};

/**
 * Cumulative Mode: Sum of 'First Game of the Day' for each user.
 */
const aggregateCumulativeScores = (scores: ScoreEntry[]): ScoreEntry[] => {
  const userDailyGames: Record<string, Record<string, ScoreEntry>> = {};

  scores.forEach(s => {
    const dateKey = s.sortDate?.toISOString().split('T')[0] || '';
    const username = s.username;

    if (!userDailyGames[username]) {
      userDailyGames[username] = {};
    }

    if (!userDailyGames[username][dateKey]) {
      userDailyGames[username][dateKey] = s;
    } else {
      const currentFirst = userDailyGames[username][dateKey];
      const currentTime = currentFirst.sortDate?.getTime() || 0;
      const sTime = s.sortDate?.getTime() || 0;
      if (sTime < currentTime) {
        userDailyGames[username][dateKey] = s;
      }
    }
  });

  const aggregated: ScoreEntry[] = [];
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
      time: dailyGames.length ? totalTime / dailyGames.length : 0,
      gamesCount: dailyGames.length,
    });
  });

  return aggregated;
};
