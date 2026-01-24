import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../../components/TopBar';
import { useTheme } from '../../../context/ThemeContext';
import { getUnlockedAchievements } from '../../../data/achievements';
import { getAvatar } from '../../../data/avatars';
import cosmetics from '../../../data/cosmetics.json';
import { formatUsername } from '../../../utils/format';
import {
  blockUser,
  getBlockStatus,
  getFriendshipStatus,
  sendFriendRequest,
} from '../../../utils/friends';
import { getEquippedCosmetics } from '../../../utils/giuros';
import { getUserGameHistory, getUserProfile, UserProfile } from '../../../utils/social';
import { themeClasses } from '../../../utils/themeUtils';

interface PublicProfileScreenProps {
  currentUser?: string;
}

const PublicProfileScreen: React.FC<PublicProfileScreenProps> = ({ currentUser }) => {
  const { theme, t } = useTheme();
  const { username: encodedUsername } = useParams<{ username: string }>();
  const username = decodeURIComponent(encodedUsername || '');
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'pending'>('none');
  const [isBlocked, setIsBlocked] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equippedCosmetics, setEquippedCosmetics] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, cosmeticsData, historyData] = await Promise.all([
          getUserProfile(username),
          getEquippedCosmetics(username) as Promise<Record<string, string>>,
          getUserGameHistory(username),
        ]);

        if (data) {
          setProfile(data);
        } else {
          setProfile({
            username,
            uid: '', // Placeholder, as we don't have UID for non-existent profile
            email: '',
            realName: '',
            streak: 0,
            totalScore: 0,
            lastPlayDate: '',
            joinedAt: Timestamp.now(),
            gamesPlayed: 0,
            bestScore: 0,
            friendCount: 0,
            maxStreak: 0,
            avatarId: 0,
          });
        }
        setEquippedCosmetics(cosmeticsData || {});
        setHistory(historyData || []);

        if (currentUser && currentUser !== username) {
          const [status, blocked] = await Promise.all([
            getFriendshipStatus(currentUser, username) as Promise<'none' | 'friends' | 'pending'>,
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
          uid: '',
          email: '',
          realName: '',
          streak: 0,
          totalScore: 0,
          lastPlayDate: '',
          joinedAt: Timestamp.now(),
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
    if (!currentUser || sendingRequest) {
      return;
    }
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
    if (!currentUser || blocking) {
      return;
    }
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Block ${username}? They won't be able to send you friend requests.`
    );
    if (!confirmed) {
      return;
    }

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
            <div
              className={`p-8 flex flex-col items-center border-b relative ${themeClasses(theme, 'border-slate-700 bg-slate-800/50', 'border-slate-50')}`}
            >
              {loading ? (
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
              {profile?.realName && (
                <p className="text-sm font-bold opacity-50 mt-1">{profile.realName}</p>
              )}
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
                  {unlockedBadges.slice(0, 6).map(badge => (
                    <span
                      key={badge.id}
                      className="text-xl"
                      title={`${badge.name}: ${badge.description}`}
                    >
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
                  {unlockedBadges.length > 6 && (
                    <span className="text-xs text-slate-400 self-center">
                      +{unlockedBadges.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
                </div>
              ) : profile ? (
                <>
                  <div className="p-6 grid grid-cols-5 gap-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-center opacity-50">
                      <p className="text-xl font-black text-slate-400">-</p>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-inter">
                        {t('streak')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-purple-500">
                        👥{profile.friendCount || 0}
                      </p>
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
                      <p className="text-xl font-black text-emerald-500">
                        {profile.bestScore || 0}
                      </p>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-inter">
                        {t('best')}
                      </p>
                    </div>
                    <div className="text-center opacity-50">
                      <p className="text-xl font-black text-slate-400">-</p>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-inter">
                        {t('avg')}
                      </p>
                    </div>
                  </div>

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

                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg mb-4 text-sky-500 font-inter">
                      {t('recentActivity')}
                    </h3>
                    {history.length === 0 ? (
                      <p className="text-center py-4 opacity-50 text-sm font-inter">
                        No recent games
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {history.slice(0, 5).map((game, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses(theme, 'bg-slate-800/50 border-slate-700', 'bg-white border-slate-100')}`}
                          >
                            <div>
                              <p className="font-bold text-xs font-inter uppercase tracking-wider opacity-70">
                                {t('dailyChallenge')}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {game.date || 'Unknown Date'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-lg text-emerald-500 font-inter">
                                {game.score}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 ml-1 font-inter">
                                PTS
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {currentUser && currentUser !== username && (
                    <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-800/20">
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
                            type="button"
                          >
                            {sendingRequest ? 'Sending Friend Request...' : '👋 Add Friend'}
                          </button>
                        ))}

                      {isBlocked ? (
                        <div className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-center text-sm font-bold">
                          🚫 Blocked
                        </div>
                      ) : (
                        <button
                          onClick={handleBlock}
                          disabled={blocking}
                          className={`w-full py-3 rounded-xl text-sm font-bold transition-all opacity-60 hover:opacity-100 ${themeClasses(theme, 'text-red-400 hover:bg-red-500/10', 'text-red-500 hover:bg-red-50')}`}
                          type="button"
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
