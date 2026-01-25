import { motion } from 'framer-motion';
import React, { useCallback, useEffect } from 'react';
import { useAdminCRUD } from '../../hooks/useAdminCRUD';
import { createQuest, deleteQuest, getQuests, Quest, updateQuest } from '../../utils/game/quests';
import QuestEditor from './QuestEditor';

interface AdminContentProps {
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
  confirm: (msg: string, title?: string, isDanger?: boolean) => Promise<boolean>;
}

const AdminContent: React.FC<AdminContentProps> = ({ onNotify, confirm }) => {
  const {
    items: quests,
    setItems: setQuests,
    editingItem,
    loading,
    handleCreate,
    handleUpdate,
    handleDelete: hookHandleDelete,
    startEdit,
    setEditingItem,
  } = useAdminCRUD<Quest>({
    createFn: createQuest,
    updateFn: updateQuest,
    deleteFn: deleteQuest,
    notify: onNotify,
    confirm,
  });

  const fetchQuests = useCallback(async () => {
    const data = await getQuests();
    setQuests(data);
  }, [setQuests]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const handleCreateOrUpdate = async (questData: Partial<Quest>) => {
    if (!questData.title || !questData.description || !questData.criteriaValue) {
      onNotify('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (editingItem) {
        await handleUpdate(editingItem.id!, questData);
      } else {
        await handleCreate(questData);
      }
      fetchQuests();
    } catch {
      // handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    await hookHandleDelete(id);
    fetchQuests();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Content Studio</h2>
          <p className="text-sm opacity-60">Create Daily Quests & Challenges.</p>
        </div>
        <button onClick={fetchQuests} className="text-sky-500 hover:text-sky-600 font-bold text-sm">
          Refresh List
        </button>
      </div>

      <QuestEditor
        initialQuest={editingItem}
        onSave={handleCreateOrUpdate}
        onCancel={() => setEditingItem(null)}
      />

      <div className={`space-y-4 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        {quests.map(quest => (
          <motion.div
            key={quest.id}
            layout
            className={`p-4 rounded-xl border flex justify-between items-center transition-colors ${
              quest.isActive
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    quest.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {quest.isActive ? 'Active' : 'Inactive'}
                </span>
                {quest.activeDate && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    📅 {quest.activeDate}
                  </span>
                )}
                <h4 className="font-bold flex items-center gap-2">
                  {quest.title}
                  <span className="text-amber-500 text-xs">+{quest.rewardGiuros} G</span>
                </h4>
              </div>
              <p className="text-sm opacity-70 mb-1">{quest.description}</p>
              <div className="text-xs font-mono opacity-40">
                {quest.criteriaType} : {quest.criteriaValue}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  startEdit(quest);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                type="button"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(quest.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                type="button"
              >
                🗑️
              </button>
            </div>
          </motion.div>
        ))}

        {!loading && quests.length === 0 && (
          <div className="text-center py-12 opacity-50">No quests found. Create one above!</div>
        )}
      </div>
    </div>
  );
};

export default AdminContent;
