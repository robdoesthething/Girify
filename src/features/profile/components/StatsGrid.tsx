import React from 'react';
import { Card, Text } from '../../../components/ui';
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
    <div className="grid grid-cols-5 gap-3 mb-8">
      <Card className="flex flex-col items-center !p-3 !bg-orange-500/10 dark:!bg-orange-500/5 !border-orange-500/20">
        <span className="text-2xl mb-1">🔥</span>
        <div className="flex flex-col items-center leading-none">
          <span className="text-xl font-black text-orange-500">{stats.dailyStreak}</span>
          <span className="text-[10px] font-bold opacity-50 font-mono">
            Max: {Math.max(stats.dailyStreak, stats.maxStreak)}
          </span>
        </div>
        <Text variant="caption" className="!mb-0 mt-1 !text-slate-400">
          {t('streak')}
        </Text>
      </Card>

      <Card className="flex flex-col items-center !p-3 !bg-purple-500/10 dark:!bg-purple-500/5 !border-purple-500/20">
        <span className="text-2xl mb-1">👥</span>
        <span className="text-xl font-black text-purple-500">{stats.friendCount}</span>
        <Text variant="caption" className="!mb-0 mt-1 !text-slate-400">
          {t('friends')}
        </Text>
      </Card>

      <Card className="flex flex-col items-center !p-3 !bg-slate-500/10 dark:!bg-slate-500/5 !border-slate-500/20">
        <span className="text-2xl mb-1">🎮</span>
        <span className="text-xl font-black text-slate-700 dark:text-slate-200">
          {stats.totalGames}
        </span>
        <Text variant="caption" className="!mb-0 mt-1 !text-slate-400">
          {t('games')}
        </Text>
      </Card>

      <Card className="flex flex-col items-center !p-3 !bg-emerald-500/10 dark:!bg-emerald-500/5 !border-emerald-500/20">
        <span className="text-2xl mb-1">🏆</span>
        <span className="text-xl font-black text-emerald-500">{stats.bestScore}</span>
        <Text variant="caption" className="!mb-0 mt-1 !text-slate-400">
          {t('best')}
        </Text>
      </Card>

      <Card className="flex flex-col items-center !p-3 !bg-sky-500/10 dark:!bg-sky-500/5 !border-sky-500/20">
        <span className="text-2xl mb-1">⚡️</span>
        <span className="text-xl font-black text-sky-500">
          {stats.totalScore >= SCORE_DIVISOR
            ? `${(stats.totalScore / SCORE_DIVISOR).toFixed(1)}k`
            : stats.totalScore}
        </span>
        <Text variant="caption" className="!mb-0 mt-1 !text-slate-400">
          Total
        </Text>
      </Card>
    </div>
  );
};

export default StatsGrid;
