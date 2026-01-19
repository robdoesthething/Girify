import { collection, DocumentData, getDocs, Timestamp } from 'firebase/firestore';
import { SOCIAL } from '../config/constants';
import { DISTRICTS } from '../data/districts';
import { db } from '../firebase';
import { supabase } from '../services/supabase';

// Deprecated collections - used only for types or migration reading if needed
// Deprecated collections - used only for types or migration reading if needed
// const SCORES_COLLECTION = 'scores';

export type LeaderboardPeriod = 'all' | 'daily' | 'weekly' | 'monthly';

export interface ScoreEntry {
  id: string;
  username: string;
  score: number;
  time: number;
  date?: number;
  timestamp?: Timestamp | { seconds: number };
  platform?: string;
  isBonus?: boolean;
  correctAnswers?: number | null;
  questionCount?: number;
  streakAtPlay?: number | null;
  email?: string | null;
  uid?: string | null;
  sortDate?: Date;
  gamesCount?: number;
}

interface SaveScoreOptions {
  isBonus?: boolean;
  correctAnswers?: number | null;
  questionCount?: number;
  streakAtPlay?: number | null;
  email?: string | null;
  uid?: string | null;
}

/**
 * [DEPRECATED] Save user's score to Firestore.
 * This function is kept for compatibility but should not be used in the new architecture.
 * Game results are now saved via gameService.endGame() -> Supabase.
 * However, we still explicitly update User Stats here if called, as a safety measure?
 * No, useGamePersistence handles updateUserGameStats separately.
 */
export const saveScore = (
  _username: string,
  _score: number,
  _time: number | string,
  _options: SaveScoreOptions = {}
): void => {
  console.warn('[Leaderboard] saveScore is DEPRECATED. Supabase is now used via gameService.');
  return;
};

/**
 * Fetch leaderboard scores using Supabase
 */
export const getLeaderboard = async (
  period: LeaderboardPeriod = 'all',
  limitCount: number = SOCIAL.LEADERBOARD.FETCH_LIMIT
): Promise<ScoreEntry[]> => {
  try {
    // 1. Fetch from Supabase
    let queryBuilder = supabase
      .from('game_results')
      .select('*')
      .order('score', { ascending: false })
      .limit(limitCount * 4); // Fetch more for deduplication

    // Apply period filters (timestamp based usage of played_at)
    const today = new Date();

    if (period === 'daily') {
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      queryBuilder = queryBuilder.gte('played_at', startOfDay);
    } else if (period === 'weekly') {
      const today = new Date();
      // Calculate start of week (Monday)
      // JS getDay(): 0 is Sunday.
      // Simple approach: Last 7 days? Or ISO week?
      // Let's match strict week start (Monday?)
      const d = new Date(today);
      const currentDay = d.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      d.setDate(d.getDate() - distanceToMonday);
      d.setHours(0, 0, 0, 0);
      queryBuilder = queryBuilder.gte('played_at', d.toISOString());
    } else if (period === 'monthly') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      queryBuilder = queryBuilder.gte('played_at', startOfMonth);
    }

    const { data: rawData, error } = await queryBuilder;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    if (!rawData) {
      return [];
    }

    // 2. Transform to ScoreEntry format
    const scores: ScoreEntry[] = rawData.map((row: any) => ({
      id: row.id,
      username: row.user_id
        ? row.user_id.startsWith('@')
          ? row.user_id
          : `@${row.user_id}`
        : 'Unknown',
      score: row.score,
      time: row.time_taken,
      date: new Date(row.played_at).getTime(), // Numeric timestamp
      timestamp: { seconds: Math.floor(new Date(row.played_at).getTime() / 1000) }, // Mock Firestore Timestamp
      platform: row.platform,
      isBonus: false, // Supabase schema might need this if we track bonuses
      sortDate: new Date(row.played_at),
    }));

    // 3. Deduplicate
    // Depending on period, we might want "Best Score" or "Cumulative".
    // Existing logic:
    // Daily -> Deduplicate Best Score (Keep One)
    // Others (Weekly/Monthly/All) -> Cumulative?
    // Wait, let's check original implementation:
    // `if (period === 'daily') finalScores = deduplicateBestScore(rawScores);`
    // `else finalScores = aggregateCumulativeScores(rawScores);`

    let finalScores: ScoreEntry[];
    if (period === 'daily') {
      finalScores = deduplicateBestScore(scores);
    } else {
      finalScores = aggregateCumulativeScores(scores);
    }

    // Sort again
    finalScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.time - b.time;
    });

    return finalScores.slice(0, limitCount);
  } catch (e) {
    console.error('Error fetching leaderboard from Supabase:', e);
    return [];
  }
};

/**
 * Daily Mode: Keep FIRST score per user (First Attempt) OR Best Score?
 * Original logic: `if (s.isBonus && s.score > current.score)` -> Only update if bonus?
 * Actually calling it 'deduplicateBestScore' but implementation logic was specific.
 * For now, let's just keep the BEST score per user.
 */
const deduplicateBestScore = (scores: ScoreEntry[]): ScoreEntry[] => {
  const userEntry: Record<string, ScoreEntry> = {};

  const sorted = [...scores].sort((a, b) => {
    // Sort by Date ASC (Oldest first)
    // The original logic seemed to favor the FIRST play unless bonus?
    // Let's implement: Best Score.
    return b.score - a.score;
  });

  sorted.forEach(s => {
    if (!userEntry[s.username]) {
      userEntry[s.username] = s;
    }
  });
  return Object.values(userEntry);
};

/**
 * Cumulative Mode: Sum of scores.
 */
const aggregateCumulativeScores = (scores: ScoreEntry[]): ScoreEntry[] => {
  const userDailyGames: Record<string, Record<string, ScoreEntry>> = {};

  scores.forEach(s => {
    const dateKey = s.sortDate?.toISOString().split('T')[0] || '';
    const username = s.username;

    if (!userDailyGames[username]) {
      userDailyGames[username] = {};
    }
    // Logic: If user played multiple times on same day, take the BEST one?
    // Or FIRST one?
    // Original: `if (sTime < currentTime)` -> Earlier time -> First game?
    // Let's stick to simple: Best score of the day counts.
    if (!userDailyGames[username][dateKey]) {
      userDailyGames[username][dateKey] = s;
    } else {
      if (s.score > userDailyGames[username][dateKey].score) {
        userDailyGames[username][dateKey] = s;
      }
    }
  });

  const aggregated: ScoreEntry[] = [];
  Object.keys(userDailyGames).forEach(username => {
    const dailyGamesMap = userDailyGames[username];
    if (!dailyGamesMap) {
      return;
    }
    const dailyGames = Object.values(dailyGamesMap);
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
      timestamp: { seconds: Date.now() / 1000 }, // Dummy
    });
  });

  return aggregated;
};

export interface TeamScoreEntry {
  id: string;
  teamName: string;
  teamId: string;
  score: number;
  memberCount: number;
  avgScore: number;
}

/**
 * Get team leaderboard with time period filtering
 * Aggregates individual scores by team for the given period
 */
export const getTeamLeaderboard = async (
  period: LeaderboardPeriod = 'all'
): Promise<TeamScoreEntry[]> => {
  try {
    // Fetch user profiles to get team assignments from FIREBASE
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    const userTeamMap: Record<string, { team: string; district: string }> = {};

    usersSnap.forEach(docSnap => {
      const data = docSnap.data() as DocumentData;
      const username =
        (data.username as string)?.toLowerCase().replace('@', '') || docSnap.id.toLowerCase();
      if (data.team && data.district) {
        userTeamMap[username] = {
          team: data.team as string,
          district: data.district as string,
        };
      }
    });

    // Fetch individual scores for the period from SUPABASE (via getLeaderboard)
    const individualScores = await getLeaderboard(period, 10000);

    // Aggregate by team
    const teamScores: Record<string, { score: number; members: Set<string>; id: string }> = {};

    const findDistrict = (key: string) => {
      if (!key) {
        return null;
      }
      const k = key.toLowerCase();
      return DISTRICTS.find(
        (d: any) => d.id === k || d.teamName.toLowerCase() === k || d.name.toLowerCase() === k
      );
    };

    const normalizedUserTeamMap: Record<string, { teamName: string; id: string }> = {};
    Object.entries(userTeamMap).forEach(([user, info]) => {
      const district = findDistrict(info.team) || findDistrict(info.district);
      if (district) {
        normalizedUserTeamMap[user.toLowerCase()] = {
          teamName: district.teamName,
          id: district.id,
        };
      }
    });

    individualScores.forEach(score => {
      const username = score.username.toLowerCase().replace('@', '');
      const userTeam = normalizedUserTeamMap[username];

      if (userTeam) {
        let teamEntry = teamScores[userTeam.teamName];
        if (!teamEntry) {
          teamEntry = { score: 0, members: new Set(), id: userTeam.id };
          teamScores[userTeam.teamName] = teamEntry;
        }
        teamEntry.score += score.score;
        teamEntry.members.add(username);
      }
    });

    const result: TeamScoreEntry[] = Object.entries(teamScores).map(([teamName, data]) => {
      return {
        id: data.id,
        teamName,
        teamId: data.id,
        score: data.score,
        memberCount: data.members.size,
        avgScore: data.members.size > 0 ? Math.round(data.score / data.members.size) : 0,
      };
    });

    result.sort((a, b) => b.score - a.score);

    return result;
  } catch (e) {
    console.error('Error getting team leaderboard:', e);
    return [];
  }
};
