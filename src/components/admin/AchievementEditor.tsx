import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Achievement } from '../../data/achievements';

import FormInput from '../FormInput';

interface AchievementEditorProps {
  initialItem: Partial<Achievement>;
  existingAchievements: Achievement[];
  onSave: (item: Partial<Achievement>) => void;
  onCancel: () => void;
}

const AchievementEditor: React.FC<AchievementEditorProps> = ({
  initialItem,
  existingAchievements,
  onSave,
  onCancel,
}) => {
  const [editingItem, setEditingItem] = useState<Partial<Achievement>>(initialItem);

  // Update internal state if prop changes (though usually remounted)
  useEffect(() => {
    setEditingItem(initialItem);
  }, [initialItem]);

  const handleSave = () => {
    onSave(editingItem);
  };

  const isEdit = existingAchievements.find(a => a.id === editingItem.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-black mb-4">{isEdit ? 'Edit' : 'Create'} Achievement</h3>

        <div className="space-y-4">
          <FormInput
            id="achieve-id"
            label="ID (Unique)"
            value={editingItem.id || ''}
            disabled={!!isEdit}
            onChange={e => setEditingItem({ ...editingItem, id: e.target.value })}
            className="font-mono text-sm"
          />

          <FormInput
            id="achieve-name"
            label="Name"
            value={editingItem.name || ''}
            onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
          />

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
                onChange={e => setEditingItem({ ...editingItem, category: e.target.value as any })}
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
                onChange={e => setEditingItem({ ...editingItem, type: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              >
                <option value="merit">Merit (Unlockable)</option>
                <option value="shop">Shop Item</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="achieve-image"
              label="Image URL"
              value={editingItem.image || ''}
              onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
              className="text-xs"
              placeholder="/badges/file.png"
            />
            <FormInput
              id="achieve-emoji"
              label="Emoji (Alt)"
              value={editingItem.emoji || ''}
              onChange={e => setEditingItem({ ...editingItem, emoji: e.target.value })}
              className="text-center"
            />
          </div>

          {editingItem.type === 'shop' && (
            <FormInput
              id="achieve-cost"
              label="Cost (Giuros)"
              type="number"
              value={editingItem.cost || 0}
              onChange={e => setEditingItem({ ...editingItem, cost: Number(e.target.value) })}
            />
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
                  // ignore invalid json
                }
              }}
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-mono text-xs outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onCancel}
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
  );
};

export default AchievementEditor;
