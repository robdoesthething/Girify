import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTopBarNav } from '../../../hooks/useTopBarNav';
import TopBar from '../../../components/TopBar';
import { Button, Card, Heading, PageHeader, Spinner, Text } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
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
  const topBarNav = useTopBarNav();

  // Custom hooks
  const profileData = useProfileData(username);
  const { state, actions } = useProfileState();
  const stats = useProfileStats(state.allHistory, state.profileData);

  // Sync fetched data to state — depend on individual fields, not the whole result object
  const {
    loading: pdLoading,
    profileData: pdProfile,
    allHistory: pdHistory,
    friendCount: pdFriendCount,
    giuros: pdGiuros,
    equippedCosmetics: pdCosmetics,
    joinedDate: pdJoinedDate,
    shopAvatars: pdShopAvatars,
    shopFrames: pdShopFrames,
    shopTitles: pdShopTitles,
  } = profileData;

  useEffect(() => {
    if (!pdLoading && pdProfile) {
      actions.loadProfileData(profileData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pdLoading,
    pdProfile,
    pdHistory,
    pdFriendCount,
    pdGiuros,
    pdCosmetics,
    pdJoinedDate,
    pdShopAvatars,
    pdShopFrames,
    pdShopTitles,
    actions,
  ]);

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
    const updates = {
      realName: newName,
      equippedCosmetics: {
        ...state.equippedCosmetics,
        avatarId: newAvatarId,
        frameId: newFrameId,
      },
    };

    await updateUserProfile(username, updates);

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
      <TopBar onOpenPage={topBarNav.onOpenPage} onTriggerLogin={topBarNav.onTriggerLogin} />

      <div className="flex-1 w-full px-4 py-8 pt-20 overflow-x-hidden">
        <div className="max-w-2xl mx-auto w-full">
          <PageHeader
            title={t('profile') || 'Profile'}
            rightElement={
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
                <span
                  className={`font-black text-lg ${themeClasses(theme, 'text-yellow-400', 'text-yellow-600')}`}
                >
                  {state.giuros}
                </span>
              </button>
            }
          />

          {state.loading && (
            <div className="py-20 flex justify-center">
              <Spinner size="lg" />
            </div>
          )}

          {state.profileData && !state.loading && (
            <>
              <AnimatePresence>
                {state.showGiurosInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="relative mb-8 filter drop-shadow-md overflow-hidden"
                  >
                    <Card
                      className={`relative z-10 !p-4 border-2 ${themeClasses(theme, '!border-slate-700', '!border-slate-900')}`}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src="/giuro.png"
                          alt=""
                          className="h-8 w-auto object-contain shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <Heading variant="h4" className="mb-1">
                            {t('giurosExplainerTitle')}
                          </Heading>
                          <Text variant="small" className="mb-3 opacity-90">
                            {t('giurosExplainerText')}
                          </Text>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/shop')}
                            className={themeClasses(
                              theme,
                              'bg-white text-slate-900',
                              'bg-slate-900 text-white'
                            )}
                          >
                            {t('goToShop')}
                          </Button>
                        </div>
                      </div>
                    </Card>
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

export default React.memo(ProfileScreen);
