import React, { useMemo } from 'react';
import { CosmeticAvatar } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { AVATARS } from '../../../data/avatars';
import { UserProfile } from '../../../types/user';
import { formatUsername } from '../../../utils/format';
import { ShopItem } from '../../../utils/shop';
import { getCosmeticAvatarImage, getFrameClass, getTitleName } from '../../../utils/shop/catalog';
import { EquippedCosmetics } from '../../../utils/social/types';
import { themeClasses } from '../../../utils/themeUtils';
import { parseJoinedDate } from '../utils/profileHelpers';

interface ProfileHeaderProps {
  username: string;
  profileData: UserProfile;
  cosmetics: {
    equipped: EquippedCosmetics;
    allAvatars: ShopItem[];
    allFrames: ShopItem[];
    allTitles: ShopItem[];
  };
  onEdit: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  profileData,
  cosmetics,
  onEdit,
}) => {
  const { theme, t } = useTheme();

  const joinedDate = useMemo(
    () => parseJoinedDate(profileData.joinedAt).toLocaleDateString(),
    [profileData.joinedAt]
  );

  const equippedAvatarId = cosmetics.equipped?.avatarId;
  // Prefer the live (DB-merged) shop items, fall back to the bundled catalog
  const cosmeticAvatar = cosmetics.allAvatars.find(a => a.id === equippedAvatarId);
  const avatarImage = (cosmeticAvatar?.image as string) || getCosmeticAvatarImage(equippedAvatarId);
  const legacyAvatarIndex = profileData?.avatarId ? profileData.avatarId - 1 : 0;
  const legacyAvatar = AVATARS[Math.max(0, Math.min(legacyAvatarIndex, AVATARS.length - 1))];
  const equippedFrame = cosmetics.allFrames.find(f => f.id === cosmetics.equipped.frameId);
  const frameClass = equippedFrame?.cssClass || getFrameClass(cosmetics.equipped.frameId);
  const titleName =
    cosmetics.allTitles.find(tItem => tItem.id === cosmetics.equipped.titleId)?.name ||
    getTitleName(cosmetics.equipped.titleId);

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative group mb-4">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer hover:scale-105 active:scale-95 transition-transform relative"
          aria-label={t('changeAvatar') || 'Change avatar'}
        >
          <CosmeticAvatar
            image={avatarImage}
            fallback={legacyAvatar}
            size={112}
            alt="Avatar"
            className={`shadow-2xl ${frameClass}`}
          />
          <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors" />
        </button>

        <button
          onClick={onEdit}
          className={`absolute -bottom-1 -right-1 p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform ${themeClasses(theme, 'bg-slate-700 text-white', 'bg-white text-slate-900')}`}
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
        {profileData.realName && (
          <p className="text-sm font-medium opacity-60 mb-2">{profileData.realName}</p>
        )}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest opacity-65 mt-3 font-mono">
        {t('playerSince')} {joinedDate}
      </p>

      <div className="text-center mb-6 mt-4">
        <p className="text-sm font-bold text-sky-500 uppercase tracking-widest mt-1 font-inter">
          {titleName}
        </p>
      </div>
    </div>
  );
};

export default ProfileHeader;
