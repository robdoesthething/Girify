/**
 * useAdminData Hook
 *
 * Manages admin panel data fetching and action handlers.
 */

import { useCallback, useEffect, useState } from 'react';
import { UserProfile } from '../types/user';
import { DashboardMetrics, getDashboardMetrics } from '../utils/game/metrics';
import { logger } from '../utils/logger';
import { getShopItems, ShopItem } from '../utils/shop';
import {
  deleteUserAndData,
  FeedbackItem,
  getAllUsers,
  getFeedbackList,
  updateUserAsAdmin,
} from '../utils/social';
import { Announcement, getAllAnnouncements } from '../utils/social/news';

export interface AdminDataState {
  users: UserProfile[];
  feedback: FeedbackItem[];
  announcements: Announcement[];
  shopItems: { all: ShopItem[] };
  metrics: DashboardMetrics | null;
  loading: boolean;
  migrationStatus: string | null;
}

export function useAdminData(
  notify: (msg: string, type: 'success' | 'error') => void,
  confirm: (msg: string, title: string, dangerous?: boolean) => Promise<boolean>
) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [shopItems, setShopItems] = useState<{ all: ShopItem[] }>({ all: [] });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [u, f, a, shop, m] = await Promise.all([
      getAllUsers(100) as unknown as Promise<UserProfile[]>,
      getFeedbackList() as unknown as Promise<FeedbackItem[]>,
      getAllAnnouncements(),
      getShopItems(true) as unknown as Promise<{ all: ShopItem[] }>,
      getDashboardMetrics(),
    ]);
    setUsers(u);
    setFeedback(f);
    setAnnouncements(a);

    setShopItems(shop as any);
    setMetrics(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, [fetchData]);

  const handleMigration = async () => {
    if (
      !(await confirm(
        'WARNING: This will migrate ALL users to lowercase usernames. This is destructive. Are you sure?',
        'Start Migration',
        true
      ))
    ) {
      return;
    }

    setMigrationStatus('Starting migration...');
    try {
      // Migration now handled via Supabase. This is a legacy admin action.
      // Lowercase username migration is no longer needed (Supabase data is already normalized).
      setMigrationStatus('Migration is no longer needed — all data is in Supabase.');
      fetchData();
    } catch (e: unknown) {
      logger.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setMigrationStatus(`Error: ${errorMessage}`);
    }
  };

  const handleCleanupUser = async () => {
    const badUser = users.find(u => !u.email);

    if (!badUser) {
      notify('No user without email found.', 'success');
      return;
    }

    if (
      !(await confirm(
        `Found user "${badUser.username}" with no email. Delete permanently?`,
        'Cleanup Data',
        true
      ))
    ) {
      return;
    }

    try {
      const result = await deleteUserAndData(badUser.username);
      if (result.success) {
        notify(`Deleted user ${badUser.username}`, 'success');
        fetchData();
      } else {
        notify('Failed to delete user', 'error');
      }
    } catch (e) {
      console.error(e);
      notify('Cleanup failed', 'error');
    }
  };

  const handleUpdateUser = async (editingUser: UserProfile) => {
    const updates = {
      ...editingUser,
      giuros: Number(editingUser.giuros),
      gamesPlayed: Number(editingUser.gamesPlayed),
      bestScore: Number(editingUser.bestScore),
      purchasedCosmetics: editingUser.purchasedCosmetics || [],

      joinedAt: editingUser.joinedAt as any,
    };

    try {
      await updateUserAsAdmin(editingUser.username, updates);
      fetchData();
      notify('User updated successfully', 'success');
      return true;
    } catch (e: unknown) {
      logger.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      notify(`Update failed: ${errorMessage}`, 'error');
      return false;
    }
  };

  return {
    state: { users, feedback, announcements, shopItems, metrics, loading, migrationStatus },
    actions: { fetchData, handleMigration, handleCleanupUser, handleUpdateUser },
  };
}

export default useAdminData;
