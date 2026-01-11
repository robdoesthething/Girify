import React, { useMemo } from 'react';
import {
  STARTING_GIUROS,
  DAILY_LOGIN_BONUS,
  DAILY_CHALLENGE_BONUS,
  STREAK_WEEK_BONUS,
  PERFECT_SCORE_BONUS,
  REFERRAL_BONUS,
} from '../utils/giuros';

const AdminGiuros = ({ users = [], shopItems = [], theme }) => {
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
          value={STARTING_GIUROS}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Sources (Constants) */}
        <div
          className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📈</span> Income Sources (Rewards)
          </h3>
          <div className="space-y-3">
            <SourceRow label="Daily Login" value={`+${DAILY_LOGIN_BONUS}`} />
            <SourceRow label="Daily Challenge" value={`+${DAILY_CHALLENGE_BONUS}`} />
            <SourceRow label="Week Streak Bonus" value={`+${STREAK_WEEK_BONUS}`} />
            <SourceRow label="Referral Bonus" value={`+${REFERRAL_BONUS}`} />
            <SourceRow label="Perfect Score" value={`+${PERFECT_SCORE_BONUS}`} />
            <SourceRow label="Feedback Approval" value="Variable (avg 50)" isVariable />
          </div>
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
                  className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji || '📦'}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className="text-[10px] opacity-60 uppercase">{item.type}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-red-400">-{item.cost}</span>
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
              {stats.richest.map((user, i) => (
                <tr key={user.id}>
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

const MetricCard = ({ title, value, color, theme }) => (
  <div
    className={`p-6 rounded-2xl shadow-sm border ${
      theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}
  >
    <h3 className="text-sm font-bold opacity-60 uppercase mb-2">{title}</h3>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
  </div>
);

const SourceRow = ({ label, value, isVariable }) => (
  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <span className={`font-mono font-bold ${isVariable ? 'text-blue-500' : 'text-emerald-500'}`}>
      {value}
    </span>
  </div>
);

export default AdminGiuros;
