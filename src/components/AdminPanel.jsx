import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getAllUsers, getFeedbackList, updateUserAsAdmin } from '../utils/social';
import { getAllAnnouncements, createAnnouncement, deleteAnnouncement } from '../utils/news';
import { getShopItems, createShopItem, deleteShopItem, updateShopItem } from '../utils/shop';
import AdminGiuros from './AdminGiuros';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENT_BADGES } from '../data/achievements';
import quizPlan from '../data/quizPlan.json';

const MetricCard = ({ title, value, color }) => {
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

const AdminPanel = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [promptConfig, setPromptConfig] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [shopItems, setShopItems] = useState({ all: [] });
  const [newShopItem, setNewShopItem] = useState({
    id: '',
    name: '',
    type: 'title',
    cost: 100,
    emoji: '',
    flavorText: '',
    description: '',
    cssClass: '',
  });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    body: '',
    publishDate: '',
    expiryDate: '',
  });

  const showConfirm = (message, title = 'Confirm Action') =>
    new Promise(resolve => {
      setConfirmConfig({ message, title, resolve });
    });

  const showPrompt = (message, defaultValue = '', title = 'Input Required') =>
    new Promise(resolve => {
      setPromptConfig({ message, defaultValue, title, resolve });
    });

  const handleConfirmAction = result => {
    if (confirmConfig?.resolve) confirmConfig.resolve(result);
    setConfirmConfig(null);
  };

  const handlePromptAction = value => {
    if (promptConfig?.resolve) promptConfig.resolve(value);
    setPromptConfig(null);
  };

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const [u, f, a, shop] = await Promise.all([
      getAllUsers(100),
      getFeedbackList(),
      getAllAnnouncements(),
      getShopItems(true),
    ]);
    setUsers(u);
    setFeedback(f);
    setAnnouncements(a);
    setShopItems(shop);
    setLoading(false);
  }, []);

  const handleMigration = async () => {
    if (
      !(await showConfirm(
        'WARNING: This will migrate ALL users to lowercase usernames. This is destructive. Are you sure?',
        'Start Migration'
      ))
    )
      return;

    setMigrationStatus('Starting migration...');
    try {
      const { collection, getDocs, doc, writeBatch } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      let migrated = 0;
      let count = 0;
      let batch = writeBatch(db);
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
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) await batch.commit();

      setMigrationStatus(`Migration complete. Migrated ${migrated} users.`);
      fetchData(); // Refresh list
    } catch (e) {
      console.error(e);
      setMigrationStatus(`Error: ${e.message}`);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateUser = async e => {
    e.preventDefault();
    if (!editingUser) return;

    // Convert numeric fields
    const updates = {
      ...editingUser,
      giuros: Number(editingUser.giuros),
      gamesPlayed: Number(editingUser.gamesPlayed),
      bestScore: Number(editingUser.bestScore),
      purchasedCosmetics: editingUser.purchasedCosmetics || [],
    };

    // Check if username changed (requires migration)
    if (editingUser.username !== editingUser.id) {
      if (
        !(await showConfirm(
          `Changing username from "${editingUser.id}" to "${editingUser.username}" will migrate all data. Continue?`,
          'Confirm Migration'
        ))
      )
        return;

      try {
        const { migrateUser } = await import('../utils/social');
        await migrateUser(editingUser.id, editingUser.username);
        // After migration, the old doc is deleted (tombstoned) and new one created.
        // We should then update the *new* doc with any other field changes if needed.
        // But migrateUser copies old data. So we should apply our form updates to the NEW user.
        await updateUserAsAdmin(editingUser.username, updates);
      } catch (e) {
        console.error(e);
        // eslint-disable-next-line no-alert
        alert(`Migration failed: ${e.message}`);
        return;
      }
    } else {
      // Just update existing
      await updateUserAsAdmin(editingUser.id, updates);
    }

    setEditingUser(null);
    fetchData(); // Refresh
  };

  return (
    <div
      className={`min-h-screen flex pt-16 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Sidebar */}
      <div
        className={`w-64 p-6 border-r flex flex-col ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}
      >
        <h1 className="text-2xl font-black mb-8 text-sky-500">Girify Admin</h1>
        <nav className="flex flex-col gap-2">
          {['dashboard', 'users', 'shop', 'feedback', 'announcements', 'analytics', 'giuros'].map(
            tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            )
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        ) : (
          <div className="max-w-5xl w-full mx-auto">
            {/* GIUROS ECONOMICS */}
            {activeTab === 'giuros' && (
              <AdminGiuros users={users} shopItems={shopItems} theme={theme} />
            )}

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 max-w-7xl mx-auto">
                <h2 className="text-3xl font-black">Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <MetricCard title="Total Users" value={users.length} color="text-sky-500" />
                  <MetricCard
                    title="New This Week"
                    value={
                      users.filter(u => {
                        if (!u.joinedAt) return false;
                        const joined = u.joinedAt.toDate
                          ? u.joinedAt.toDate()
                          : new Date(u.joinedAt.seconds * 1000);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return joined > weekAgo;
                      }).length
                    }
                    color="text-emerald-500"
                  />
                  <MetricCard
                    title="Total Games"
                    value={users.reduce((acc, u) => acc + (u.gamesPlayed || 0), 0)}
                    color="text-purple-500"
                  />
                  <MetricCard
                    title="Avg Best Score"
                    value={
                      users.length > 0
                        ? Math.round(
                            users.reduce((acc, u) => acc + (u.bestScore || 0), 0) / users.length
                          )
                        : 0
                    }
                    color="text-amber-500"
                  />
                  <MetricCard
                    title="Total Giuros"
                    value={users.reduce((acc, u) => acc + (u.giuros || 0), 0).toLocaleString()}
                    color="text-yellow-500"
                  />
                  <MetricCard title="Feedback" value={feedback.length} color="text-rose-500" />
                </div>

                {/* Data Tools */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-xl font-bold mb-4">Data Tools</h3>
                  <div className="space-y-4">
                    {/* Lowercase Migration */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleMigration}
                        className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shadow-lg shadow-rose-500/20"
                      >
                        ⚠️ Fix Usernames (Lowercase Migration)
                      </button>
                      {migrationStatus && (
                        <span className="font-mono text-sm opacity-70 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded">
                          {migrationStatus}
                        </span>
                      )}
                    </div>

                    {/* Leaderboard Deduplication */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={async () => {
                          if (
                            !(await showConfirm(
                              'This will remove duplicate scores, keeping only the best per user. Continue?',
                              'Deduplicate Leaderboard'
                            ))
                          )
                            return;
                          setMigrationStatus('Deduplicating leaderboard...');
                          try {
                            const { collection, getDocs, deleteDoc, query, orderBy } =
                              await import('firebase/firestore');
                            const { db } = await import('../firebase');

                            // Process highscores collection
                            const highscoresRef = collection(db, 'highscores');
                            const snap = await getDocs(
                              query(highscoresRef, orderBy('score', 'desc'))
                            );

                            const seenUsers = new Map(); // username -> best doc id
                            const toDelete = [];

                            snap.docs.forEach(doc => {
                              const data = doc.data();
                              const username = (data.username || '').toLowerCase();
                              if (!username) return;

                              if (!seenUsers.has(username)) {
                                // First occurrence (best score due to ordering)
                                seenUsers.set(username, doc.id);
                              } else {
                                // Duplicate - mark for deletion
                                toDelete.push(doc.ref);
                              }
                            });

                            // Delete duplicates
                            for (const ref of toDelete) {
                              await deleteDoc(ref);
                            }

                            setMigrationStatus(
                              `Deduplication complete! Removed ${toDelete.length} duplicate entries.`
                            );
                          } catch (e) {
                            console.error(e);
                            setMigrationStatus(`Error: ${e.message}`);
                          }
                        }}
                        className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-lg shadow-amber-500/20"
                      >
                        🧹 Deduplicate Leaderboard
                      </button>
                    </div>

                    {/* Username Format Migration (First Name + 4 digits) */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={async () => {
                          if (
                            !(await showConfirm(
                              'This will update usernames to use only first name + 4 digits. Users with >4 digit suffixes or full names will be migrated. Continue?',
                              'Migrate Usernames'
                            ))
                          )
                            return;
                          setMigrationStatus('Migrating username formats...');
                          try {
                            const { collection, getDocs, doc, writeBatch } =
                              await import('firebase/firestore');
                            const { db } = await import('../firebase');

                            const usersRef = collection(db, 'users');
                            const snapshot = await getDocs(usersRef);
                            let migrated = 0;
                            let count = 0;
                            let batch = writeBatch(db);
                            const batchSize = 200;

                            // Pattern: @FirstName1234 (letters only + 4 digits to avoid ambiguity)
                            // We explicitly disallow digits in the name part to prevent "User12345" passing as "User1"+2345
                            const validPattern = /^@[a-zA-Z]+\d{4}$/;

                            for (const userDoc of snapshot.docs) {
                              const oldId = userDoc.id;
                              const data = userDoc.data();

                              // Skip if truly valid format and reasonable length
                              if (validPattern.test(oldId) && oldId.length <= 20) continue;

                              // Extract name part (remove @ and ALL digits at end)
                              let namePart = oldId.replace(/^@/, '').split(/\d/)[0];

                              // Clean to letters only and TRUNCATE to 10 chars
                              namePart = namePart.replace(/[^a-zA-Z]/g, '').slice(0, 10);

                              if (!namePart || namePart.length < 2) {
                                namePart = 'User';
                              }

                              // Generate new 4-digit suffix
                              const newSuffix = Math.floor(1000 + Math.random() * 9000);
                              const newId = `@${namePart}${newSuffix}`;

                              // Check if new ID already exists (skip if conflict)
                              // For simplicity, we'll just set with merge
                              const targetRef = doc(db, 'users', newId);
                              batch.set(
                                targetRef,
                                { ...data, username: newId, migratedFrom: oldId },
                                { merge: true }
                              );
                              batch.delete(userDoc.ref);

                              migrated++;
                              count++;

                              if (count >= batchSize) {
                                await batch.commit();
                                batch = writeBatch(db);
                                count = 0;
                              }
                            }

                            if (count > 0) await batch.commit();

                            setMigrationStatus(
                              `Username migration complete! Migrated ${migrated} users to new format.`
                            );
                            fetchData();
                          } catch (e) {
                            console.error(e);
                            setMigrationStatus(`Error: ${e.message}`);
                          }
                        }}
                        className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-all shadow-lg shadow-purple-500/20"
                      >
                        📝 Fix Username Format (FirstName + 4 digits)
                      </button>
                    </div>

                    {/* Prune Orphans */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={async () => {
                          if (
                            !(await showConfirm(
                              'This will delete all scores/highscores that do not belong to an active user. Cannot be undone. Continue?',
                              'Prune Orphans'
                            ))
                          )
                            return;
                          setMigrationStatus('Pruning orphans...');
                          try {
                            const { collection, getDocs, writeBatch } =
                              await import('firebase/firestore');
                            const { db } = await import('../firebase');

                            // 1. Get ALL valid users
                            const usersSnap = await getDocs(collection(db, 'users'));
                            // Store valid usernames (without @ prefix to match score format)
                            const validUsernames = new Set();
                            usersSnap.forEach(doc => {
                              // Valid User ID: "@Roberto..." or "Roberto..."
                              // Score Username: "Roberto..."
                              const cleanId = doc.id.replace(/^@/, '').toLowerCase();
                              validUsernames.add(cleanId);
                            });

                            let deletedCount = 0;
                            let batch = writeBatch(db);
                            let opCount = 0;
                            const batchSize = 400;

                            const flushBatch = async () => {
                              if (opCount > 0) {
                                await batch.commit();
                                batch = writeBatch(db);
                                opCount = 0;
                              }
                            };

                            // 2. Scan & Prune 'scores'
                            const scoresRef = collection(db, 'scores');
                            const scoresSnap = await getDocs(scoresRef);

                            for (const doc of scoresSnap.docs) {
                              const data = doc.data();
                              const u = (data.username || '').toLowerCase();
                              if (!u || !validUsernames.has(u)) {
                                batch.delete(doc.ref);
                                deletedCount++;
                                opCount++;
                                if (opCount >= batchSize) await flushBatch();
                              }
                            }

                            // 3. Scan & Prune 'highscores'
                            const highscoresRef = collection(db, 'highscores');
                            const hsSnap = await getDocs(highscoresRef);

                            for (const doc of hsSnap.docs) {
                              // Highscore ID is usually the username (sanitized)
                              // or data.username
                              const data = doc.data();
                              const u = (data.username || doc.id).toLowerCase().replace(/^@/, '');

                              // Check against valid set
                              // Note: highscore IDs might have _ instead of / etc.
                              // Best to check if we can map it.
                              // Simplest check: if data.username is present, verify that.

                              if (!u || !validUsernames.has(u)) {
                                batch.delete(doc.ref);
                                deletedCount++;
                                opCount++;
                                if (opCount >= batchSize) await flushBatch();
                              }
                            }

                            await flushBatch();

                            setMigrationStatus(
                              `Prune complete! Deleted ${deletedCount} orphan records.`
                            );
                          } catch (e) {
                            console.error(e);
                            setMigrationStatus(`Error: ${e.message}`);
                          }
                        }}
                        className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/20"
                      >
                        🗑️ Prune Orphans (Ghost Records)
                      </button>
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
                          key={user.id}
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
                              onClick={() =>
                                window.open(`/user/${encodeURIComponent(user.username)}`, '_blank')
                              }
                              className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-lg text-xs font-bold hover:bg-sky-500 hover:text-white transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  !(await showConfirm(
                                    `Delete user "${user.username}"? This cannot be undone.`,
                                    'Delete User'
                                  ))
                                )
                                  return;
                                try {
                                  const { deleteUserAndData } = await import('../utils/social');
                                  const result = await deleteUserAndData(user.username);

                                  if (result.success) {
                                    // eslint-disable-next-line no-alert
                                    alert(
                                      `Deleted user ${user.username} and ${result.count} score records.`
                                    );
                                    fetchData();
                                  } else {
                                    alert(`Error deleting user: ${result.error}`); // eslint-disable-line no-alert
                                  }
                                } catch (e) {
                                  console.error(e);
                                  alert(`Error deleting user: ${e.message}`); // eslint-disable-line no-alert
                                }
                              }}
                              className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FEEDBACK */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black">Feedback Inbox</h2>
                <div className="space-y-4">
                  {feedback.length === 0 && <p className="opacity-50">No feedback yet.</p>}
                  {feedback.map(item => {
                    const handleApproveFeedback = async () => {
                      const amountStr = await showPrompt(
                        'Enter Giuros reward amount:',
                        '50',
                        'Approve Feedback'
                      );
                      if (amountStr === null) return; // Cancelled
                      const amount = parseInt(amountStr, 10);
                      if (isNaN(amount) || amount < 0) {
                        // eslint-disable-next-line no-alert
                        alert('Invalid amount. Please enter a positive number.');
                        return;
                      }

                      const { approveFeedback } = await import('../utils/social');
                      const result = await approveFeedback(item.id, amount);
                      if (result.success) {
                        // eslint-disable-next-line no-alert
                        alert(`Approved! ${result.username} received ${result.reward} Giuros.`);
                        fetchData(); // Refresh
                      } else {
                        // eslint-disable-next-line no-alert
                        alert(`Error: ${result.error}`);
                      }
                    };

                    const handleRejectFeedback = async () => {
                      const { rejectFeedback } = await import('../utils/social');
                      const result = await rejectFeedback(item.id);
                      if (result.success) {
                        fetchData(); // Refresh
                      } else {
                        // eslint-disable-next-line no-alert
                        alert(`Error: ${result.error}`);
                      }
                    };

                    const handleDeleteFeedback = async () => {
                      if (
                        !(await showConfirm(
                          'Are you sure you want to DELETE this feedback? This cannot be undone.',
                          'Delete Feedback'
                        ))
                      )
                        return;

                      const { deleteFeedback } = await import('../utils/social');
                      const result = await deleteFeedback(item.id);
                      if (result.success) {
                        fetchData(); // Refresh
                      } else {
                        // eslint-disable-next-line no-alert
                        alert(`Error: ${result.error}`);
                      }
                    };

                    return (
                      <div
                        key={item.id}
                        className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-bold text-sky-500">@{item.username}</span>
                            <span className="text-xs opacity-50 ml-3">
                              {item.createdAt?.toDate
                                ? item.createdAt.toDate().toLocaleDateString()
                                : 'Unknown date'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                item.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-600'
                                  : item.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-600'
                                    : 'bg-red-500/20 text-red-600'
                              }`}
                            >
                              {item.status}
                            </span>
                            <button
                              onClick={handleDeleteFeedback}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white transition-colors text-xs opacity-50 hover:opacity-100"
                              title="Delete Feedback"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p className="opacity-80 leading-relaxed mb-4">{item.text}</p>

                        {item.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={handleApproveFeedback}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                              ✓ Approve & Award...
                            </button>
                            <button
                              onClick={handleRejectFeedback}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                        {item.status === 'approved' && item.reward && (
                          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                            ✓ Awarded {item.reward} Giuros
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black">Announcements</h2>

                {/* Create New */}
                <div
                  className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                >
                  <h3 className="text-xl font-bold mb-4">Create New Announcement</h3>
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      const result = await createAnnouncement(newAnnouncement);
                      if (result.success) {
                        setNewAnnouncement({
                          title: '',
                          body: '',
                          publishDate: '',
                          expiryDate: '',
                          priority: 'normal',
                          targetAudience: 'all',
                          isActive: true,
                        });
                        fetchData();
                      } else {
                        // eslint-disable-next-line no-alert
                        alert(`Error: ${result.error}`);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="ann-title"
                          className="text-xs uppercase font-bold opacity-50 block mb-1"
                        >
                          Title
                        </label>
                        <input
                          id="ann-title"
                          type="text"
                          value={newAnnouncement.title}
                          onChange={e =>
                            setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                          }
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="ann-priority"
                          className="text-xs uppercase font-bold opacity-50 block mb-1"
                        >
                          Priority
                        </label>
                        <select
                          id="ann-priority"
                          value={newAnnouncement.priority || 'normal'}
                          onChange={e =>
                            setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })
                          }
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="ann-target"
                        className="text-xs uppercase font-bold opacity-50 block mb-1"
                      >
                        Target Audience
                      </label>
                      <select
                        id="ann-target"
                        value={newAnnouncement.targetAudience || 'all'}
                        onChange={e =>
                          setNewAnnouncement({
                            ...newAnnouncement,
                            targetAudience: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-4"
                      >
                        <option value="all">All Users</option>
                        <option value="new_users">New Users (Last 7 Days)</option>
                        <option value="returning">Returning Users</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="ann-body"
                        className="text-xs uppercase font-bold opacity-50 block mb-1"
                      >
                        Body (HTML/text supported)
                      </label>
                      <textarea
                        id="ann-body"
                        value={newAnnouncement.body}
                        onChange={e =>
                          setNewAnnouncement({ ...newAnnouncement, body: e.target.value })
                        }
                        rows={4}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="ann-pub"
                          className="text-xs uppercase font-bold opacity-50 block mb-1"
                        >
                          Publish Date
                        </label>
                        <input
                          id="ann-pub"
                          type="datetime-local"
                          value={newAnnouncement.publishDate}
                          onChange={e =>
                            setNewAnnouncement({ ...newAnnouncement, publishDate: e.target.value })
                          }
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="ann-exp"
                          className="text-xs uppercase font-bold opacity-50 block mb-1"
                        >
                          Expiry Date (Optional)
                        </label>
                        <input
                          id="ann-exp"
                          type="datetime-local"
                          value={newAnnouncement.expiryDate}
                          onChange={e =>
                            setNewAnnouncement({ ...newAnnouncement, expiryDate: e.target.value })
                          }
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 p-3 w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newAnnouncement.isActive !== false}
                            onChange={e =>
                              setNewAnnouncement({ ...newAnnouncement, isActive: e.target.checked })
                            }
                            className="w-5 h-5 rounded text-sky-500"
                          />
                          <span className="font-bold">Active</span>
                        </label>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20"
                    >
                      Create Announcement
                    </button>
                  </form>
                </div>

                {/* Existing Announcements */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">
                    Existing Announcements ({announcements.length})
                  </h3>
                  {announcements.length === 0 && (
                    <p className="opacity-50">No announcements yet.</p>
                  )}
                  {announcements.map(ann => {
                    const publishDate = ann.publishDate?.toDate
                      ? ann.publishDate.toDate().toLocaleString()
                      : 'Unknown';
                    const expiryDate = ann.expiryDate?.toDate
                      ? ann.expiryDate.toDate().toLocaleString()
                      : 'Never';
                    const isActive =
                      (!ann.publishDate || ann.publishDate.toDate() <= new Date()) &&
                      (!ann.expiryDate || ann.expiryDate.toDate() > new Date());

                    return (
                      <div
                        key={ann.id}
                        className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-lg flex items-center gap-2">
                              {ann.title}
                              <span
                                className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                                  ann.priority === 'urgent'
                                    ? 'bg-red-500 text-white'
                                    : ann.priority === 'high'
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {ann.priority || 'normal'}
                              </span>
                              {!isActive && (
                                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-500 text-white">
                                  Inactive
                                </span>
                              )}
                            </h4>
                            <p className="text-xs opacity-50">
                              {ann.targetAudience && ann.targetAudience !== 'all' && (
                                <span className="mr-2 font-bold text-sky-500 uppercase">
                                  [{ann.targetAudience}]
                                </span>
                              )}
                              Publish: {publishDate} | Expires: {expiryDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-500/20 text-slate-500'}`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={async () => {
                                if (
                                  await showConfirm(
                                    `Delete announcement "${ann.title}"?`,
                                    'Delete Announcement'
                                  )
                                ) {
                                  await deleteAnnouncement(ann.id);
                                  fetchData();
                                }
                              }}
                              className="p-1 rounded hover:bg-red-500 hover:text-white transition-colors"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p className="text-sm opacity-70 line-clamp-2">
                          {ann.body.substring(0, 150)}...
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SHOP */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          <h2 className="text-3xl font-black">Shop Management</h2>
          {/* Add/Edit Form */}
          <div
            className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            <h3 className="text-xl font-bold mb-4">Add / Update Item</h3>
            <form
              onSubmit={async e => {
                e.preventDefault();
                let res;
                if (newShopItem.id && shopItems.all.some(i => i.id === newShopItem.id)) {
                  res = await updateShopItem(newShopItem.id, newShopItem);
                } else {
                  res = await createShopItem(newShopItem);
                }
                if (res.success) {
                  // eslint-disable-next-line no-alert
                  alert('Item saved successfully!');
                  setNewShopItem({
                    id: '',
                    name: '',
                    type: 'title',
                    cost: 100,
                    emoji: '',
                    flavorText: '',
                    description: '',
                    cssClass: '',
                  });
                  fetchData();
                } else {
                  // eslint-disable-next-line no-alert
                  alert('Error: ' + res.error);
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shop-id"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    ID (leave empty to auto-gen)
                  </label>
                  <input
                    id="shop-id"
                    value={newShopItem.id}
                    onChange={e => setNewShopItem({ ...newShopItem, id: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    placeholder="e.g. frame_gold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="shop-type"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    Type
                  </label>
                  <select
                    id="shop-type"
                    value={newShopItem.type}
                    onChange={e => setNewShopItem({ ...newShopItem, type: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="frame">Frame</option>
                    <option value="title">Title</option>
                    <option value="special">Special</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shop-name"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    Name
                  </label>
                  <input
                    id="shop-name"
                    value={newShopItem.name}
                    onChange={e => setNewShopItem({ ...newShopItem, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="shop-cost"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    Cost
                  </label>
                  <input
                    id="shop-cost"
                    type="number"
                    value={newShopItem.cost}
                    onChange={e =>
                      setNewShopItem({ ...newShopItem, cost: parseInt(e.target.value) })
                    }
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
              </div>
              {newShopItem.type === 'title' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="shop-emoji"
                      className="text-xs uppercase font-bold opacity-50 block mb-1"
                    >
                      Prefix / Emoji
                    </label>
                    <input
                      id="shop-emoji"
                      value={newShopItem.emoji || newShopItem.prefix || ''}
                      onChange={e =>
                        setNewShopItem({
                          ...newShopItem,
                          emoji: e.target.value,
                          prefix: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="shop-flavor"
                      className="text-xs uppercase font-bold opacity-50 block mb-1"
                    >
                      Flavor Text
                    </label>
                    <input
                      id="shop-flavor"
                      value={newShopItem.flavorText || ''}
                      onChange={e => setNewShopItem({ ...newShopItem, flavorText: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              )}
              {newShopItem.type === 'frame' && (
                <div>
                  <label
                    htmlFor="shop-css"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    CSS Class (Tailwind)
                  </label>
                  <input
                    id="shop-css"
                    value={newShopItem.cssClass || ''}
                    onChange={e => setNewShopItem({ ...newShopItem, cssClass: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    placeholder="ring-4 ring-yellow-500..."
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor="shop-desc"
                  className="text-xs uppercase font-bold opacity-50 block mb-1"
                >
                  Description
                </label>
                <textarea
                  id="shop-desc"
                  value={newShopItem.description || ''}
                  onChange={e => setNewShopItem({ ...newShopItem, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg"
              >
                Save / Create Item
              </button>
            </form>
          </div>

          {/* Shop Items Table */}
          <div
            className={`rounded-2xl overflow-hidden border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}
          >
            <table className="w-full text-left">
              <thead className={theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}>
                <tr>
                  <th className="p-4 text-xs uppercase opacity-50">Preview</th>
                  <th className="p-4 text-xs uppercase opacity-50">ID</th>
                  <th className="p-4 text-xs uppercase opacity-50">Type</th>
                  <th className="p-4 text-xs uppercase opacity-50">Name</th>
                  <th className="p-4 text-xs uppercase opacity-50">Cost</th>
                  <th className="p-4 text-xs uppercase opacity-50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {(shopItems.all || [])
                  .sort((a, b) => a.type.localeCompare(b.type) || a.cost - b.cost)
                  .map(item => (
                    <tr
                      key={item.id}
                      className={theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}
                    >
                      <td className="p-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          {item.emoji ||
                            item.prefix ||
                            (item.cssClass ? (
                              <div className={`w-4 h-4 rounded-full ${item.cssClass}`} />
                            ) : (
                              '🛍️'
                            ))}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono opacity-60">{item.id}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            item.type === 'title'
                              ? 'bg-purple-500/10 text-purple-500'
                              : item.type === 'frame'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-sky-500/10 text-sky-500'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 font-mono font-bold text-yellow-500">{item.cost} 🪙</td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => setNewShopItem(item)}
                          className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-lg text-xs font-bold hover:bg-sky-500 hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (
                              await showConfirm('Delete ' + item.name + '?', 'Delete Shop Item')
                            ) {
                              await deleteShopItem(item.id);
                              fetchData();
                            }
                          }}
                          className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                {(!shopItems.all || shopItems.all.length === 0) && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center opacity-50">
                      No items found. Add one above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <h2 className="text-3xl font-black">Analytics</h2>

          {/* Daily Users */}
          <div
            className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            <h3 className="text-xl font-bold mb-4">Daily New Users (Last 7 Days)</h3>
            <div className="h-64 flex items-end gap-2">
              {/* Simple Bar Chart Calculation */}
              {(() => {
                const last7Days = [...Array(7)]
                  .map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                  })
                  .reverse();

                const counts = last7Days.map(dateStr => {
                  return users.filter(u => {
                    if (!u.joinedAt) return false;
                    const d = u.joinedAt.toDate
                      ? u.joinedAt.toDate()
                      : new Date(u.joinedAt.seconds * 1000);
                    return d.toISOString().split('T')[0] === dateStr;
                  }).length;
                });

                const max = Math.max(...counts, 1);

                return last7Days.map((date, i) => (
                  <div key={date} className="flex-1 flex flex-col justify-end items-center group">
                    <div className="mb-2 font-bold text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {counts[i]}
                    </div>
                    <div
                      style={{ height: `${(counts[i] / max) * 100}%` }}
                      className="w-full bg-sky-500/50 rounded-t-lg hover:bg-sky-500 transition-colors relative min-h-[4px]"
                    ></div>
                    <div className="mt-2 text-xs opacity-50 rotate-45 origin-left translate-y-2">
                      {date.slice(5)}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Upcoming Quizzes */}
          <div
            className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            <h3 className="text-xl font-bold mb-4">Upcoming Quizzes (Content Plan)</h3>
            <div className="space-y-2 overflow-y-auto max-h-96">
              {Object.entries(quizPlan)
                .sort()
                .map(([date, data]) => (
                  <div
                    key={date}
                    className={`p-3 rounded-xl border flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="font-mono text-sm opacity-70">{date}</div>
                    <div className="font-bold">{data.topic || 'Unknown Topic'}</div>
                    <div className="text-xs opacity-50">{data.streets?.length || 0} streets</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

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
                      Username (Edit to Migrate)
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
                    htmlFor="edit-realname"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    Real Name
                  </label>
                  <input
                    id="edit-realname"
                    value={editingUser.realName || ''}
                    onChange={e => setEditingUser({ ...editingUser, realName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
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
                    onChange={e => setEditingUser({ ...editingUser, giuros: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="edit-gamesplayed"
                      className="text-xs uppercase font-bold opacity-50 block mb-1"
                    >
                      Games Played
                    </label>
                    <input
                      id="edit-gamesplayed"
                      type="number"
                      value={editingUser.gamesPlayed}
                      onChange={e =>
                        setEditingUser({ ...editingUser, gamesPlayed: e.target.value })
                      }
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-bestscore"
                      className="text-xs uppercase font-bold opacity-50 block mb-1"
                    >
                      Best Score
                    </label>
                    <input
                      id="edit-bestscore"
                      type="number"
                      value={editingUser.bestScore}
                      onChange={e => setEditingUser({ ...editingUser, bestScore: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Badge Management */}
                <div>
                  <label
                    htmlFor="badge-list"
                    className="text-xs uppercase font-bold opacity-50 block mb-2"
                  >
                    Badges (click to remove)
                  </label>
                  <div
                    id="badge-list"
                    role="group"
                    aria-label="Current badges"
                    className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    {(editingUser.purchasedCosmetics || [])
                      .filter(id => id.startsWith('badge_'))
                      .map(badgeId => {
                        const badge = ACHIEVEMENT_BADGES.find(b => b.id === badgeId);
                        return (
                          <button
                            key={badgeId}
                            type="button"
                            onClick={() => {
                              const newCosmetics = (editingUser.purchasedCosmetics || []).filter(
                                id => id !== badgeId
                              );
                              setEditingUser({ ...editingUser, purchasedCosmetics: newCosmetics });
                            }}
                            className="px-3 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1"
                            title={`Remove ${badge?.name || badgeId}`}
                          >
                            <span>{badge?.emoji || '🏅'}</span>
                            <span>{badge?.name || badgeId}</span>
                            <span className="ml-1 opacity-50">×</span>
                          </button>
                        );
                      })}
                    {!(editingUser.purchasedCosmetics || []).some(id =>
                      id.startsWith('badge_')
                    ) && <span className="text-sm opacity-50 italic">No badges</span>}
                  </div>

                  <label
                    htmlFor="add-badge-select"
                    className="text-xs uppercase font-bold opacity-50 block mb-2"
                  >
                    Add Badge
                  </label>
                  <select
                    id="add-badge-select"
                    onChange={e => {
                      const badgeId = e.target.value;
                      if (!badgeId) return;
                      const current = editingUser.purchasedCosmetics || [];
                      if (!current.includes(badgeId)) {
                        setEditingUser({
                          ...editingUser,
                          purchasedCosmetics: [...current, badgeId],
                        });
                      }
                      e.target.value = ''; // Reset dropdown
                    }}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    defaultValue=""
                  >
                    <option value="">Select a badge to add...</option>
                    {/* Dynamic Shop Badges */}
                    {(shopItems.all || [])
                      .filter(
                        item =>
                          item.id.startsWith('badge_') &&
                          !(editingUser.purchasedCosmetics || []).includes(item.id)
                      )
                      .map(badge => (
                        <option key={badge.id} value={badge.id}>
                          {badge.emoji} {badge.name} ({badge.cost} Giuros)
                        </option>
                      ))}
                    {/* Static Merit Badges */}
                    {ACHIEVEMENT_BADGES.filter(
                      b =>
                        b.type === 'merit' && !(editingUser.purchasedCosmetics || []).includes(b.id)
                    ).map(badge => (
                      <option key={badge.id} value={badge.id}>
                        {badge.emoji} {badge.name} (Merit)
                      </option>
                    ))}
                  </select>
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

        {/* Confirmation Modal */}
        {confirmConfig && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              <h3 className="text-xl font-black mb-2">{confirmConfig.title}</h3>
              <p className="opacity-70 mb-6">{confirmConfig.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleConfirmAction(false)}
                  className="flex-1 py-3 font-bold opacity-60 hover:opacity-100 bg-slate-100 dark:bg-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmAction(true)}
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Prompt Modal */}
        {promptConfig && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              <h3 className="text-xl font-black mb-4">{promptConfig.title}</h3>
              <p className="opacity-70 mb-4 text-sm">{promptConfig.message}</p>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handlePromptAction(e.target.elements.promptInput.value);
                }}
              >
                <input
                  name="promptInput"
                  autoFocus
                  defaultValue={promptConfig.defaultValue}
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-6"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handlePromptAction(null)}
                    className="flex-1 py-3 font-bold opacity-60 hover:opacity-100 bg-slate-100 dark:bg-slate-900 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
