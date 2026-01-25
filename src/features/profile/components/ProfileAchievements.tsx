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
    return null;
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
        <p className="text-sm opacity-50 text-center py-4">No achievements yet.</p>
      )}
    </div>
  );
};

export default ProfileAchievements;
