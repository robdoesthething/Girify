import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../../components/TopBar';
import { useTheme } from '../../../context/ThemeContext';
import { UserProfile } from '../../../types/user';
import { updateUserProfile } from '../../../utils/social';
import { themeClasses } from '../../../utils/themeUtils';
import { useProfileData } from '../hooks/useProfileData';
import { useProfileState } from '../hooks/useProfileState';
import { useProfileStats } from '../hooks/useProfileStats';
import { calculateOwnedCosmetics } from '../utils/profileHelpers';
import AchievementsList from './AchievementsList';
import EditProfileModal from './EditProfileModal';
import ProfileHeader from './ProfileHeader';
import RecentActivity from './RecentActivity';
import StatsGrid from './StatsGrid';

interface ProfileScreenProps {
  username: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ username }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();

  // Custom hooks
  const profileData = useProfileData(username);
  const { state, actions } = useProfileState();
  const stats = useProfileStats(state.allHistory, state.profileData);

  // Sync fetched data to state
  useEffect(() => {
    if (!profileData.loading && profileData.profileData) {
      actions.loadProfileData(profileData);
    }
  }, [profileData, actions]);

  // Calculate owned cosmetics
  const ownedAvatars = useMemo(
    () => calculateOwnedCosmetics(state.profileData, state.shopAvatars),
    [state.profileData, state.shopAvatars]
  );

  const ownedFrames = useMemo(
    () => calculateOwnedCosmetics(state.profileData, state.shopFrames),
    [state.profileData, state.shopFrames]
  );

  const handleSaveProfile = async (newName: string, newAvatarId: string, newFrameId: string) => {
    const updates: Partial<UserProfile> = {
      realName: newName,
      equippedCosmetics: {
        ...state.equippedCosmetics,
        avatarId: newAvatarId,
        frameId: newFrameId,
      },
    };

    await updateUserProfile(username, updates as any);

    // Update local state
    actions.updateProfile(updates);

    // Refetch profile data instead of page reload
    await profileData.refetch();

    actions.setEditing(false);
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <TopBar
        onOpenPage={page => navigate(page ? `/${page}` : '/')}
        onTriggerLogin={mode => navigate(`/?auth=${mode}`)}
      />

      <div className="flex-1 w-full px-4 py-8 pt-20 overflow-x-hidden">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8 relative">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity z-10"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('back')}
            </button>
            <h1 className="text-xl font-black absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 max-w-[60%] truncate justify-center font-inter">
              {t('profile') || 'Profile'}
            </h1>

            <button
              onClick={() => actions.toggleGiurosInfo()}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
              type="button"
              aria-label={`${state.giuros} Giuros`}
            >
              <img
                src="/giuro.png"
                alt=""
                aria-hidden="true"
                className="h-6 w-auto object-contain"
              />
              <span className="font-black text-lg text-yellow-600 dark:text-yellow-400">
                {state.giuros}
              </span>
            </button>
          </div>

          {state.loading && <div className="py-10 text-center opacity-50">Loading profile...</div>}

          {state.profileData && !state.loading && (
            <>
              <AnimatePresence>
                {state.showGiurosInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="relative mb-8 mx-2 filter drop-shadow-md overflow-hidden"
                  >
                    <div className="p-4 rounded-xl border-2 border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white relative z-10">
                      <div className="flex items-start gap-4">
                        <img
                          src="/giuro.png"
                          alt=""
                          className="h-8 w-auto object-contain shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <h3 className="font-black text-lg mb-1">{t('giurosExplainerTitle')}</h3>
                          <p className="text-sm opacity-80 mb-3 leading-relaxed font-inter">
                            {t('giurosExplainerText')}
                          </p>
                          <button
                            onClick={() => navigate('/shop')}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-black uppercase tracking-wider hover:scale-105 transition-transform"
                            type="button"
                          >
                            {t('goToShop')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ProfileHeader
                username={username}
                profileData={state.profileData}
                cosmetics={{
                  equipped: state.equippedCosmetics,
                  allAvatars: state.shopAvatars,
                  allFrames: state.shopFrames,
                  allTitles: state.shopTitles,
                }}
                onEdit={() => actions.setEditing(true)}
                onNavigateShop={() => navigate('/shop')}
              />

              <EditProfileModal
                isOpen={state.isEditing}
                onClose={() => actions.setEditing(false)}
                onSave={handleSaveProfile}
                currentName={state.profileData.realName || ''}
                currentAvatarId={state.equippedCosmetics.avatarId || ''}
                currentFrameId={state.equippedCosmetics.frameId || ''}
                ownedAvatars={ownedAvatars}
                ownedFrames={ownedFrames}
                allAvatars={state.shopAvatars}
              />

              <StatsGrid
                stats={{
                  dailyStreak: stats.dailyStreak,
                  maxStreak: state.profileData.maxStreak || 0,
                  friendCount: state.friendCount,
                  totalGames: stats.totalGames,
                  bestScore: stats.bestScore,
                  totalScore: stats.totalScore,
                }}
              />

              <AchievementsList
                unlockedBadges={stats.unlockedBadges}
                nextBadge={stats.nextBadge}
                selectedAchievement={state.selectedAchievement}
                onSelectAchievement={actions.setSelectedAchievement}
              />

              <RecentActivity history={state.allHistory} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
