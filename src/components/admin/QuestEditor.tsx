import React, { useEffect, useState } from 'react';
import { Quest } from '../../utils/quests';
import FormInput from '../FormInput';

interface QuestEditorProps {
  initialQuest?: Partial<Quest> | null;
  onSave: (questData: Partial<Quest>) => void;
  onCancel: () => void;
}

const CRITERIA_TYPES = [
  { value: 'find_street', label: 'Find Specific Streets' },
  { value: 'score_attack', label: 'Score Attack' },
  { value: 'district_explorer', label: 'District Explorer' },
  { value: 'login_streak', label: 'Login Streak' },
];

const QuestEditor: React.FC<QuestEditorProps> = ({ initialQuest, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    criteriaType: 'find_street',
    criteriaValue: '',
    rewardGiuros: '10',
    activeDate: '',
    isActive: true,
  });

  useEffect(() => {
    if (initialQuest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        title: initialQuest.title || '',
        description: initialQuest.description || '',
        criteriaType: initialQuest.criteriaType || 'find_street',
        criteriaValue: String(initialQuest.criteriaValue || ''),
        rewardGiuros: String(initialQuest.rewardGiuros || '10'),
        activeDate: initialQuest.activeDate || '',
        isActive: initialQuest.isActive ?? true,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        criteriaType: 'find_street',
        criteriaValue: '',
        rewardGiuros: '10',
        activeDate: '',
        isActive: true,
      });
    }
  }, [initialQuest]);

  const handleSubmit = () => {
    onSave({
      ...formData,
      criteriaType: formData.criteriaType as Quest['criteriaType'],
      rewardGiuros: Number(formData.rewardGiuros),
      activeDate: formData.activeDate || undefined,
    });
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        {initialQuest ? '✏️ Edit Quest' : '✨ New Quest'}
        {initialQuest && (
          <button onClick={onCancel} className="text-xs font-normal text-slate-500 underline ml-2">
            Cancel Edit
          </button>
        )}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2">
          <FormInput
            id="quest-title"
            label="Quest Title"
            placeholder="e.g. Gracia Explorer"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="font-bold"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="quest-desc" className="block text-xs font-bold uppercase opacity-50 mb-1">
            Description
          </label>
          <textarea
            id="quest-desc"
            className="w-full px-3 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            placeholder="Describe what the user must do..."
            rows={2}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="quest-type" className="block text-xs font-bold uppercase opacity-50 mb-1">
            Type
          </label>
          <select
            id="quest-type"
            className="w-full px-3 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            value={formData.criteriaType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFormData({ ...formData, criteriaType: e.target.value })
            }
          >
            {CRITERIA_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          id="quest-criteria"
          label="Criteria Value"
          placeholder="e.g. 5, 2000, 'Main St'"
          value={formData.criteriaValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, criteriaValue: e.target.value })
          }
        />

        <FormInput
          id="quest-reward"
          label="Reward (Giuros)"
          type="number"
          value={formData.rewardGiuros}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, rewardGiuros: e.target.value })
          }
        />

        <div>
          <label htmlFor="quest-date" className="block text-xs font-bold uppercase opacity-50 mb-1">
            Active Date (Optional)
          </label>
          <input
            id="quest-date"
            type="date"
            className="w-full px-3 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono text-sm"
            value={formData.activeDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, activeDate: e.target.value })
            }
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
          checked={formData.isActive}
          onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-5 h-5 accent-emerald-500 rounded"
        />
        <label htmlFor="q_active" className="font-bold cursor-pointer select-none">
          Active
        </label>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
      >
        {initialQuest ? 'Save Changes' : 'Create Quest'}
      </button>
    </div>
  );
};

export default QuestEditor;
