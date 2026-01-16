import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
// @ts-ignore
import { useConfirm } from '../hooks/useConfirm';
import { useNotification } from '../hooks/useNotification';
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
import AdminAchievements from './AdminAchievements';
import AdminAnnouncements from './AdminAnnouncements';
import AdminConfig from './AdminConfig';
import AdminContent from './AdminContent';
import AdminFeedback from './AdminFeedback';
import AdminGameMaster from './AdminGameMaster';
import AdminGiuros from './AdminGiuros';
import AdminShop from './AdminShop';
import { ConfirmDialog } from './ConfirmDialog';
import ProfileScreen from './ProfileScreen';

interface MetricCardProps {
  title: string;
  value: string | number;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, color }) => {
  const { theme } = useTheme();
  return (
    <div
      className={`p-6 rounded-2xl shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
    >
      <h3 className="text-sm font-bold opacity-60 uppercase mb-2">{title}</h3>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
};

// eslint-disable-next-line max-lines-per-function
const AdminPanel: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const { notify } = useNotification();
  const { confirm, confirmConfig, handleClose } = useConfirm();

  const [shopItems, setShopItems] = useState<{ all: ShopItem[] }>({ all: [] });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

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
      // @ts-ignore
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
          // Overwrite with lowercase ID, keeping data
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
      fetchData(); // Refresh list
    } catch (e: unknown) {
      logger.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setMigrationStatus(`Error: ${errorMessage}`);
    }
  };

  const handleCleanupUser = async () => {
    // Find user without email (orphaned/test accounts)
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

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) {
      return;
    }

    // Convert numeric fields
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
      setEditingUser(null);
      fetchData();
      notify('User updated successfully', 'success');
    } catch (e: unknown) {
      logger.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      notify(`Update failed: ${errorMessage}`, 'error');
    }
  };

  return (
    <div
      className={`fixed inset-0 pt-16 flex ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Sidebar */}
      <div
        className={`w-48 shrink-0 p-4 border-r flex flex-col ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}
      >
        <h1 className="text-xl font-black mb-6 text-sky-500">Girify Admin</h1>
        <nav className="flex flex-col gap-1">
          {[
            'dashboard',
            'users',
            'gamemaster',
            'achievements',
            'content',
            'shop',
            'feedback',
            'announcements',
            'giuros',
            'config',
          ].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content - h-full + overflow-y-scroll ensures scrolling */}
      <div className="flex-1 h-full overflow-y-scroll p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        ) : (
          <div className="w-full pb-16">
            {/* GAMEMASTER */}
            {activeTab === 'gamemaster' && <AdminGameMaster onNotify={notify} confirm={confirm} />}

            {/* ACHIEVEMENTS */}
            {activeTab === 'achievements' && (
              <AdminAchievements onNotify={notify} confirm={confirm} />
            )}

            {/* CONTENT STUDIO */}
            {activeTab === 'content' && <AdminContent onNotify={notify} confirm={confirm} />}

            {/* GIUROS ECONOMICS */}
            {activeTab === 'giuros' && (
              // @ts-ignore
              <AdminGiuros users={users} shopItems={shopItems} theme={theme} />
            )}

            {/* SHOP */}
            {activeTab === 'shop' && (
              <AdminShop
                // @ts-ignore
                items={shopItems}
                onRefresh={fetchData}
                notify={notify}
                confirm={confirm}
              />
            )}

            {/* FEEDBACK */}
            {activeTab === 'feedback' && (
              <AdminFeedback
                feedback={feedback}
                onRefresh={fetchData}
                notify={notify}
                confirm={confirm}
              />
            )}

            {/* ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <AdminAnnouncements
                announcements={announcements}
                onRefresh={fetchData}
                notify={notify}
                confirm={confirm}
              />
            )}

            {/* CONFIG */}
            {activeTab === 'config' && <AdminConfig onNotify={notify} />}

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black">Overview</h2>
                {metrics ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetricCard
                      title="Total Users"
                      value={metrics.totalUsers}
                      color="text-sky-500"
                    />
                    <MetricCard
                      title="New (24h)"
                      value={metrics.newUsers24h}
                      color="text-emerald-500"
                    />
                    <MetricCard
                      title="Active (24h)"
                      value={metrics.activeUsers24h}
                      color="text-purple-500"
                    />
                    <MetricCard
                      title="Games (24h)"
                      value={metrics.gamesPlayed24h}
                      color="text-orange-500"
                    />
                    <MetricCard title="Feedback" value={feedback.length} color="text-pink-500" />
                    <MetricCard
                      title="Items"
                      value={shopItems.all?.length || 0}
                      color="text-yellow-500"
                    />
                  </div>
                ) : (
                  <div className="py-12 text-center opacity-50">Loading metrics...</div>
                )}

                {/* Data Tools */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-xl font-bold mb-4">Data Tools</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <button
                        onClick={handleMigration}
                        className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
                      >
                        ⚠️ Fix Usernames (Lowercase)
                      </button>
                      <button
                        onClick={handleCleanupUser}
                        className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shadow-lg shadow-rose-500/20"
                      >
                        🗑️ Cleanup No-Email Users
                      </button>
                      {migrationStatus && (
                        <span className="font-mono text-sm opacity-70 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded">
                          {migrationStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black">User Management</h2>
                  <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold"
                  >
                    Refresh
                  </button>
                </div>

                <div
                  className={`rounded-2xl overflow-hidden border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}
                >
                  <table className="w-full text-left">
                    <thead className={theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}>
                      <tr>
                        <th className="p-4 text-xs uppercase opacity-50">User</th>
                        <th className="p-4 text-xs uppercase opacity-50">Email</th>
                        <th className="p-4 text-xs uppercase opacity-50">Stats</th>
                        <th className="p-4 text-xs uppercase opacity-50">Giuros</th>
                        <th className="p-4 text-xs uppercase opacity-50">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {users.map(user => (
                        <tr
                          key={user.uid || user.username}
                          className={
                            theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                          }
                        >
                          <td className="p-4">
                            <div className="font-bold">{user.username}</div>
                            <div className="text-xs opacity-50">{user.realName}</div>
                          </td>
                          <td className="p-4 text-sm font-mono opacity-70">
                            {user.email || 'No email'}
                          </td>
                          <td className="p-4 text-sm">
                            <div>Games: {user.gamesPlayed || 0}</div>
                            <div>Best: {user.bestScore || 0}</div>
                            <div className="text-orange-500 font-bold">
                              Streak: {user.streak || 0}
                            </div>
                            <div className="opacity-70 text-xs mt-1">
                              Total: {(user.totalScore || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-yellow-500">
                            {user.giuros || 0} 🪙
                          </td>
                          <td className="p-4 flex gap-2">
                            <button
                              onClick={() => setViewingUser(user)}
                              className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-lg text-xs font-bold hover:bg-purple-500 hover:text-white transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-lg text-xs font-bold hover:bg-sky-500 hover:text-white transition-colors"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black">Analytics</h2>
                <p className="opacity-60">More advanced analytics coming soon.</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard title="Total Users" value={users.length} color="text-sky-500" />
                  <MetricCard
                    title="Total Games"
                    value={users.reduce((acc, u) => acc + (u.gamesPlayed || 0), 0)}
                    color="text-purple-500"
                  />
                  <MetricCard
                    title="Average Score"
                    value={Math.round(
                      users.reduce((acc, u) => acc + (u.bestScore || 0), 0) / (users.length || 1)
                    )}
                    color="text-emerald-500"
                  />
                  <MetricCard
                    title="Total Economy"
                    value={users.reduce((acc, u) => acc + (u.giuros || 0), 0).toLocaleString()}
                    color="text-yellow-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              <h3 className="text-2xl font-black mb-6">Edit User</h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="edit-username"
                      className="text-xs uppercase font-bold opacity-50 block mb-1"
                    >
                      Username
                    </label>
                    <input
                      id="edit-username"
                      value={editingUser.username}
                      onChange={e =>
                        setEditingUser({ ...editingUser, username: e.target.value.toLowerCase() })
                      }
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-email"
                      className="text-xs uppercase font-bold opacity-50 block mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="edit-email"
                      disabled
                      value={editingUser.email || ''}
                      className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-900 opacity-50 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="edit-giuros"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    Giuros Balance
                  </label>
                  <input
                    id="edit-giuros"
                    type="number"
                    value={editingUser.giuros}
                    onChange={e =>
                      setEditingUser({ ...editingUser, giuros: Number(e.target.value) })
                    }
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-3 font-bold opacity-60 hover:opacity-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!confirmConfig}
          title={confirmConfig?.title || ''}
          message={confirmConfig?.message || ''}
          isDangerous={confirmConfig?.isDangerous}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      </AnimatePresence>

      {/* VIEW PROFILE MODAL */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-4xl h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}
            >
              <button
                onClick={() => setViewingUser(null)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="p-8">
                <div className="bg-orange-500 text-white text-center py-2 px-4 rounded-xl font-bold mb-6">
                  ⚠️ ADMIN VIEW: Viewing profile of {viewingUser.username}
                </div>
                {/* @ts-ignore */}
                <ProfileScreen username={viewingUser!.username} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
