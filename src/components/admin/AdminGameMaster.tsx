import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { getUserProfile, updateUserAsAdmin } from '../../utils/social';

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import FormInput from '../FormInput';

interface AdminGameMasterProps {
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
  confirm: (msg: string, title?: string, isDanger?: boolean) => Promise<boolean>;
}

const AdminGameMaster: React.FC<AdminGameMasterProps> = ({ onNotify, confirm }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [newItemId, setNewItemId] = useState('');

  const seedMayorJaume = async () => {
    if (
      !(await confirm(
        'Create/Reset Mayor Jaume profile? This will overwrite the user document.',
        'Seed Identity',
        true
      ))
    ) {
      return;
    }
    try {
      await setDoc(doc(db, 'users', 'mayor_jaume'), {
        username: '@MayorJaume',
        realName: 'Mayor Jaume',
        email: 'mayor@girify.com',
        role: 'user',
        verified: true,
        isSystem: true,
        createdAt: new Date(),
        lastLogin: new Date(),
        banned: false,
        giuros: 9000000,
        totalScore: 1000000,
        gamesPlayed: 1000,
        streak: 999,
        bestScore: 25000,
        purchasedCosmetics: ['title_mayor', 'frame_gold', 'avatar_mayor'],
        equippedCosmetics: {
          titleId: 'title_mayor',
          frameId: 'frame_gold',
          avatarId: 'avatar_mayor',
        },
      });
      onNotify('Mayor Jaume seeded successfully!', 'success');
    } catch (e) {
      console.error(e);
      onNotify('Seeding failed', 'error');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      return;
    }
    setLoading(true);
    setTargetUser(null);
    try {
      // Basic search by exact username for now - in future we could use search index
      // But actually, getUserProfile takes a username.
      const user = await getUserProfile(searchTerm);
      if (user) {
        setTargetUser(user);
      } else {
        onNotify('User not found', 'error');
      }
    } catch (err) {
      console.error(err);
      onNotify('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async () => {
    if (!targetUser) {
      return;
    }
    const isBanning = !targetUser.banned;

    if (
      !(await confirm(
        `Are you sure you want to ${isBanning ? 'BAN' : 'UNBAN'} ${targetUser.username}?`,
        isBanning ? 'Ban User' : 'Unban User',
        isBanning
      ))
    ) {
      return;
    }

    try {
      await updateUserAsAdmin(targetUser.id, { banned: isBanning });
      setTargetUser({ ...targetUser, banned: isBanning });
      onNotify(`User ${isBanning ? 'banned' : 'unbanned'} successfully`, 'success');
    } catch {
      onNotify('Operation failed', 'error');
    }
  };

  const handleAddItem = async () => {
    if (!newItemId || !targetUser) {
      return;
    }
    try {
      const currentItems = (targetUser.purchasedCosmetics as string[]) || [];
      if (currentItems.includes(newItemId)) {
        onNotify('User already has this item', 'info');
        return;
      }
      const updatedItems = [...currentItems, newItemId];
      await updateUserAsAdmin(targetUser.id, { purchasedCosmetics: updatedItems });
      setTargetUser({ ...targetUser, purchasedCosmetics: updatedItems });
      setNewItemId('');
      onNotify(`Added ${newItemId} to inventory`, 'success');
    } catch {
      onNotify('Failed to add item', 'error');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!targetUser) {
      return;
    }
    if (!(await confirm(`Remove ${itemId} from user inventory?`, 'Remove Item', true))) {
      return;
    }

    try {
      const currentItems = (targetUser.purchasedCosmetics as string[]) || [];
      const updatedItems = currentItems.filter((i: string) => i !== itemId);
      await updateUserAsAdmin(targetUser.id, { purchasedCosmetics: updatedItems });
      setTargetUser({ ...targetUser, purchasedCosmetics: updatedItems });
      onNotify(`Removed ${itemId}`, 'success');
    } catch {
      onNotify('Failed to remove item', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Game Master Tools</h2>
          <p className="text-sm opacity-60">User Operations & Support.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={seedMayorJaume}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
          >
            👑 Seed Mayor Jaume
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <FormInput
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
            e.key === 'Enter' && handleSearch()
          }
          placeholder="Search by exact username..."
          aria-label="Search User by Username"
          className="font-bold flex-1"
          containerClassName="flex-1"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20"
        >
          {loading ? 'Searching...' : 'Search User'}
        </button>
      </div>

      {/* USER DETAILS */}
      <AnimatePresence mode="wait">
        {targetUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* PROFILE CARD */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              {targetUser.banned && (
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center text-xs font-bold py-1">
                  ⛔ USER BANNED
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
                <img
                  src={targetUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
                  alt="avatar"
                  className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-indigo-100"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-black">{targetUser.username}</h3>
                  <p className="text-sm opacity-60 font-mono select-all">{targetUser.id}</p>
                  <p className="text-sm opacity-60">{targetUser.email || 'No email linked'}</p>

                  <div className="flex gap-4 mt-4">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg min-w-[80px]">
                      <div className="text-xl font-black text-amber-500">
                        {targetUser.giuros || 0}
                      </div>
                      <div className="text-[10px] uppercase font-bold opacity-50">Giuros</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg min-w-[80px]">
                      <div className="text-xl font-black text-indigo-500">
                        {targetUser.totalScore || 0}
                      </div>
                      <div className="text-[10px] uppercase font-bold opacity-50">Score</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleBanToggle}
                    className={`px-4 py-2 rounded-lg font-bold text-sm ${
                      targetUser.banned
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {targetUser.banned ? '✅ Unban User' : '⛔ Ban User'}
                  </button>
                  <button className="px-4 py-2 rounded-lg font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-not-allowed">
                    📧 Reset Password
                  </button>
                </div>
              </div>
            </div>

            {/* INVENTORY EDITOR */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4">🎒 Inventory Editor</h3>

              <div className="flex gap-2 mb-6">
                <FormInput
                  placeholder="Item ID (e.g. frame_gold)"
                  value={newItemId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewItemId(e.target.value)
                  }
                  aria-label="Item ID to add"
                  className="font-mono text-sm"
                  containerClassName="flex-1"
                />
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600"
                >
                  + Give Item
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(targetUser.purchasedCosmetics || []).map((item: string) => (
                  <div
                    key={item}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 flex items-center gap-2"
                  >
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {item}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500 text-xs"
                      aria-label={`Remove ${item}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {(!targetUser.purchasedCosmetics || targetUser.purchasedCosmetics.length === 0) && (
                  <div className="text-sm opacity-50 italic">User has no items.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGameMaster;
