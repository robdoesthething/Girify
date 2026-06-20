import React from 'react';
import { Card } from '../../components/ui';
import { DashboardMetrics } from '../../utils/game/metrics';

interface AdminDashboardProps {
  metrics: DashboardMetrics | null;
  feedbackCount: number;
  shopItemsCount: number;
  onMigration: () => void;
  onCleanup: () => void;
  migrationStatus: string | null;
}

const Stat: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
}> = ({ label, value, sub, color = 'text-white', bg = 'bg-slate-800/60' }) => (
  <div className={`${bg} border border-white/5 rounded-2xl p-5 flex flex-col gap-1`}>
    <span className="text-[11px] font-bold uppercase tracking-widest opacity-50">{label}</span>
    <span className={`text-3xl font-black leading-none ${color}`}>{value}</span>
    {sub && <span className="text-xs opacity-40 mt-0.5">{sub}</span>}
  </div>
);

const RetentionBar: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 60 ? 'bg-emerald-500' : value >= 30 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
};

const RetentionCard: React.FC<{ label: string; value: number; cohortNote: string }> = ({
  label,
  value,
  cohortNote,
}) => {
  const color = value >= 60 ? 'text-emerald-400' : value >= 30 ? 'text-amber-400' : 'text-rose-400';
  const status = value >= 60 ? 'Healthy' : value >= 30 ? 'Needs attention' : 'Critical';

  return (
    <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-5">
      <span className="text-[11px] font-bold uppercase tracking-widest opacity-50">{label}</span>
      <div className={`text-4xl font-black mt-1 ${color}`}>{value}%</div>
      <RetentionBar value={value} />
      <div className="flex justify-between items-center mt-2">
        <span className={`text-[10px] font-bold uppercase ${color} opacity-70`}>{status}</span>
        <span className="text-[10px] opacity-30">{cohortNote}</span>
      </div>
    </div>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-3">{children}</h3>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  metrics,
  feedbackCount,
  shopItemsCount,
  onMigration,
  onCleanup,
  migrationStatus,
}) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-slate-800/40 rounded-2xl h-24" />
        ))}
      </div>
    );
  }

  const dau = metrics.activeUsers24h;
  const wau = metrics.weeklyActiveUsers;
  const dauWauRatio = wau > 0 ? Math.round((dau / wau) * 100) : 0;
  const avgGiurosPerUser =
    metrics.totalUsers > 0 ? Math.round(metrics.totalGiuros / metrics.totalUsers) : 0;

  return (
    <div className="space-y-8">
      {/* Activity */}
      <div>
        <SectionLabel>Activity</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Total Users"
            value={metrics.totalUsers.toLocaleString()}
            color="text-sky-400"
          />
          <Stat label="New (24h)" value={metrics.newUsers24h} color="text-emerald-400" />
          <Stat label="DAU" value={dau} sub="Active last 24h" color="text-purple-400" />
          <Stat label="WAU" value={wau} sub={`DAU/WAU ${dauWauRatio}%`} color="text-indigo-400" />
          <Stat label="Games (24h)" value={metrics.gamesPlayed24h} color="text-orange-400" />
          <Stat
            label="Avg Score (24h)"
            value={metrics.avgScore}
            sub="out of 1000"
            color="text-yellow-400"
          />
          <Stat
            label="Correct Rate (24h)"
            value={`${metrics.correctAnswerRate}%`}
            sub="answers correct"
            color={
              metrics.correctAnswerRate >= 60
                ? 'text-emerald-400'
                : metrics.correctAnswerRate >= 40
                  ? 'text-amber-400'
                  : 'text-rose-400'
            }
          />
          <Stat
            label="Banned Users"
            value={metrics.bannedUsersCount}
            color={metrics.bannedUsersCount > 0 ? 'text-rose-400' : 'text-slate-400'}
            sub={metrics.bannedUsersCount > 0 ? 'check users tab' : 'all clear'}
          />
        </div>
      </div>

      {/* Retention */}
      <div>
        <SectionLabel>Retention</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <RetentionCard
            label="Day 1 Retention"
            value={metrics.day1Retention}
            cohortNote="played within 24h of joining"
          />
          <RetentionCard
            label="Day 7 Retention"
            value={metrics.day7Retention}
            cohortNote="played within first week"
          />
          <RetentionCard
            label="Day 30 Retention"
            value={metrics.day30Retention}
            cohortNote="played within first month"
          />
        </div>
      </div>

      {/* Economy */}
      <div>
        <SectionLabel>Economy</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Total Giuros"
            value={metrics.totalGiuros.toLocaleString()}
            sub="in circulation"
            color="text-yellow-400"
          />
          <Stat
            label="Avg per User"
            value={avgGiurosPerUser.toLocaleString()}
            sub="giuros / user"
            color="text-amber-400"
          />
          <Stat
            label="Shop Items"
            value={shopItemsCount}
            sub="active listings"
            color="text-purple-400"
          />
          <Stat
            label="Feedback"
            value={feedbackCount}
            sub="pending review"
            color={feedbackCount > 0 ? 'text-pink-400' : 'text-slate-400'}
          />
        </div>
      </div>

      {/* Data Tools */}
      <div>
        <SectionLabel>Data Tools</SectionLabel>
        <Card className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onMigration}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              ⚠️ Fix Usernames (Lowercase)
            </button>
            <button
              onClick={onCleanup}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              🗑️ Cleanup No-Email Users
            </button>
            {migrationStatus && (
              <span className="font-mono text-sm opacity-70 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded">
                {migrationStatus}
              </span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
