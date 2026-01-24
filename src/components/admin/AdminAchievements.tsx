import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useAdminAchievements } from '../../features/admin/hooks/useAdminAchievements';
import FormInput from '../FormInput';
import AchievementEditor from './AchievementEditor';

interface AdminAchievementsProps {
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
  confirm: (msg: string, title?: string, isDanger?: boolean) => Promise<boolean>;
}

const AdminAchievements: React.FC<AdminAchievementsProps> = ({ onNotify, confirm }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    items: achievements,
    editingItem,
    isCreating,
    loading,
    handleCreate,
    handleUpdate,
    handleDelete,
    startEdit,
    startCreate,
    cancelEdit,
    loadInitial,
  } = useAdminAchievements({ notify: onNotify, confirm });

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

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
          onClick={startCreate}
          className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-transform hover:scale-105 shadow-lg shadow-emerald-500/20"
        >
          + New Achievement
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <FormInput
          placeholder="Search achievements..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          containerClassName="w-full mb-0"
          className="bg-white dark:bg-slate-800"
        />
        <button
          onClick={() => loadInitial()}
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
                  onClick={() => startEdit(item)}
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

      <AnimatePresence>
        {(editingItem || isCreating) && (
          <AchievementEditor
            initialItem={
              editingItem || {
                id: '',
                name: '',
                description: '',
                category: 'starter',
                type: 'merit',
                image: '',
                emoji: '🏆',
              }
            }
            existingAchievements={achievements}
            onSave={item => {
              // Logic: if item exists in list, update, else create.
              // We should rely on ID presence check.
              if (item.id && achievements.some(a => a.id === item.id)) {
                handleUpdate(item.id, item);
              } else {
                handleCreate(item);
              }
            }}
            onCancel={cancelEdit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAchievements;
