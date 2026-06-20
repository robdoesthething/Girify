/**
 * useAdminData Hook
 *
 * Manages admin panel data fetching and action handlers.
 */

import { useCallback, useEffect, useState } from 'react';
import { DashboardMetrics, getDashboardMetrics } from '../utils/game/metrics';
import { logger } from '../utils/logger';
import { getShopItems, GroupedShopItems } from '../utils/shop';
import {
  deleteUserAndData,
  FeedbackItem,
  getAllUsers,
  getFeedbackList,
  updateUserAsAdmin,
  UserProfile,
} from '../utils/social';
import { Announcement, getAllAnnouncements } from '../utils/social/news';

export interface AdminDataState {
  users: UserProfile[];
  feedback: FeedbackItem[];
  announcements: Announcement[];
  shopItems: GroupedShopItems;
  metrics: DashboardMetrics | null;
  loading: boolean;
}

export function useAdminData(
  notify: (msg: string, type: 'success' | 'error') => void,
  confirm: (msg: string, title: string, dangerous?: boolean) => Promise<boolean>
) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [shopItems, setShopItems] = useState<GroupedShopItems>({
    all: [],
    avatars: [],
    avatarFrames: [],
    frames: [],
    titles: [],
    badges: [],
    special: [],
  });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [u, f, a, shop, m] = await Promise.all([
      getAllUsers(100),
      getFeedbackList(),
      getAllAnnouncements(),
      getShopItems(true),
      getDashboardMetrics(),
    ]);
    setUsers(u);
    setFeedback(f);
    setAnnouncements(a);
    setShopItems(shop);
    setMetrics(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, [fetchData]);

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
    state: { users, feedback, announcements, shopItems, metrics, loading },
    actions: { fetchData, handleCleanupUser, handleUpdateUser },
  };
}

export default useAdminData;
