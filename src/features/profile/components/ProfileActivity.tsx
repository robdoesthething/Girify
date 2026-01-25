import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

interface GameHistory {
  date?: string;
  score: number;
}

interface ProfileActivityProps {
  history: GameHistory[];
  isLoading?: boolean;
}

const RECENT_GAMES_LIMIT = 5;

const ProfileActivity: React.FC<ProfileActivityProps> = ({ history, isLoading = false }) => {
  const { theme, t } = useTheme();

  if (isLoading) {
    return null;
  }

  return (
    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
      <h3 className="font-bold text-lg mb-4 text-sky-500 font-inter">{t('recentActivity')}</h3>
      {history.length === 0 ? (
        <p className="text-center py-4 opacity-50 text-sm font-inter">No recent games</p>
      ) : (
        <div className="space-y-4">
          {history.slice(0, RECENT_GAMES_LIMIT).map((game, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses(theme, 'bg-slate-800/50 border-slate-700', 'bg-white border-slate-100')}`}
            >
              <div>
                <p className="font-bold text-xs font-inter uppercase tracking-wider opacity-70">
                  {t('dailyChallenge')}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {game.date || 'Unknown Date'}
                </p>
              </div>
              <div className="text-right">
                <span className="font-black text-lg text-emerald-500 font-inter">{game.score}</span>
                <span className="text-[10px] font-bold text-slate-400 ml-1 font-inter">PTS</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileActivity;
