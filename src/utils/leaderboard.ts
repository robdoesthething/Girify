import { Timestamp } from 'firebase/firestore';
import { SOCIAL } from '../config/constants';
import { DISTRICTS } from '../data/districts';
import { supabase } from '../services/supabase';
import { normalizeUsername } from './format';

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
    const now = new Date();

    if (period === 'daily') {
      // Create a new date for start of day (UTC) to avoid timezone issues
      const startOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
      ).toISOString();
      console.warn('[Leaderboard] Daily filter - start of day:', startOfDay);
      debugLog(`[Leaderboard] Fetching Daily >= ${startOfDay}`);
      queryBuilder = queryBuilder.gte('played_at', startOfDay);
    } else if (period === 'weekly') {
      // Calculate start of week (Monday)
      const d = new Date(now);
      const currentDay = d.getDay(); // 0 = Sunday
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
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

    const { data: rawData, error } = await queryBuilder;

    if (error) {
      console.error('Supabase error:', error);
      debugLog(`[Leaderboard] DB Error: ${error.message}`);
      throw error;
    }

    debugLog(`[Leaderboard] Fetched ${rawData?.length || 0} rows for ${period}`);

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
    console.error('Error getting team leaderboard:', e);
    return [];
  }
};
