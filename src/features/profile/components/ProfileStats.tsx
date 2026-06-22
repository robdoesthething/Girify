import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { UserProfile } from '../../../utils/social';

interface ProfileStatsProps {
  profile: UserProfile | null;
  isLoading: boolean;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ profile, isLoading }) => {
  const { t } = useTheme();

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-5 gap-2 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="text-center flex flex-col items-center gap-1">
            <div className="h-7 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-2 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="p-6 grid grid-cols-5 gap-2 border-b border-slate-100 dark:border-slate-800">
      <div className="text-center opacity-70">
        <p className="text-xl font-black text-slate-400">-</p>
        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-inter">
          {t('streak')}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xl font-black text-purple-500">👥{profile.friendCount || 0}</p>
        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-inter">
          {t('friends')}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xl font-black text-slate-700 dark:text-slate-200">
          {profile.gamesPlayed || 0}
        </p>
        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-inter">
          {t('games')}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xl font-black text-emerald-500">{profile.bestScore || 0}</p>
        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-inter">
          {t('best')}
        </p>
      </div>
      <div className="text-center opacity-70">
        <p className="text-xl font-black text-slate-400">-</p>
        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-inter">
          {t('avg')}
        </p>
      </div>
    </div>
  );
};

export default ProfileStats;
