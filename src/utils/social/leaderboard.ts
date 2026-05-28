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

export type LeaderboardPeriod = 'all' | 'daily' | 'weekly' | 'monthly';

export interface ScoreEntry {
  id: string;
  username: string;
  score: number;
  time: number;
  date?: number;
  timestamp?: { seconds: number };
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
    // Server-side aggregation via RPC — Postgres does the GROUP BY and returns
    // only the final N rows instead of streaming all matching raw rows to the client.
    const { data, error } = await (supabase as any).rpc('get_leaderboard', {
      p_period: period,
      p_limit: limitCount,
    });

    if (error) {
      console.error('[Leaderboard] Supabase RPC error:', error);
      debugLog(`[Leaderboard] RPC Error: ${error.message}`);
      throw error;
    }

    debugLog(`[Leaderboard] Fetched ${data?.length || 0} rows for ${period}`);

    if (!data) {
      return [];
    }

    interface RpcRow {
      username: string;
      score: number;
      avg_time: number | null;
      games_count: number;
    }

    return (data as RpcRow[]).map(row => ({
      id: row.username,
      username: formatLeaderboardUsername(row.username),
      score: row.score,
      time: row.avg_time ?? 0,
      gamesCount: row.games_count,
    }));
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

    // Fetch user profiles and individual scores in parallel
    const TEAM_LEADERBOARD_LIMIT = 2000;

    const [usersResult, individualScores] = await Promise.all([
      supabase
        .from('users')
        .select('username, team, district')
        .not('team', 'is', null)
        .returns<UserTeamData[]>(),
      getLeaderboard(period, TEAM_LEADERBOARD_LIMIT),
    ]);

    const { data: usersData, error: usersError } = usersResult;

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

    // Aggregate by team
    const teamScores: Record<string, { score: number; members: Set<string>; id: string }> = {};

    const findDistrict = (key: string) => {
      if (!key) {
        return null;
      }
      const k = key.toLowerCase();

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
