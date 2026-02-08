import { supabase } from '../../services/supabase';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers24h: number;
  gamesPlayed24h: number;
  totalGiuros: number; // In circulation
  newUsers24h: number;
}

const CACHE_KEY = 'admin_metrics_cache';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch dashboard metrics for admin panel
 * @param forceRefresh - If true, bypasses the local cache
 * @returns Promise resolving to dashboard metrics object
 */
export const getDashboardMetrics = async (forceRefresh = false): Promise<DashboardMetrics> => {
  // Check cache
  const cached = localStorage.getItem(CACHE_KEY);
  if (!forceRefresh && cached) {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data as DashboardMetrics;
    }
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Total Users
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalUsersError) {
      throw totalUsersError;
    }

    // 2. New Users (24h)
    const { count: newUsers24h, error: newUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('joined_at', yesterday);

    if (newUsersError) {
      throw newUsersError;
    }

    // 3. Games Played (24h)
    const { data: recentGames, error: gamesError } = await supabase
      .from('game_results')
      .select('user_id')
      .gte('played_at', yesterday);

    if (gamesError) {
      throw gamesError;
    }

    const gamesPlayed24h = recentGames?.length || 0;

    // 4. Active Users (24h) - count distinct usernames
    const uniquePlayers = new Set<string>();
    recentGames?.forEach(game => {
      if (game.user_id) {
        uniquePlayers.add(game.user_id);
      }
    });
    const activeUsers24h = uniquePlayers.size;

    // 5. Total Giuros - placeholder (expensive to scan all users)
    const totalGiuros = 0;

    const metrics: DashboardMetrics = {
      totalUsers: totalUsers || 0,
      newUsers24h: newUsers24h || 0,
      gamesPlayed24h,
      activeUsers24h,
      totalGiuros,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: metrics }));
    return metrics;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};
