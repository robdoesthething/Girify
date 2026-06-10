import React from 'react';
import { CosmeticAvatar } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { getUnlockedAchievements } from '../../../data/achievements';
import { getAvatar } from '../../../data/avatars';
import { formatUsername } from '../../../utils/format';
import { getCosmeticAvatarImage, getFrameClass } from '../../../utils/shop/catalog';
import { UserProfile } from '../../../utils/social';
import { EquippedCosmetics } from '../../../utils/social/types';
import { themeClasses } from '../../../utils/themeUtils';

interface PublicProfileHeaderProps {
  profile: UserProfile | null;
  isLoading: boolean;
  equippedCosmetics: EquippedCosmetics;
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
  const avatarUrl = getCosmeticAvatarImage(equippedCosmetics?.avatarId);
  const frameClass = getFrameClass(equippedCosmetics?.frameId);

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
        <CosmeticAvatar
          image={avatarUrl}
          fallback={getAvatar(profile?.avatarId || 1)}
          size={96}
          alt={username}
          className={`shadow-lg mb-4 ${frameClass}`}
        />
      )}

      <h2 className="text-2xl font-black tracking-tight">{formattedUsername}</h2>
      {profile?.realName && <p className="text-sm font-bold opacity-50 mt-1">{profile.realName}</p>}
      {profile?.joinedAt && (
        <p className="text-xs font-bold uppercase tracking-widest opacity-40 mt-2">
          {t('playerSince')} {new Date(profile.joinedAt).toLocaleDateString()}
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
                  width="24"
                  height="24"
                  loading="lazy"
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
