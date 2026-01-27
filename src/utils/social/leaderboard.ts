import { Timestamp } from 'firebase/firestore';
import { SOCIAL } from '../../config/constants';
import { DISTRICTS } from '../../data/districts';
import { supabase } from '../../services/supabase';
import { debugLog } from '../debug';
import { normalizeUsername } from '../format';

const formatLeaderboardUsername = (userId: string | null | undefined): string => {
  if (!userId) {
    return 'Unknown';
  }
  return userId.startsWith('@') ? userId : `@${userId}`;
};

const FETCH_BUFFER_MULTIPLIER = 4;
const DAYS_IN_WEEK_MINUS_ONE = 6;

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

/**
 * Fetch leaderboard scores using Supabase
 * @param period - The time period to filter by (all, daily, weekly, monthly)
 * @param limitCount - Max number of entries to return (default: constant)
 * @returns Promise resolving to list of ranked score entries
 */
// Database response interface
interface DatabaseGameResult {
  id: string;
  user_id: string;
  score: number;
  time_taken: number;
  played_at: string;
  platform?: string;
}

/**
 * Fetch leaderboard scores using Supabase
 * @param period - The time period to filter by (all, daily, weekly, monthly)
 * @param limitCount - Max number of entries to return (default: constant)
 * @returns Promise resolving to list of ranked score entries
 */
export const getLeaderboard = async (
  period: LeaderboardPeriod = 'all',
  limitCount: number = SOCIAL.LEADERBOARD.FETCH_LIMIT
): Promise<ScoreEntry[]> => {
  try {
    // 1. Fetch from Supabase
    // Start building the query
    let queryBuilder = supabase.from('game_results').select('*');

    // Apply period filters (timestamp based usage of played_at)
    const now = new Date();

    if (period === 'daily') {
      // Use Start of Day (UTC) to match standard daily leaderboard behavior
      // This ensures games played "today" (universal time) are shown, rather than just last 24h
      const startOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
      ).toISOString();
      console.warn('[Leaderboard] Daily filter - UTC start of day:', startOfDay);
      debugLog(`[Leaderboard] Fetching Daily >= ${startOfDay}`);
      queryBuilder = queryBuilder.gte('played_at', startOfDay);
    } else if (period === 'weekly') {
      // Calculate start of week (Monday)
      const d = new Date(now);
      const currentDay = d.getDay(); // 0 = Sunday
      const distanceToMonday = currentDay === 0 ? DAYS_IN_WEEK_MINUS_ONE : currentDay - 1;
      d.setDate(d.getDate() - distanceToMonday);
      d.setHours(0, 0, 0, 0);
      console.warn('[Leaderboard] Weekly filter - start of week:', d.toISOString());
      debugLog(`[Leaderboard] Fetching Weekly >= ${d.toISOString()}`);
      queryBuilder = queryBuilder.gte('played_at', d.toISOString());
    } else if (period === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      console.warn('[Leaderboard] Monthly filter - start of month:', startOfMonth.toISOString());
      queryBuilder = queryBuilder.gte('played_at', startOfMonth.toISOString());
    }

    // Apply ordering and limit LAST to ensure we filter the dataset first
    queryBuilder = queryBuilder
      .order('score', { ascending: false })
      .limit(limitCount * FETCH_BUFFER_MULTIPLIER);

    const { data: rawData, error } = await queryBuilder;

    if (error) {
      console.error('[Leaderboard] Supabase error:', error);
      debugLog(`[Leaderboard] DB Error: ${error.message}`);
      throw error;
    }

    debugLog(`[Leaderboard] Fetched ${rawData?.length || 0} rows for ${period}`);

    if (!rawData) {
      return [];
    }

    // 2. Transform to ScoreEntry format
    const scores: ScoreEntry[] = (rawData as unknown as DatabaseGameResult[]).map(row => ({
      id: row.id,
      username: formatLeaderboardUsername(row.user_id),
      score: row.score,
      time: row.time_taken,
      date: new Date(row.played_at).getTime(), // Numeric timestamp
      timestamp: { seconds: Math.floor(new Date(row.played_at).getTime() / 1000) }, // Mock Firestore Timestamp
      platform: row.platform,
      isBonus: false, // Supabase schema might need this if we track bonuses
      sortDate: new Date(row.played_at),
    }));

    // 3. Deduplicate
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
    console.error('[Leaderboard] Error fetching leaderboard from Supabase:', e);
    return [];
  }
};

/**
 * Daily Mode: Keep FIRST score per user (First Attempt) OR Best Score?
 * Original logic: `if (s.isBonus && s.score > current.score)` -> Only update if bonus?
 * Actually calling it 'deduplicateBestScore' but implementation logic was specific.
 * For now, let's just keep the BEST score per user.
 */
/**
 * Daily Mode: Keep ONLY the BEST score per user.
 * This ensures each user appears at most once on the daily leaderboard with their highest score.
 */
const deduplicateBestScore = (scores: ScoreEntry[]): ScoreEntry[] => {
  const bestScoreByUser: Record<string, ScoreEntry> = {};

  // Sort by score DESC first to easily pick the top one
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  sorted.forEach(s => {
    // If not present, add it (since we sorted by score DESC, the first one encountered is the best)
    if (!bestScoreByUser[s.username]) {
      bestScoreByUser[s.username] = s;
    }
  });

  return Object.values(bestScoreByUser);
};

/**
 * Cumulative Mode: Sum of scores.
 */
/**
 * Cumulative Mode: Sum of scores.
 * For users who played multiple times on the same day, we take their BEST score of that day.
 */
const aggregateCumulativeScores = (scores: ScoreEntry[]): ScoreEntry[] => {
  const userDailyGames: Record<string, Record<string, ScoreEntry>> = {};

  scores.forEach(s => {
    const dateKey = s.sortDate?.toISOString().split('T')[0] || '';
    const username = s.username;

    if (!userDailyGames[username]) {
      userDailyGames[username] = {};
    }

    // Logic: Keep the highest score for each day
    if (!userDailyGames[username][dateKey] || s.score > userDailyGames[username][dateKey].score) {
      userDailyGames[username][dateKey] = s;
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
      timestamp: { seconds: Date.now() / 1000 },
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
 * @param period - The time period to filter scores by
 * @returns Promise resolving to list of team entries sorted by score
 */
export const getTeamLeaderboard = async (
  period: LeaderboardPeriod = 'all'
): Promise<TeamScoreEntry[]> => {
  try {
    // Define type for the query result
    interface UserTeamData {
      username: string;
      team: string | null;
      district: string | null;
    }

    // Fetch user profiles to get team assignments from SUPABASE
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('username, team, district')
      .returns<UserTeamData[]>();

    if (usersError) {
      console.error('Error fetching users for team leaderboard:', usersError);
      return [];
    }

    const userTeamMap: Record<string, { team: string; district: string }> = {};

    (usersData || []).forEach(user => {
      const username = normalizeUsername(user.username);
      if (user.team && user.district) {
        userTeamMap[username] = {
          team: user.team,
          district: user.district,
        };
      }
    });

    // Fetch individual scores for the period from SUPABASE (via getLeaderboard)
    const TEAM_LEADERBOARD_LIMIT = 10000;
    const individualScores = await getLeaderboard(period, TEAM_LEADERBOARD_LIMIT);

    // Aggregate by team
    const teamScores: Record<string, { score: number; members: Set<string>; id: string }> = {};

    const findDistrict = (key: string) => {
      if (!key) {
        return null;
      }
      const k = key.toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return DISTRICTS.find((d: any) => {
        const dId = d.id?.toLowerCase();
        const dTeam = d.teamName?.toLowerCase();
        const dName = d.name?.toLowerCase();
        return dId === k || dTeam === k || dName === k;
      });
    };

    const normalizedUserTeamMap: Record<string, { teamName: string; id: string }> = {};
    Object.entries(userTeamMap).forEach(([user, info]) => {
      const district = findDistrict(info.team) || findDistrict(info.district);
      if (district) {
        // user key is already normalized from userTeamMap construction
        normalizedUserTeamMap[user] = {
          teamName: district.teamName,
          id: district.id,
        };
      }
    });

    individualScores.forEach(score => {
      const username = normalizeUsername(score.username);
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
    console.error('[Leaderboard] Error getting team leaderboard:', e);
    return [];
  }
};
