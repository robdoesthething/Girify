import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { Achievement } from '../../data/achievements';
import {
  createAchievement,
  deleteAchievement,
  getAllAchievements,
  updateAchievement,
} from '../../utils/achievements';

interface AdminAchievementsProps {
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
  confirm: (msg: string, title?: string, isDanger?: boolean) => Promise<boolean>;
}

/* eslint-disable max-lines-per-function */
const AdminAchievements: React.FC<AdminAchievementsProps> = ({ onNotify, confirm }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Achievement> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getAllAchievements(true);
      // Sort by category then name
      const sorted = items.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
      setAchievements(sorted);
    } catch (err) {
      console.error(err);
      onNotify('Failed to fetch achievements', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleSave = async () => {
    if (!editingItem || !editingItem.id || !editingItem.name) {
      onNotify('ID and Name are required', 'error');
      return;
    }

    try {
      const isNew = !achievements.find(a => a.id === editingItem.id);
      let result;

      if (isNew) {
        result = await createAchievement(editingItem as Achievement);
      } else {
        result = await updateAchievement(editingItem.id, editingItem);
      }

      if (result.success) {
        onNotify(`Achievement ${isNew ? 'created' : 'updated'} successfully`, 'success');
        setEditingItem(null);
        fetchAchievements();
      } else {
        onNotify(`Error: ${result.error}`, 'error');
      }
    } catch (e) {
      console.error(e);
      onNotify('Save operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm(
        `Are you sure you want to delete achievement "${id}"? This might break user profiles if they have it equipped/unlocked.`,
        'Delete Achievement',
        true
      ))
    ) {
      return;
    }

    const result = await deleteAchievement(id);
    if (result.success) {
      onNotify('Achievement deleted', 'success');
      fetchAchievements();
    } else {
      onNotify(`Error: ${result.error}`, 'error');
    }
  };

  const filteredItems = achievements.filter(
    a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Achievement Editor</h2>
          <p className="text-sm opacity-60">Manage dynamic achievements and shop items.</p>
        </div>
        <button
          onClick={() =>
            setEditingItem({
              id: '',
              name: '',
              description: '',
              category: 'starter',
              type: 'merit',
              image: '',
              emoji: '🏆',
            })
          }
          className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-transform hover:scale-105 shadow-lg shadow-emerald-500/20"
        >
          + New Achievement
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search achievements..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        <button
          onClick={fetchAchievements}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          🔄
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center opacity-50">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative group"
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-1.5 bg-sky-500 text-white rounded-lg text-xs"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 bg-red-500 text-white rounded-lg text-xs"
                >
                  🗑️
                </button>
              </div>

              <div className="flex items-center gap-4 mb-2">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="w-10 h-10 object-contain rounded-full bg-slate-100"
                  />
                ) : (
                  <span className="text-3xl">{item.emoji}</span>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                    {item.name}
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600">
                    {item.category} / {item.type}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
              <div className="text-[10px] font-mono opacity-50 truncate">ID: {item.id}</div>
              {item.cost && (
                <div className="text-xs font-bold text-yellow-500 mt-1">Cost: {item.cost}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-black mb-4">
                {editingItem.id && achievements.find(a => a.id === editingItem.id)
                  ? 'Edit'
                  : 'Create'}{' '}
                Achievement
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="achieve-id"
                    className="block text-xs font-bold uppercase opacity-50 mb-1"
                  >
                    ID (Unique)
                  </label>
                  <input
                    id="achieve-id"
                    type="text"
                    value={editingItem.id || ''}
                    disabled={!!achievements.find(a => a.id === editingItem.id)}
                    onChange={e => setEditingItem({ ...editingItem, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-mono text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="achieve-name"
                    className="block text-xs font-bold uppercase opacity-50 mb-1"
                  >
                    Name
                  </label>
                  <input
                    id="achieve-name"
                    type="text"
                    value={editingItem.name || ''}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="achieve-desc"
                    className="block text-xs font-bold uppercase opacity-50 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="achieve-desc"
                    rows={2}
                    value={editingItem.description || ''}
                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="achieve-cat"
                      className="block text-xs font-bold uppercase opacity-50 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="achieve-cat"
                      value={editingItem.category || 'starter'}
                      onChange={e =>
                        setEditingItem({ ...editingItem, category: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    >
                      <option value="social">Social</option>
                      <option value="starter">Starter</option>
                      <option value="explorer">Explorer</option>
                      <option value="veteran">Veteran</option>
                      <option value="special">Special</option>
                      <option value="secret">Secret</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="achieve-type"
                      className="block text-xs font-bold uppercase opacity-50 mb-1"
                    >
                      Type
                    </label>
                    <select
                      id="achieve-type"
                      value={editingItem.type || 'merit'}
                      onChange={e =>
                        setEditingItem({ ...editingItem, type: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    >
                      <option value="merit">Merit (Unlockable)</option>
                      <option value="shop">Shop Item</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="achieve-image"
                      className="block text-xs font-bold uppercase opacity-50 mb-1"
                    >
                      Image URL
                    </label>
                    <input
                      id="achieve-image"
                      type="text"
                      value={editingItem.image || ''}
                      onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      placeholder="/badges/file.png"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="achieve-emoji"
                      className="block text-xs font-bold uppercase opacity-50 mb-1"
                    >
                      Emoji (Alt)
                    </label>
                    <input
                      id="achieve-emoji"
                      type="text"
                      value={editingItem.emoji || ''}
                      onChange={e => setEditingItem({ ...editingItem, emoji: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 text-center outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>

                {editingItem.type === 'shop' && (
                  <div>
                    <label
                      htmlFor="achieve-cost"
                      className="block text-xs font-bold uppercase opacity-50 mb-1"
                    >
                      Cost (Giuros)
                    </label>
                    <input
                      id="achieve-cost"
                      type="number"
                      value={editingItem.cost || 0}
                      onChange={e =>
                        setEditingItem({ ...editingItem, cost: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>
                )}

                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-bold uppercase opacity-50 mb-2">
                    Criteria Builder
                  </label>
                  <div className="flex gap-2 mb-2">
                    <select
                      className="flex-1 px-3 py-2 rounded-lg text-xs"
                      onChange={e => {
                        const type = e.target.value;
                        if (type) {
                          const current = (editingItem.criteria || {}) as Record<string, number>;
                          setEditingItem({
                            ...editingItem,
                            criteria: { ...current, [type]: 1 },
                          });
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Add Condition...
                      </option>
                      <option value="minScore">Min Score</option>
                      <option value="totalGames">Total Games</option>
                      <option value="streak">Streak</option>
                      <option value="friends">Friends Count</option>
                      <option value="unlocks">Unlock Count</option>
                      <option value="daysPlayed">Days Played</option>
                    </select>
                  </div>

                  {Object.entries(editingItem.criteria || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded w-24">
                        {key}
                      </span>
                      <input
                        type="number"
                        value={val as number}
                        onChange={e => {
                          setEditingItem({
                            ...editingItem,
                            criteria: {
                              ...(editingItem.criteria as Record<string, number>),
                              [key]: parseInt(e.target.value, 10),
                            },
                          });
                        }}
                        className="w-20 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600"
                      />
                      <button
                        onClick={() => {
                          const newCriteria = {
                            ...(editingItem.criteria as Record<string, number>),
                          };
                          delete newCriteria[key];
                          setEditingItem({ ...editingItem, criteria: newCriteria });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <label
                    htmlFor="achieve-criteria"
                    className="block text-xs font-bold uppercase opacity-50 mb-1 mt-4"
                  >
                    Raw JSON
                  </label>
                  <textarea
                    id="achieve-criteria"
                    rows={3}
                    value={JSON.stringify(editingItem.criteria || {}, null, 2)}
                    onChange={e => {
                      try {
                        const criteria = JSON.parse(e.target.value);
                        setEditingItem({ ...editingItem, criteria });
                      } catch {
                        // ignore invalid json while typing
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-mono text-xs outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                  <p className="text-[10px] opacity-40 mt-1">
                    Careful! Invalid JSON will be ignored.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAchievements;
