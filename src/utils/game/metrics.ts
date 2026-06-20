import { supabase } from '../../services/supabase';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers24h: number;
  gamesPlayed24h: number;
  totalGiuros: number;
  newUsers24h: number;
  weeklyActiveUsers: number;
  bannedUsersCount: number;
  correctAnswerRate: number;
  avgScore: number;
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
}

const CACHE_KEY = 'admin_metrics_cache';
const CACHE_DURATION = 5 * 60 * 1000;

export const getDashboardMetrics = async (forceRefresh = false): Promise<DashboardMetrics> => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!forceRefresh && cached) {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data as DashboardMetrics;
    }
  }

  const now = Date.now();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const lastWeek = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      totalUsersResult,
      newUsersResult,
      bannedResult,
      recentGamesResult,
      weeklyGamesResult,
      usersDataResult,
      retentionGamesResult,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('joined_at', yesterday),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('banned', true),
      supabase
        .from('game_results')
        .select('username, score, correct_answers, question_count')
        .gte('played_at', yesterday),
      supabase.from('game_results').select('username').gte('played_at', lastWeek),
      supabase.from('users').select('username, joined_at, giuros').limit(500),
      supabase.from('game_results').select('username, played_at').gte('played_at', sixtyDaysAgo),
    ]);

    const recentGames = recentGamesResult.data || [];
    const weeklyGames = weeklyGamesResult.data || [];
    const usersData = usersDataResult.data || [];
    const retentionGames = retentionGamesResult.data || [];

    const uniquePlayers24h = new Set<string>(
      recentGames.filter(g => g.username).map(g => g.username!)
    );
    const uniqueWeekly = new Set<string>(weeklyGames.filter(g => g.username).map(g => g.username!));

    const validGames = recentGames.filter(
      g => typeof g.question_count === 'number' && g.question_count > 0
    );
    const correctAnswerRate =
      validGames.length > 0
        ? Math.round(
            validGames.reduce(
              (acc, g) => acc + ((g.correct_answers ?? 0) / g.question_count!) * 100,
              0
            ) / validGames.length
          )
        : 0;

    const avgScore =
      recentGames.length > 0
        ? Math.round(recentGames.reduce((acc, g) => acc + (g.score || 0), 0) / recentGames.length)
        : 0;

    const totalGiuros = usersData.reduce((acc, u) => acc + (u.giuros || 0), 0);

    const userGameTimestamps = new Map<string, number[]>();
    retentionGames.forEach(g => {
      if (!g.username || !g.played_at) {
        return;
      }
      const ts = new Date(g.played_at).getTime();
      const existing = userGameTimestamps.get(g.username);
      if (existing) {
        existing.push(ts);
      } else {
        userGameTimestamps.set(g.username, [ts]);
      }
    });

    const computeRetention = (daysN: number): number => {
      const cutoffMs = now - daysN * 24 * 60 * 60 * 1000;
      const cohort = usersData.filter(u => {
        if (!u.joined_at) {
          return false;
        }
        return new Date(u.joined_at).getTime() <= cutoffMs;
      });
      if (cohort.length === 0) {
        return 0;
      }

      const retained = cohort.filter(u => {
        const joinedMs = new Date(u.joined_at!).getTime();
        const windowEndMs = joinedMs + daysN * 24 * 60 * 60 * 1000;
        const plays = userGameTimestamps.get(u.username) || [];
        return plays.some(ts => ts >= joinedMs && ts <= windowEndMs);
      });

      return Math.round((retained.length / cohort.length) * 100);
    };

    const metrics: DashboardMetrics = {
      totalUsers: totalUsersResult.count || 0,
      newUsers24h: newUsersResult.count || 0,
      gamesPlayed24h: recentGames.length,
      activeUsers24h: uniquePlayers24h.size,
      weeklyActiveUsers: uniqueWeekly.size,
      bannedUsersCount: bannedResult.count || 0,
      totalGiuros,
      correctAnswerRate,
      avgScore,
      day1Retention: computeRetention(1),
      day7Retention: computeRetention(7),
      day30Retention: computeRetention(30),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: metrics }));
    return metrics;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};
