import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getUserProfile } from '../utils/social';
import {
  sendFriendRequest,
  getFriendshipStatus,
  blockUser,
  getBlockStatus,
} from '../utils/friends';
import { getEquippedCosmetics } from '../utils/giuros';
import { getUnlockedAchievements } from '../data/achievements';
import cosmetics from '../data/cosmetics.json';
import TopBar from './TopBar';

const AVATARS = [
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',
  '🐔',
  '🐧',
  '🐦',
  '🦆',
  '🦅',
];

const PublicProfileScreen = ({ currentUser }) => {
  const { theme, t } = useTheme();
  const { username: encodedUsername } = useParams();
  const username = decodeURIComponent(encodedUsername || '');
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none');
  const [isBlocked, setIsBlocked] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState(null);
  const [equippedCosmetics, setEquippedCosmetics] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, cosmeticsData] = await Promise.all([
          getUserProfile(username),
          getEquippedCosmetics(username),
        ]);

        if (data) {
          setProfile(data);
        } else {
          setProfile({
            username,
            gamesPlayed: 0,
            bestScore: 0,
            friendCount: 0,
          });
        }
        setEquippedCosmetics(cosmeticsData || {});

        if (currentUser && currentUser !== username) {
          const [status, blocked] = await Promise.all([
            getFriendshipStatus(currentUser, username),
            getBlockStatus(currentUser, username),
          ]);
          setFriendStatus(status);
          setIsBlocked(blocked);
          if (status === 'pending') {
            setRequestSent(true);
          }
        }
      } catch (e) {
        console.error('Error loading profile:', e);
        setError('Failed to load profile');
        setProfile({
          username,
          gamesPlayed: 0,
          bestScore: 0,
          friendCount: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    if (username) {
      loadProfile();
    }
  }, [username, currentUser]);

  const handleAddFriend = async () => {
    if (!currentUser || sendingRequest) return;
    setSendingRequest(true);
    try {
      await sendFriendRequest(currentUser, username);
      setRequestSent(true);
      setFriendStatus('pending');
    } catch (e) {
      console.error('Error sending friend request:', e);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleBlock = async () => {
    if (!currentUser || blocking) return;
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Block ${username}? They won't be able to send you friend requests.`
    );
    if (!confirmed) return;

    setBlocking(true);
    try {
      await blockUser(currentUser, username);
      setIsBlocked(true);
    } catch (e) {
      console.error('Error blocking user:', e);
    } finally {
      setBlocking(false);
    }
  };

  // Avatar Calculation
  const avatarIndex = profile?.avatarId ? profile.avatarId - 1 : 0;
  const safeAvatarIndex = Math.max(0, Math.min(avatarIndex, AVATARS.length - 1));
  const displayAvatar = AVATARS[safeAvatarIndex] || AVATARS[0];
  const initial = username ? username.charAt(0).toUpperCase() : '?';

  // Frame Calculation
  const equippedFrame = cosmetics.avatarFrames.find(f => f.id === equippedCosmetics.frameId);
  const frameClass = equippedFrame?.cssClass || 'ring-4 ring-white dark:ring-slate-700';

  // Achievements Calculation
  // We don't have streak in public profile, so we pass 0 or a best guess
  const userStats = {
    gamesPlayed: profile?.gamesPlayed || 0,
    bestScore: profile?.bestScore || 0,
    streak: 0, // Not available publicly
  };
  const unlockedBadges = getUnlockedAchievements(userStats);

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
           ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}
      `}
    >
      <TopBar onOpenPage={page => navigate(page ? `/${page}` : '/')} />

      <div className="flex-1 overflow-y-auto w-full px-4 py-8 pt-16">
        <div className="max-w-2xl mx-auto">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
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
            <div className="w-16"></div> {/* Spacer for alignment */}
          </div>

          <div
            className={`rounded-3xl shadow-xl overflow-hidden border
                        ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}
                    `}
          >
            {/* Header */}
            <div
              className={`p-8 flex flex-col items-center border-b relative ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-800/50'
                  : 'border-slate-100 bg-slate-50'
              }`}
            >
              {loading ? (
                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse mb-4"></div>
              ) : (
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-4xl shadow-lg mb-4 ${frameClass}`}
                >
                  {profile && profile.avatarId ? displayAvatar : initial}
                </div>
              )}

              <h2 className="text-2xl font-black tracking-tight">{username}</h2>
              {profile?.realName && (
                <p className="text-sm font-bold opacity-50 mt-1">{profile.realName}</p>
              )}
              {profile?.joinedAt && (
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mt-2">
                  {t('playerSince')}{' '}
                  {profile.joinedAt.toDate
                    ? profile.joinedAt.toDate().toLocaleDateString()
                    : new Date(profile.joinedAt.seconds * 1000).toLocaleDateString()}
                </p>
              )}

              {/* Achievements Badges (Small Row) */}
              {unlockedBadges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {unlockedBadges.slice(0, 6).map(badge => (
                    <span
                      key={badge.id}
                      className="text-xl"
                      title={`${badge.name}: ${badge.description}`}
                    >
                      {badge.emoji}
                    </span>
                  ))}
                  {unlockedBadges.length > 6 && (
                    <span className="text-xs text-slate-400 self-center">
                      +{unlockedBadges.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-0">
              {' '}
              {/* Padding removed to match ProfileScreen stats spacing */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                </div>
              ) : profile ? (
                <>
                  {/* Stats Grid */}
                  <div className="p-6 grid grid-cols-5 gap-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-center opacity-50">
                      {/* Streak Unknown */}
                      <p className="text-xl font-black text-slate-400">-</p>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        {t('streak')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-purple-500">
                        👥{profile.friendCount || 0}
                      </p>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        {t('friends')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-slate-700 dark:text-slate-200">
                        {profile.gamesPlayed || 0}
                      </p>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        {t('games')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-emerald-500">
                        {profile.bestScore || 0}
                      </p>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        {t('best')}
                      </p>
                    </div>
                    <div className="text-center opacity-50">
                      {/* Avg Unknown */}
                      <p className="text-xl font-black text-slate-400">-</p>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        {t('avg')}
                      </p>
                    </div>
                  </div>

                  {/* Achievements Detail Block */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-4">
                      {t('achievements')} ({unlockedBadges.length})
                    </h3>
                    {unlockedBadges.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {unlockedBadges.map(badge => (
                          <div
                            key={badge.id}
                            className={`flex flex-col items-center p-2 rounded-xl ${
                              theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'
                            }`}
                            title={badge.description}
                          >
                            <span className="text-2xl mb-1">{badge.emoji}</span>
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

                  {/* Actions Area */}
                  {currentUser && currentUser !== username && (
                    <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-800/20">
                      {/* Friend Button */}
                      {!isBlocked &&
                        (friendStatus === 'friends' ? (
                          <div className="w-full py-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-center font-bold border border-emerald-500/20">
                            ✅ Friends
                          </div>
                        ) : friendStatus === 'pending' || requestSent ? (
                          <div className="w-full py-4 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl text-center font-bold border border-yellow-500/20">
                            ⏳ Request Pending
                          </div>
                        ) : (
                          <button
                            onClick={handleAddFriend}
                            disabled={sendingRequest}
                            className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
                          >
                            {sendingRequest ? 'Sending Friend Request...' : '👋 Add Friend'}
                          </button>
                        ))}

                      {/* Block Button */}
                      {isBlocked ? (
                        <div className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-center text-sm font-bold">
                          🚫 Blocked
                        </div>
                      ) : (
                        <button
                          onClick={handleBlock}
                          disabled={blocking}
                          className={`w-full py-3 rounded-xl text-sm font-bold transition-all opacity-60 hover:opacity-100
                                      ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}
                                  `}
                        >
                          {blocking ? 'Blocking...' : '🚫 Block User'}
                        </button>
                      )}
                    </div>
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
