import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { getUnlockedAchievements } from '../../../data/achievements';
import { getAvatar } from '../../../data/avatars';
import cosmetics from '../../../data/cosmetics.json';
import { formatUsername } from '../../../utils/format';
import { UserProfile } from '../../../utils/social';
import { themeClasses } from '../../../utils/themeUtils';

interface PublicProfileHeaderProps {
  profile: UserProfile | null;
  isLoading: boolean;
  equippedCosmetics: Record<string, string>;
  username: string;
}

const MAX_BADGES_DISPLAY = 6;

const PublicProfileHeader: React.FC<PublicProfileHeaderProps> = ({
  profile,
  isLoading,
  equippedCosmetics,
  username,
}) => {
  const { theme, t } = useTheme();

  const formattedUsername = formatUsername(username);
  const equippedAvatarId = equippedCosmetics?.avatarId;
  const hasCustomAvatar = equippedAvatarId && equippedAvatarId.startsWith('pixel_');
  const avatarUrl = hasCustomAvatar ? `/assets/districts/${equippedAvatarId}.png` : null;

  const equippedFrame = cosmetics.avatarFrames.find(f => f.id === equippedCosmetics.frameId);
  const frameClass = equippedFrame?.cssClass || 'ring-4 ring-white dark:ring-slate-700';

  const userStats = {
    gamesPlayed: profile?.gamesPlayed || 0,
    bestScore: profile?.bestScore || 0,
    streak: 0,
  };
  const unlockedBadges = getUnlockedAchievements(userStats);

  return (
    <div
      className={`p-8 flex flex-col items-center border-b relative ${themeClasses(theme, 'border-slate-700 bg-slate-800/50', 'border-slate-50')}`}
    >
      {isLoading ? (
        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse mb-4" />
      ) : (
        <div
          className={`w-24 h-24 rounded-full ${avatarUrl ? 'bg-transparent' : 'bg-gradient-to-br from-sky-400 to-indigo-600'} flex items-center justify-center text-4xl shadow-lg mb-4 ${frameClass} overflow-hidden`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            getAvatar(profile?.avatarId || 1)
          )}
        </div>
      )}

      <h2 className="text-2xl font-black tracking-tight">{formattedUsername}</h2>
      {profile?.realName && <p className="text-sm font-bold opacity-50 mt-1">{profile.realName}</p>}
      {profile?.joinedAt && (
        <p className="text-xs font-bold uppercase tracking-widest opacity-40 mt-2">
          {t('playerSince')}{' '}
          {profile.joinedAt instanceof Date
            ? profile.joinedAt.toLocaleDateString()
            : (profile.joinedAt as { toDate: () => Date }).toDate
              ? (profile.joinedAt as { toDate: () => Date }).toDate().toLocaleDateString()
              : new Date(
                  (profile.joinedAt as { seconds: number }).seconds * 1000
                ).toLocaleDateString()}
        </p>
      )}

      {unlockedBadges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {unlockedBadges.slice(0, MAX_BADGES_DISPLAY).map(badge => (
            <span key={badge.id} className="text-xl" title={`${badge.name}: ${badge.description}`}>
              {badge.image ? (
                <img
                  src={badge.image}
                  alt={badge.name}
                  className="w-6 h-6 object-contain drop-shadow-sm"
                />
              ) : (
                badge.emoji
              )}
            </span>
          ))}
          {unlockedBadges.length > MAX_BADGES_DISPLAY && (
            <span className="text-xs text-slate-400 self-center">
              +{unlockedBadges.length - MAX_BADGES_DISPLAY}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicProfileHeader;
