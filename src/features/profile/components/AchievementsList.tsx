import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Achievement } from '../../../data/achievements';
import { themeClasses } from '../../../utils/themeUtils';
import { getBadgeClass } from '../utils/profileHelpers';

const ROUND_FACTOR = 100;

interface AchievementsListProps {
  unlockedBadges: Achievement[];
  nextBadge: Achievement | null;
  selectedAchievement: Achievement | null;
  onSelectAchievement: (achievement: Achievement | null) => void;
}

const AchievementsList: React.FC<AchievementsListProps> = ({
  unlockedBadges,
  nextBadge,
  selectedAchievement,
  onSelectAchievement,
}) => {
  const { theme, t } = useTheme();

  return (
    <div className="mb-8">
      <h3 className="font-bold text-lg mb-4 text-sky-500 flex items-center gap-2 font-inter">
        {t('achievements')}{' '}
        <span className="text-sm opacity-60 text-slate-500 dark:text-slate-400">
          ({unlockedBadges.length})
        </span>
      </h3>

      {unlockedBadges.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
          {unlockedBadges.map(badge => (
            <div
              key={badge.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                onSelectAchievement(selectedAchievement?.id === badge.id ? null : badge)
              }
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectAchievement(selectedAchievement?.id === badge.id ? null : badge);
                }
              }}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer border w-full h-full text-left ${getBadgeClass(
                selectedAchievement?.id === badge.id,
                theme
              )}`}
              title={badge.description}
            >
              {badge.image ? (
                <img
                  src={badge.image}
                  alt={badge.name}
                  className="w-10 h-10 object-contain mb-1 drop-shadow-sm"
                  style={{ imageRendering: 'pixelated', mixBlendMode: 'multiply' }}
                />
              ) : (
                <span className="text-3xl mb-1">{badge.emoji}</span>
              )}
              <span className="text-[10px] text-center font-bold opacity-70 leading-tight">
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm opacity-50 text-center py-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-inter">
          Play games to unlock achievements!
        </p>
      )}

      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 overflow-hidden"
          >
            <div className="flex items-center gap-4">
              {selectedAchievement.image ? (
                <img
                  src={selectedAchievement.image}
                  alt={selectedAchievement.name}
                  className="w-16 h-16 object-contain drop-shadow-md"
                  style={{ imageRendering: 'pixelated', mixBlendMode: 'multiply' }}
                />
              ) : (
                <span className="text-4xl">{selectedAchievement.emoji}</span>
              )}
              <div>
                <h4 className="font-bold text-sky-600 dark:text-sky-400 font-inter">
                  {selectedAchievement.name}
                </h4>
                <p className="text-sm opacity-80 font-inter">{selectedAchievement.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {nextBadge && (
        <div
          className={`mt-4 p-4 rounded-2xl border ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-100 shadow-sm')}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold opacity-60 font-inter">{t('nextAchievement')}</span>
            {nextBadge.image ? (
              <img
                src={nextBadge.image}
                alt={nextBadge.name}
                className="w-8 h-8 object-contain"
                style={{ imageRendering: 'pixelated', mixBlendMode: 'multiply' }}
              />
            ) : (
              <span className="text-lg">{nextBadge.emoji}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex-1 h-3 rounded-full ${themeClasses(theme, 'bg-slate-700', 'bg-slate-100')}`}
            >
              <div
                className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all shadow-sm"
                style={{ width: `${Math.round((nextBadge.progress ?? 0) * ROUND_FACTOR)}%` }}
              />
            </div>
            <span className="text-xs font-bold opacity-60 w-8 text-right font-mono">
              {Math.round((nextBadge.progress ?? 0) * ROUND_FACTOR)}%
            </span>
          </div>
          <p className="text-xs opacity-50 mt-2 font-inter">
            {nextBadge.name}: {nextBadge.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementsList;
