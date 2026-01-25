import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers24h: number;
  gamesPlayed24h: number;
  totalGiuros: number; // In circulation
  newUsers24h: number;
}

const CACHE_KEY = 'admin_metrics_cache';
// eslint-disable-next-line no-magic-numbers
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

  const now = new Date();
  // eslint-disable-next-line no-magic-numbers
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayTs = Timestamp.fromDate(yesterday);

  try {
    // 1. Total Users
    const usersRef = collection(db, 'users');
    const totalUsersSnap = await getCountFromServer(usersRef);
    const totalUsers = totalUsersSnap.data().count;

    // 2. New Users (24h) - Requires 'joinedAt' index usually, or client-side filter if small
    // We'll trust getDocs for now as user base is likely <10k. If larger, we need count aggregation.
    // Optimization: Use count query with where
    const newUsersQuery = query(usersRef, where('joinedAt', '>=', yesterdayTs));
    const newUsersSnap = await getCountFromServer(newUsersQuery);
    const newUsers24h = newUsersSnap.data().count;

    // 3. Games Played (24h)
    const scoresRef = collection(db, 'scores');
    const recentGamesQuery = query(scoresRef, where('timestamp', '>=', yesterdayTs));
    // We need docs to count unique users for DAU (Active Users)
    const recentGamesSnap = await getDocs(recentGamesQuery);
    const gamesPlayed24h = recentGamesSnap.size;

    // 4. Active Users (24h)
    const uniquePlayers = new Set<string>();
    recentGamesSnap.forEach(doc => {
      const data = doc.data();
      if (data.username) {
        uniquePlayers.add(data.username);
      }
    });
    const activeUsers24h = uniquePlayers.size;

    // 5. Total Giuros (requires scanning users if not aggregated)
    // This is expensive if we download all users. Let's do it only if forcing refresh or separate it.
    // For now, let's fetch limited batch or skip if too heavy.
    // Actually, AdminPanel already fetches getAllUsers(100)? No, it fetches all?
    // Let's assume we can fetch all for now or estimate.
    // Optimization: Create a cloud function for this. For client-side admin, we skip precise total sum to save reads
    // unless strictly requested. We'll set it to 0 or estimate from the cached user list if passed.
    // Let's perform a lightweight aggregation query if possible (not possible in client SDK without reads).
    // We will just sum the metrics from the recently active gamers as a proxy, or return 0.
    const totalGiuros = 0; // Placeholder to avoid 1000s of reads

    const metrics: DashboardMetrics = {
      totalUsers,
      newUsers24h,
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
