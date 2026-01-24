import React from 'react';
import { useTheme } from '../../../context/ThemeContext';

const SCORE_DIVISOR = 1000;

interface StatsGridProps {
  stats: {
    dailyStreak: number;
    maxStreak: number;
    friendCount: number;
    totalGames: number;
    bestScore: number;
    totalScore: number;
  };
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const { t } = useTheme();

  return (
    <div className="grid grid-cols-5 gap-4 mb-8">
      <div className="flex flex-col items-center p-3 rounded-2xl bg-orange-500/10 dark:bg-orange-500/5">
        <span className="text-2xl mb-1">🔥</span>
        <div className="flex flex-col items-center leading-none">
          <span className="text-xl font-black text-orange-500">{stats.dailyStreak}</span>
          <span className="text-[10px] font-bold opacity-50 font-mono">
            Max: {Math.max(stats.dailyStreak, stats.maxStreak)}
          </span>
        </div>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          {t('streak')}
        </span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/5">
        <span className="text-2xl mb-1">👥</span>
        <span className="text-xl font-black text-purple-500">{stats.friendCount}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          {t('friends')}
        </span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-500/10 dark:bg-slate-500/5">
        <span className="text-2xl mb-1">🎮</span>
        <span className="text-xl font-black text-slate-700 dark:text-slate-200">
          {stats.totalGames}
        </span>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          {t('games')}
        </span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5">
        <span className="text-2xl mb-1">🏆</span>
        <span className="text-xl font-black text-emerald-500">{stats.bestScore}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          {t('best')}
        </span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-2xl bg-sky-500/10 dark:bg-sky-500/5">
        <span className="text-2xl mb-1">⚡️</span>
        <span className="text-xl font-black text-sky-500">
          {stats.totalScore >= SCORE_DIVISOR
            ? `${(stats.totalScore / SCORE_DIVISOR).toFixed(1)}k`
            : stats.totalScore}
        </span>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          Total
        </span>
      </div>
    </div>
  );
};

export default StatsGrid;
