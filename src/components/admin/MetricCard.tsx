/**
 * MetricCard Component
 *
 * Simple dashboard metric display card.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { themeClasses } from '../../utils/themeUtils';

interface MetricCardProps {
  title: string;
  value: string | number;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, color }) => {
  const { theme } = useTheme();
  return (
    <div
      className={`p-6 rounded-2xl shadow-sm border ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-200')}`}
    >
      <h3 className="text-sm font-bold opacity-60 uppercase mb-2">{title}</h3>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
};

MetricCard.displayName = 'MetricCard';

export default MetricCard;
