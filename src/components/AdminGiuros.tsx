import React, { useMemo, useState, useEffect } from 'react';
// @ts-ignore
import { getPayoutConfig, updatePayoutConfig, PayoutConfig } from '../utils/configService';
import { UserProfile } from '../types/user';

interface ShopItem {
  id: string;
  name: string;
  type: string;
  cost: number;
  emoji?: string;
  prefix?: string;
  flavorText?: string;
  description?: string;
  cssClass?: string;
  image?: string;
}

interface AdminGiurosProps {
  users: UserProfile[];
  shopItems: { all: ShopItem[] };
  theme: string;
  onUpdateShopItem?: (id: string, updates: any) => Promise<void>;
}

const AdminGiuros: React.FC<AdminGiurosProps> = ({
  users = [],
  shopItems = { all: [] },
  theme,
  onUpdateShopItem,
}) => {
  // Payout config state
  const [payouts, setPayouts] = useState<PayoutConfig | null>(null);
  const [editingPayouts, setEditingPayouts] = useState<Partial<PayoutConfig>>({});
  const [savingPayouts, setSavingPayouts] = useState<boolean>(false);

  // Fetch payout config on mount
  useEffect(() => {
    getPayoutConfig().then((config: PayoutConfig) => {
      setPayouts(config);
      setEditingPayouts(config);
    });
  }, []);

  // Calculate Economy Stats
  const stats = useMemo(() => {
    const totalCirculation = users.reduce((acc, u) => acc + (u.giuros || 0), 0);
    const avgBalance = users.length > 0 ? Math.round(totalCirculation / users.length) : 0;

    // Sort users by wealth
    const richest = [...users].sort((a, b) => (b.giuros || 0) - (a.giuros || 0)).slice(0, 5);

    return {
      totalCirculation,
      avgBalance,
      richest,
    };
  }, [users]);

  // Helper to edit price
  const handleEditPrice = async (item: ShopItem) => {
    // eslint-disable-next-line no-alert
    const newPrice = prompt(`Enter new price for ${item.name}:`, item.cost.toString());
    if (newPrice !== null && !isNaN(parseInt(newPrice, 10))) {
      if (onUpdateShopItem) {
        await onUpdateShopItem(item.id, { cost: parseInt(newPrice, 10) });
      }
    }
  };

  // Handle payout value change
  const handlePayoutChange = (key: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditingPayouts((prev: Partial<PayoutConfig>) => ({ ...prev, [key]: numValue }));
    }
  };

  // Save payout changes
  const handleSavePayouts = async () => {
    setSavingPayouts(true);
    const result = await updatePayoutConfig(editingPayouts);
    setSavingPayouts(false);

    if (result.success) {
      setPayouts(editingPayouts as PayoutConfig);
      // eslint-disable-next-line no-alert
      alert('Payout configuration saved successfully!');
    } else {
      // eslint-disable-next-line no-alert
      alert('Failed to save: ' + (result.error || 'Unknown error'));
    }
  };

  // Check if payouts have changed
  const payoutsChanged = payouts && JSON.stringify(payouts) !== JSON.stringify(editingPayouts);

  return (
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-black">Giuros Economics</h2>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Circulation"
          value={`${stats.totalCirculation.toLocaleString()} 🪙`}
          color="text-yellow-500"
          theme={theme}
        />
        <MetricCard
          title="Avg User Balance"
          value={`${stats.avgBalance.toLocaleString()} 🪙`}
          color="text-sky-500"
          theme={theme}
        />
        <MetricCard
          title="Starting Amount"
          value={payouts?.STARTING_GIUROS ?? '...'}
          color="text-slate-500"
          theme={theme}
        />
        <MetricCard
          title="Active Items"
          value={shopItems.all?.length || 0}
          color="text-purple-500"
          theme={theme}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Sources (Editable) */}
        <div
          className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📈</span> Income Sources (Rewards)
          </h3>
          {payouts ? (
            <div className="space-y-3">
              <EditableSourceRow
                label="Starting Giuros"
                value={editingPayouts.STARTING_GIUROS || 0}
                onChange={v => handlePayoutChange('STARTING_GIUROS', v)}
                theme={theme}
              />
              <EditableSourceRow
                label="Daily Login"
                value={editingPayouts.DAILY_LOGIN_BONUS || 0}
                onChange={v => handlePayoutChange('DAILY_LOGIN_BONUS', v)}
                theme={theme}
              />
              <EditableSourceRow
                label="Daily Challenge"
                value={editingPayouts.DAILY_CHALLENGE_BONUS || 0}
                onChange={v => handlePayoutChange('DAILY_CHALLENGE_BONUS', v)}
                theme={theme}
              />
              <EditableSourceRow
                label="Week Streak Bonus"
                value={editingPayouts.STREAK_WEEK_BONUS || 0}
                onChange={v => handlePayoutChange('STREAK_WEEK_BONUS', v)}
                theme={theme}
              />
              <EditableSourceRow
                label="Referral Bonus"
                value={editingPayouts.REFERRAL_BONUS || 0}
                onChange={v => handlePayoutChange('REFERRAL_BONUS', v)}
                theme={theme}
              />
              <EditableSourceRow
                label="Perfect Score"
                value={editingPayouts.PERFECT_SCORE_BONUS || 0}
                onChange={v => handlePayoutChange('PERFECT_SCORE_BONUS', v)}
                theme={theme}
              />
              <SourceRow label="Feedback Approval" value="Variable (set per feedback)" isVariable />
            </div>
          ) : (
            <p className="text-center opacity-50">Loading configuration...</p>
          )}
          {payoutsChanged && (
            <button
              onClick={handleSavePayouts}
              disabled={savingPayouts}
              className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-bold shadow-lg transition-colors"
            >
              {savingPayouts ? 'Saving...' : 'Save Payout Changes'}
            </button>
          )}
        </div>

        {/* Sinks (Shop Prices) */}
        <div
          className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📉</span> Sinks (Shop Prices)
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {shopItems.all
              ?.sort((a, b) => a.cost - b.cost)
              .map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji || '📦'}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className="text-[10px] opacity-60 uppercase">{item.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditPrice(item)}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="Click to edit price"
                  >
                    <span className="font-mono font-bold text-red-400">-{item.cost}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-xs">✏️</span>
                  </button>
                </div>
              ))}
            {(!shopItems.all || shopItems.all.length === 0) && (
              <p className="opacity-50 text-center text-sm">No shop items found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Richest Users */}
      <div
        className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
      >
        <h3 className="text-xl font-bold mb-4">👑 Richest Users (Top 5)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase opacity-50">
                <th className="pb-2">User</th>
                <th className="pb-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.richest.map((user: UserProfile, i: number) => (
                <tr key={user.uid || user.username}>
                  <td className="py-3 font-medium">
                    <span
                      className={`mr-2 font-black ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-700' : 'opacity-50'}`}
                    >
                      #{i + 1}
                    </span>
                    {user.username}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-yellow-500">
                    {user.giuros} 🪙
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  color?: string;
  theme: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, color, theme }) => (
  <div
    className={`p-6 rounded-2xl shadow-sm border ${
      theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}
  >
    <h3 className="text-sm font-bold opacity-60 uppercase mb-2">{title}</h3>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
  </div>
);

interface SourceRowProps {
  label: string;
  value: string | number;
  isVariable?: boolean;
}

const SourceRow: React.FC<SourceRowProps> = ({ label, value, isVariable }) => (
  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <span className={`font-mono font-bold ${isVariable ? 'text-blue-500' : 'text-emerald-500'}`}>
      {value}
    </span>
  </div>
);

interface EditableSourceRowProps {
  label: string;
  value: number;
  onChange: (val: string) => void;
  theme: string;
}

const EditableSourceRow: React.FC<EditableSourceRowProps> = ({ label, value, onChange, theme }) => (
  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <div className="flex items-center gap-1">
      <span className="text-emerald-500 font-bold">+</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-20 p-1 rounded text-right font-mono font-bold ${
          theme === 'dark'
            ? 'bg-slate-700 text-emerald-400 border-slate-600'
            : 'bg-slate-100 text-emerald-600 border-slate-200'
        } border`}
        min="0"
      />
    </div>
  </div>
);

export default AdminGiuros;
