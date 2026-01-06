import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getAllUsers, getFeedbackList, updateUserAsAdmin } from '../utils/social';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

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

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const [u, f] = await Promise.all([getAllUsers(100), getFeedbackList()]);
    setUsers(u);
    setFeedback(f);
    setLoading(false);
  }, []);

  const handleMigration = async () => {
    if (
      !window.confirm(
        // eslint-disable-line no-alert
        'WARNING: This will migrate ALL users to lowercase usernames. This is destructive. Are you sure?'
      )
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
    };

    await updateUserAsAdmin(editingUser.id, updates);
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
          {['dashboard', 'users', 'feedback'].map(tab => (
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
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
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
                            !window.confirm(
                              // eslint-disable-line no-alert
                              'This will remove duplicate scores, keeping only the best per user. Continue?'
                            )
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
                            !window.confirm(
                              // eslint-disable-line no-alert
                              'This will update usernames to use only first name + 4 digits. Users with >4 digit suffixes or full names will be migrated. Continue?'
                            )
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

                            // Pattern: @FirstName1234 (starts with @, then letters/numbers, ends with exactly 4 digits)
                            const validPattern = /^@[a-zA-Z][a-zA-Z0-9]*\d{4}$/;

                            for (const userDoc of snapshot.docs) {
                              const oldId = userDoc.id;
                              const data = userDoc.data();

                              // Skip if already valid format
                              if (validPattern.test(oldId)) continue;

                              // Extract name part (remove @ and digits at end)
                              let namePart = oldId.replace(/^@/, '').replace(/\d+$/, '');
                              // Take only first "word" (split by spaces or special chars)
                              namePart = namePart.split(/[\s_-]/)[0];
                              // Clean to alphanumeric only
                              namePart = namePart.replace(/[^a-zA-Z0-9]/g, '');

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
                          <td className="p-4 text-sm">
                            <div>Games: {user.gamesPlayed || 0}</div>
                            <div>Best: {user.bestScore || 0}</div>
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
                                  !window.confirm(
                                    // eslint-disable-line no-alert
                                    `Delete user "${user.username}"? This cannot be undone.`
                                  )
                                )
                                  return;
                                try {
                                  const { doc, deleteDoc } = await import('firebase/firestore');
                                  const { db } = await import('../firebase');
                                  await deleteDoc(doc(db, 'users', user.id));
                                  fetchData();
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
                      const { approveFeedback } = await import('../utils/social');
                      const result = await approveFeedback(item.id, 50);
                      if (result.success) {
                        alert(`Approved! ${result.username} received ${result.reward} Giuros.`); // eslint-disable-line no-alert
                        fetchData(); // Refresh
                      } else {
                        alert(`Error: ${result.error}`); // eslint-disable-line no-alert
                      }
                    };

                    const handleRejectFeedback = async () => {
                      const { rejectFeedback } = await import('../utils/social');
                      const result = await rejectFeedback(item.id);
                      if (result.success) {
                        fetchData(); // Refresh
                      } else {
                        alert(`Error: ${result.error}`); // eslint-disable-line no-alert
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
                        </div>
                        <p className="opacity-80 leading-relaxed mb-4">{item.text}</p>

                        {item.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={handleApproveFeedback}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                              ✓ Approve & Award 50 🪙
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
                      disabled
                      value={editingUser.username}
                      className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-900 opacity-50 cursor-not-allowed"
                    />
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
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
