/* eslint-disable max-lines-per-function */
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { createQuest, deleteQuest, getQuests, Quest, updateQuest } from '../utils/quests';

interface AdminContentProps {
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
  confirm: (msg: string, title?: string, isDanger?: boolean) => Promise<boolean>;
}

const CRITERIA_TYPES = [
  { value: 'find_street', label: 'Find Specific Streets' },
  { value: 'score_attack', label: 'Score Attack' },
  { value: 'district_explorer', label: 'District Explorer' },
  { value: 'login_streak', label: 'Login Streak' },
];

const AdminContent: React.FC<AdminContentProps> = ({ onNotify, confirm }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteriaType, setCriteriaType] = useState('find_street');
  const [criteriaValue, setCriteriaValue] = useState('');
  const [rewardGiuros, setRewardGiuros] = useState('10');
  const [activeDate, setActiveDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchQuests = useCallback(async () => {
    setLoading(true);
    const data = await getQuests();
    setQuests(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchQuests();
  }, [fetchQuests]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCriteriaType('find_street');
    setCriteriaValue('');
    setRewardGiuros('10');
    setActiveDate('');
    setIsActive(true);
    setEditingId(null);
  };

  const handleCreateOrUpdate = async () => {
    if (!title || !description || !criteriaValue) {
      onNotify('Please fill in all required fields', 'error');
      return;
    }

    const questData = {
      title,
      description,
      criteriaType: criteriaType as Quest['criteriaType'],
      criteriaValue,
      rewardGiuros: Number(rewardGiuros),
      activeDate: activeDate || undefined,
      isActive,
    };

    try {
      if (editingId) {
        await updateQuest(editingId, questData);
        onNotify('Quest updated successfully', 'success');
      } else {
        await createQuest(questData);
        onNotify('Quest created successfully', 'success');
      }
      resetForm();
      fetchQuests();
    } catch {
      onNotify('Operation failed', 'error');
    }
  };

  const handleEdit = (quest: Quest) => {
    setEditingId(quest.id);
    setTitle(quest.title);
    setDescription(quest.description);
    setCriteriaType(quest.criteriaType);
    setCriteriaValue(String(quest.criteriaValue));
    setRewardGiuros(String(quest.rewardGiuros));
    setActiveDate(quest.activeDate || '');
    setIsActive(quest.isActive);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Delete this quest? cannot be undone.', 'Delete Quest', true))) {
      return;
    }

    try {
      await deleteQuest(id);
      onNotify('Quest deleted', 'info');
      fetchQuests();
    } catch {
      onNotify('Failed to delete', 'error');
    }
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

      {/* EDITOR FORM */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          {editingId ? '✏️ Edit Quest' : '✨ New Quest'}
          {editingId && (
            <button
              onClick={resetForm}
              className="text-xs font-normal text-slate-500 underline ml-2"
            >
              Cancel Edit
            </button>
          )}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase opacity-50 mb-1">Quest Title</label>
            <input
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600 font-bold"
              placeholder="e.g. Gracia Explorer"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase opacity-50 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600 text-sm"
              placeholder="Describe what the user must do..."
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase opacity-50 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600"
              value={criteriaType}
              onChange={e => setCriteriaType(e.target.value)}
            >
              {CRITERIA_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase opacity-50 mb-1">
              Criteria Value
            </label>
            <input
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600"
              placeholder="e.g. 5, 2000, 'Main St'"
              value={criteriaValue}
              onChange={e => setCriteriaValue(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase opacity-50 mb-1">
              Reward (Giuros)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600"
              value={rewardGiuros}
              onChange={e => setRewardGiuros(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase opacity-50 mb-1">
              Active Date (Optional)
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600"
              value={activeDate}
              onChange={e => setActiveDate(e.target.value)}
            />
            <p className="text-[10px] opacity-40 mt-1">
              Leave empty for &quot;Always Available&quot;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            id="q_active"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded"
          />
          <label htmlFor="q_active" className="font-bold cursor-pointer select-none">
            Active
          </label>
        </div>

        <button
          onClick={handleCreateOrUpdate}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
        >
          {editingId ? 'Save Changes' : 'Create Quest'}
        </button>
      </div>

      {/* LIST OF QUESTS */}
      <div className="space-y-4">
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
                <h4 className="font-bold flex items-center gap-1">
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
                onClick={() => handleEdit(quest)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(quest.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
