/**
 * useAdminData Hook
 *
 * Manages admin panel data fetching and action handlers.
 */

import { useCallback, useEffect, useState } from 'react';
import { UserProfile } from '../types/user';
import { logger } from '../utils/logger';
import { DashboardMetrics, getDashboardMetrics } from '../utils/metrics';
import { Announcement, getAllAnnouncements } from '../utils/news';
import { getShopItems, ShopItem } from '../utils/shop';
import {
  deleteUserAndData,
  FeedbackItem,
  getAllUsers,
  getFeedbackList,
  updateUserAsAdmin,
} from '../utils/social';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setShopItems(shop as any);
    setMetrics(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
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
      const { collection, getDocs, doc, writeBatch } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usersRef = collection(db as any, 'users');
      const snapshot = await getDocs(usersRef);
      let migrated = 0;
      let count = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let batch = writeBatch(db as any);
      const batchSize = 200;

      for (const userDoc of snapshot.docs) {
        const oldId = userDoc.id;
        const newId = oldId.toLowerCase();

        if (oldId !== newId) {
          const oldData = userDoc.data();
          const targetRef = doc(db, 'users', newId);
          batch.set(targetRef, { ...oldData, username: newId, originalId: oldId }, { merge: true });
          batch.delete(userDoc.ref);
          migrated++;
          count++;
        }

        if (count >= batchSize) {
          await batch.commit();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          batch = writeBatch(db as any);
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }

      setMigrationStatus(`Migration complete. Migrated ${migrated} users.`);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
