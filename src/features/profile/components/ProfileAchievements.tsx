import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Achievement } from '../../../data/achievements';
import { themeClasses } from '../../../utils/themeUtils';

interface ProfileAchievementsProps {
  unlockedBadges: Achievement[];
  isLoading?: boolean;
}

const ProfileAchievements: React.FC<ProfileAchievementsProps> = ({
  unlockedBadges,
  isLoading = false,
}) => {
  const { theme, t } = useTheme();

  if (isLoading) {
    return (
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700 mb-4 animate-pulse" />
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex flex-col items-center p-2 rounded-xl ${themeClasses(theme, 'bg-slate-700/50', 'bg-slate-50')}`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 mb-1" />
              <div className="h-2 w-8 rounded bg-slate-200 dark:bg-slate-600" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
      <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-4 font-inter">
        {t('achievements')} ({unlockedBadges.length})
      </h3>
      {unlockedBadges.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
          {unlockedBadges.map(badge => (
            <div
              key={badge.id}
              className={`flex flex-col items-center p-2 rounded-xl ${themeClasses(theme, 'bg-slate-700/50', 'bg-slate-50')}`}
              title={badge.description}
            >
              {badge.image ? (
                <img
                  src={badge.image}
                  alt={badge.name}
                  className="w-10 h-10 object-contain mb-1 drop-shadow-sm"
                />
              ) : (
                <span className="text-2xl mb-1">{badge.emoji}</span>
              )}
              <span className="text-[10px] text-center font-bold opacity-70 leading-tight">
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 flex flex-col items-center gap-1 opacity-60">
          <span className="text-3xl">🏅</span>
          <p className="font-bold text-sm font-inter">No achievements yet.</p>
          <p className="text-xs font-inter">Keep playing to earn them.</p>
        </div>
      )}
    </div>
  );
};

export default ProfileAchievements;
