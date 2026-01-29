import React, { useMemo } from 'react';
import { Card, EmptyState, Heading, Text } from '../../../components/ui';
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
      <Heading variant="h4" className="text-sky-500">
        {t('recentActivity')}
      </Heading>

      {history.length === 0 ? (
        <EmptyState
          emoji="🎮"
          title={t('noGamesYet') || 'No Games Yet'}
          description="Play your first game to see your activity here!"
          className="py-8"
        />
      ) : (
        <div className="space-y-3">
          {sortedHistory.slice(0, HISTORY_LIMIT).map(game => {
            const isDaily = game.timestamp && dailyEarliest.get(game.date) === game.timestamp;
            const classes = getActivityClasses(!!isDaily, theme);

            return (
              <Card
                key={`${game.date}-${game.timestamp}`}
                className={`flex items-center justify-between !p-4 transition-colors ${classes.container} border`}
              >
                <div>
                  <Text variant="small" className="font-bold !mb-0">
                    {t('dailyChallenge')}
                  </Text>
                  <Text variant="caption" className="!mb-0 mt-0.5" muted>
                    {game.timestamp ? new Date(game.timestamp).toLocaleDateString() : 'Just now'}
                  </Text>
                </div>
                <div className="text-right">
                  <span className={`font-black text-lg ${classes.score}`}>{game.score}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-1 font-inter">PTS</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
