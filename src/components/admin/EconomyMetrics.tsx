import React from 'react';
import { PayoutConfig } from '../../utils/configService';
import { themeClasses } from '../../utils/themeUtils';

interface EconomyMetricsProps {
  stats: {
    totalCirculation: number;
    avgBalance: number;
  };
  payouts: PayoutConfig | null;
  shopItemsCount: number;
  theme: 'light' | 'dark';
}

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  color?: string;
  theme: 'light' | 'dark';
}> = ({ title, value, color, theme }) => (
  <div
    className={`p-6 rounded-2xl shadow-sm border ${themeClasses(
      theme,
      'bg-slate-800 border-slate-700',
      'bg-white border-slate-200'
    )}`}
  >
    <h3 className="text-sm font-bold opacity-60 uppercase mb-2">{title}</h3>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
  </div>
);

const EconomyMetrics: React.FC<EconomyMetricsProps> = ({
  stats,
  payouts,
  shopItemsCount,
  theme,
}) => {
  return (
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
        color="text-slate-600"
        theme={theme}
      />
      <MetricCard
        title="Active Items"
        value={shopItemsCount}
        color="text-purple-500"
        theme={theme}
      />
    </div>
  );
};

export default EconomyMetrics;
