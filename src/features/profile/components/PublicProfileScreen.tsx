import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../../components/TopBar';
import { useTheme } from '../../../context/ThemeContext';
import { getUnlockedAchievements } from '../../../data/achievements';
import { themeClasses } from '../../../utils/themeUtils';
import { usePublicProfile } from '../hooks/usePublicProfile';
import FriendActions from './FriendActions';
import ProfileAchievements from './ProfileAchievements';
import ProfileActivity from './ProfileActivity';
import ProfileStats from './ProfileStats';
import PublicProfileHeader from './PublicProfileHeader';

interface PublicProfileScreenProps {
  currentUser?: string;
}

const PublicProfileScreen: React.FC<PublicProfileScreenProps> = ({ currentUser }) => {
  const { theme, t } = useTheme();
  const { username: encodedUsername } = useParams<{ username: string }>();
  const username = decodeURIComponent(encodedUsername || '');
  const navigate = useNavigate();

  const {
    profile,
    loading,
    friendStatus,
    isBlocked,
    sendingRequest,
    requestSent,
    blocking,
    error,
    equippedCosmetics,
    history,
    handleAddFriend,
    handleBlock,
  } = usePublicProfile(username, currentUser);

  const userStats = {
    gamesPlayed: profile?.gamesPlayed || 0,
    bestScore: profile?.bestScore || 0,
    streak: 0,
  };
  const unlockedBadges = getUnlockedAchievements(userStats);

  const showFriendActions = currentUser && currentUser !== username;

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <TopBar
        onOpenPage={page => navigate(page ? `/${page}` : '/')}
        onTriggerLogin={mode => navigate(`/?auth=${mode}`)}
      />

      <div className="flex-1 overflow-y-auto w-full px-4 py-8 pt-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
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
            <h1 className="text-xl font-black">{t('profile')}</h1>
            <div className="w-16" />
          </div>

          <div
            className={`rounded-3xl shadow-xl overflow-hidden border ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-100')}`}
          >
            <PublicProfileHeader
              profile={profile}
              isLoading={loading}
              equippedCosmetics={equippedCosmetics}
              username={username}
            />

            <div className="p-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
                </div>
              ) : profile ? (
                <>
                  <ProfileStats profile={profile} isLoading={loading} />
                  <ProfileAchievements unlockedBadges={unlockedBadges} />
                  <ProfileActivity history={history} />

                  {showFriendActions && (
                    <FriendActions
                      isBlocked={isBlocked}
                      friendStatus={friendStatus}
                      requestSent={requestSent}
                      sendingRequest={sendingRequest}
                      blocking={blocking}
                      onAddFriend={handleAddFriend}
                      onBlock={handleBlock}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-8 opacity-50">
                  <p>{error || 'Profile not found'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfileScreen;
