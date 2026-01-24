import React, { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { AVATARS } from '../../../data/avatars';
import { UserProfile } from '../../../types/user';
import { formatUsername } from '../../../utils/format';
import { ShopItem } from '../../../utils/shop';
import { themeClasses } from '../../../utils/themeUtils';
import { parseJoinedDate } from '../utils/profileHelpers';

interface ProfileHeaderProps {
  username: string;
  profileData: UserProfile;
  cosmetics: {
    equipped: Record<string, string>;
    allAvatars: ShopItem[];
    allFrames: ShopItem[];
    allTitles: ShopItem[];
  };
  onEdit: () => void;
  onNavigateShop: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  profileData,
  cosmetics,
  onEdit,
  onNavigateShop,
}) => {
  const { theme, t } = useTheme();

  const joinedDate = useMemo(
    () => parseJoinedDate(profileData.joinedAt).toLocaleDateString(),
    [profileData.joinedAt]
  );

  const equippedAvatarId = cosmetics.equipped?.avatarId;
  const cosmeticAvatar = cosmetics.allAvatars.find(a => a.id === equippedAvatarId);
  const legacyAvatarIndex = profileData?.avatarId ? profileData.avatarId - 1 : 0;
  const legacyAvatar = AVATARS[Math.max(0, Math.min(legacyAvatarIndex, AVATARS.length - 1))];
  const equippedFrame = cosmetics.allFrames.find(f => f.id === cosmetics.equipped.frameId);
  const frameClass = equippedFrame?.cssClass || 'ring-4 ring-white dark:ring-slate-700';
  const titleName =
    cosmetics.allTitles.find(tItem => tItem.id === cosmetics.equipped.titleId)?.name ||
    'Street Explorer';

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative group mb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={onNavigateShop}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              onNavigateShop();
            }
          }}
          className={`w-28 h-28 rounded-full ${cosmeticAvatar ? 'bg-transparent' : 'bg-gradient-to-br from-sky-400 to-indigo-600'} flex items-center justify-center text-5xl shadow-2xl ${frameClass} select-none outline-none focus:ring-sky-500 cursor-pointer hover:scale-105 transition-transform overflow-hidden`}
        >
          {cosmeticAvatar ? (
            <img
              src={cosmeticAvatar.image as string}
              alt="Avatar"
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated', mixBlendMode: 'multiply' }}
            />
          ) : (
            legacyAvatar
          )}
        </div>

        <button
          onClick={onEdit}
          className={`absolute -bottom-1 -right-1 p-2 rounded-full shadow-lg ${themeClasses(theme, 'bg-slate-700 text-white', 'bg-white text-slate-900')}`}
          type="button"
          aria-label={t('editProfile') || 'Edit Profile'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>

      <h2 className="text-3xl font-black tracking-tight mb-1">{formatUsername(username)}</h2>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium opacity-60 mb-2">
          {profileData.realName || t('unknownName') || 'Unknown Player'}
        </p>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-3 font-mono">
        {t('playerSince')} {joinedDate}
      </p>

      <div className="text-center mb-6 mt-4">
        <p className="text-sm font-bold text-sky-500 uppercase tracking-widest mt-1 font-inter">
          {titleName}
        </p>
        <p className="text-xs opacity-50 mt-1">Joined {joinedDate}</p>
      </div>
    </div>
  );
};

export default ProfileHeader;
