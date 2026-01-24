import React, { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { GameHistory } from '../../../types/user';
import { getActivityClasses } from '../utils/profileHelpers';

const HISTORY_LIMIT = 7;

interface RecentActivityProps {
  history: GameHistory[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ history }) => {
  const { theme, t } = useTheme();

  // Sort and calculate daily earliest
  const { sortedHistory, dailyEarliest } = useMemo(() => {
    const sorted = [...history].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      if (timeA && timeB) {
        return timeB - timeA;
      }
      return 0;
    });

    const earliest = new Map<string, number>();
    sorted.forEach(g => {
      if (g.timestamp) {
        if (!earliest.has(g.date) || g.timestamp < (earliest.get(g.date) as number)) {
          earliest.set(g.date, g.timestamp);
        }
      }
    });
    return { sortedHistory: sorted, dailyEarliest: earliest };
  }, [history]);

  return (
    <div className="mb-20">
      <h3 className="font-bold text-lg mb-4 text-sky-500 font-inter">{t('recentActivity')}</h3>
      {history.length === 0 ? (
        <div className="text-center py-10 opacity-40 text-sm font-inter">{t('noGamesYet')}</div>
      ) : (
        <div className="space-y-4">
          {sortedHistory.slice(0, HISTORY_LIMIT).map(game => {
            const isDaily = game.timestamp && dailyEarliest.get(game.date) === game.timestamp;

            const classes = getActivityClasses(!!isDaily, theme);

            return (
              <div
                key={`${game.date}-${game.timestamp}`}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${classes.container}`}
              >
                <div>
                  <p className="font-bold text-sm font-inter">{t('dailyChallenge')}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {game.timestamp ? new Date(game.timestamp).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`font-black text-lg ${classes.score}`}>{game.score}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-1 font-inter">PTS</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
