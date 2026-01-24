import React, { useState } from 'react';
import { PayoutConfig } from '../../services/db/config';
import { themeClasses } from '../../utils/themeUtils';
import FormInput from '../FormInput';

interface IncomeConfigProps {
  payouts: PayoutConfig | null;
  onSave: (newConfig: PayoutConfig) => Promise<void>;
  theme: 'light' | 'dark';
}

interface EditableSourceRowProps {
  label: string;
  value: number;
  onChange: (val: string) => void;
  theme: 'light' | 'dark';
}

const SourceRow: React.FC<{
  label: string;
  value: string | number;
  isVariable?: boolean;
  theme: 'light' | 'dark';
}> = ({ label, value, isVariable }) => (
  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <span className={`font-mono font-bold ${isVariable ? 'text-blue-500' : 'text-emerald-500'}`}>
      {value}
    </span>
  </div>
);

const EditableSourceRow: React.FC<EditableSourceRowProps> = ({ label, value, onChange, theme }) => (
  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-emerald-500 font-bold">+</span>
      <FormInput
        type="number"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        aria-label={`Value for ${label}`}
        containerClassName="w-20 mb-0"
        className={`text-right font-mono font-bold ${themeClasses(
          theme,
          'text-emerald-400',
          'text-emerald-600'
        )}`}
        min="0"
      />
    </div>
  </div>
);

const IncomeConfig: React.FC<IncomeConfigProps> = ({ payouts, onSave, theme }) => {
  // Local state for editing to prevent lifting every keystroke
  // But AdminGiuros logic was using `editingPayouts` and updating parent.
  // We can manage edit state locally here and only call onSave with final config.
  // However, AdminGiuros didn't pass `setEditingPayouts`.
  // Let's implement local state and sync with props.

  const [editingConfig, setEditingConfig] = useState<Partial<PayoutConfig>>(payouts || {});
  const [saving, setSaving] = useState(false);

  // Sync when payouts prop updates
  React.useEffect(() => {
    if (payouts) {
      setEditingConfig(payouts);
    }
  }, [payouts]);

  const handleChange = (key: keyof PayoutConfig, val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setEditingConfig(prev => ({ ...prev, [key]: num }));
    }
  };

  const handleSave = async () => {
    if (!payouts) {
      return;
    }
    setSaving(true);
    await onSave(editingConfig as PayoutConfig); // Assume complete
    setSaving(false);
  };

  const hasChanges = payouts && JSON.stringify(payouts) !== JSON.stringify(editingConfig);

  return (
    <div
      className={`p-6 rounded-2xl border ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-200')}`}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>📈</span> Income Sources (Rewards)
      </h3>
      {payouts ? (
        <div className="space-y-3">
          <EditableSourceRow
            label="Starting Giuros"
            value={editingConfig.STARTING_GIUROS || 0}
            onChange={v => handleChange('STARTING_GIUROS', v)}
            theme={theme}
          />
          <EditableSourceRow
            label="Daily Login"
            value={editingConfig.DAILY_LOGIN_BONUS || 0}
            onChange={v => handleChange('DAILY_LOGIN_BONUS', v)}
            theme={theme}
          />
          <EditableSourceRow
            label="Daily Challenge"
            value={editingConfig.DAILY_CHALLENGE_BONUS || 0}
            onChange={v => handleChange('DAILY_CHALLENGE_BONUS', v)}
            theme={theme}
          />
          <EditableSourceRow
            label="Week Streak Bonus"
            value={editingConfig.STREAK_WEEK_BONUS || 0}
            onChange={v => handleChange('STREAK_WEEK_BONUS', v)}
            theme={theme}
          />
          <EditableSourceRow
            label="Referral Bonus"
            value={editingConfig.REFERRAL_BONUS || 0}
            onChange={v => handleChange('REFERRAL_BONUS', v)}
            theme={theme}
          />
          <EditableSourceRow
            label="Perfect Score"
            value={editingConfig.PERFECT_SCORE_BONUS || 0}
            onChange={v => handleChange('PERFECT_SCORE_BONUS', v)}
            theme={theme}
          />
          <SourceRow
            label="Feedback Approval"
            value="Variable (set per feedback)"
            isVariable
            theme={theme}
          />
        </div>
      ) : (
        <p className="text-center opacity-50">Loading configuration...</p>
      )}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-bold shadow-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Payout Changes'}
        </button>
      )}
    </div>
  );
};

export default IncomeConfig;
