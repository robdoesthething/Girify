import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getFriendCount, getUserProfile, updateUserProfile } from '../utils/social';
import { getGiuros, getEquippedCosmetics } from '../utils/giuros';
import cosmetics from '../data/cosmetics.json';
import { getUnlockedAchievements, getNextAchievement } from '../data/achievements';
import FriendRequests from './FriendRequests';
import TopBar from './TopBar';
import PropTypes from 'prop-types';

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

// Helper to calculate daily streak from history
const calculateStreak = history => {
  if (!history || history.length === 0) return 0;

  // Sort by date descending
  const sorted = [...history].sort((a, b) => b.date - a.date);

  // Get today's date seed (YYYYMMDD format)
  const today = new Date();
  const todaySeed = parseInt(
    `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  );

  let streak = 0;
  let expectedDate = todaySeed;

  for (const record of sorted) {
    if (record.date === expectedDate) {
      streak++;
      // Move to previous day
      const d = new Date(today);
      d.setDate(d.getDate() - streak);
      expectedDate = parseInt(
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      );
    } else if (record.date < expectedDate) {
      break;
    }
  }

  return streak;
};

const ProfileScreen = ({ onClose, username }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();

  // Initialize state functions to avoid synchronous effect updates
  // allHistory = ALL games played (for total count)
  // uniqueHistory = only first game per day (for streak calculation)
  const [allHistory] = useState(() => {
    try {
      const rawHistory = localStorage.getItem('girify_history');
      const parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
      return Array.isArray(parsedHistory) ? parsedHistory : [];
    } catch (e) {
      console.error('Profile data load error:', e);
      return [];
    }
  });

  // For streak calculation, we need unique days
  const uniqueHistory = React.useMemo(() => {
    const seenDates = new Set();
    const uniqueList = [];
    allHistory.forEach(game => {
      if (!seenDates.has(game.date)) {
        seenDates.add(game.date);
        uniqueList.push(game);
      }
    });
    return uniqueList;
  }, [allHistory]);

  const [joinedDate] = useState(() => {
    return localStorage.getItem('girify_joined') || new Date().toLocaleDateString();
  });

  const [friendCount, setFriendCount] = useState(0);
  const [giuros, setGiuros] = useState(0);
  const [equippedCosmetics, setEquippedCosmetics] = useState({});

  // Profile Edit State
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatarId, setEditAvatarId] = useState(0); // 0-indexed for array

  useEffect(() => {
    const loadProfile = async () => {
      if (username) {
        const [count, bal, equipped] = await Promise.all([
          getFriendCount(username),
          getGiuros(username),
          getEquippedCosmetics(username),
        ]);
        setFriendCount(count);
        setGiuros(bal);
        setEquippedCosmetics(equipped);

        const profile = await getUserProfile(username);
        if (profile) {
          setProfileData(profile);
          setEditName(profile.realName || '');
          // If avatarId is stored as 1-20, subtract 1 for array index. Default to 0.
          setEditAvatarId(profile.avatarId ? profile.avatarId - 1 : 0);
        }
      }
    };
    loadProfile();
  }, [username]);

  const handleSaveProfile = async () => {
    // Save realName and avatarId
    const data = {
      realName: editName,
      avatarId: editAvatarId + 1, // Store as 1-based ID
    };
    await updateUserProfile(username, data);
    setProfileData(prev => ({ ...prev, ...data }));
    setIsEditing(false);
  };

  const cycleAvatar = () => {
    setEditAvatarId(prev => (prev + 1) % AVATARS.length);
  };

  const totalGames = allHistory.length; // Use ALL games, not just unique days
  const bestScore = totalGames > 0 ? Math.max(...allHistory.map(h => (h && h.score) || 0)) : 0;
  const totalScore = allHistory.reduce((acc, curr) => acc + ((curr && curr.score) || 0), 0);
  const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
  const dailyStreak = calculateStreak(uniqueHistory); // Use unique days for streak

  // Achievement badges
  const userStats = { gamesPlayed: totalGames, bestScore, streak: dailyStreak };
  const unlockedBadges = getUnlockedAchievements(userStats);
  const nextBadge = getNextAchievement(userStats);

  // Determine display avatar
  const currentAvatarId = isEditing
    ? editAvatarId
    : profileData?.avatarId
      ? profileData.avatarId - 1
      : 0;

  // Safe bounds check
  const safeAvatarIndex = Math.max(0, Math.min(currentAvatarId, AVATARS.length - 1));
  const displayAvatar = AVATARS[safeAvatarIndex];

  // Get equipped frame class
  const equippedFrame = cosmetics.avatarFrames.find(f => f.id === equippedCosmetics.frameId);
  const frameClass = equippedFrame?.cssClass || 'ring-4 ring-white dark:ring-slate-700';

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
           ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}
      `}
    >
      <TopBar onOpenPage={page => navigate(page ? `/${page}` : '/')} />

      <div className="flex-1 overflow-y-auto w-full px-4 py-6 pt-16">
        <div className="max-w-2xl mx-auto">
          {/* Giuros Balance Bar */}
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

            {/* Giuros Balance */}
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors"
            >
              <img src="/giuro.png" alt="Giuros" className="h-5 w-auto object-contain" />
              <span className="font-black text-yellow-600 dark:text-yellow-400">{giuros}</span>
            </button>
          </div>

          {/* Giuros Explainer Callout */}
          <div
            className={`mb-6 p-4 rounded-2xl border ${
              theme === 'dark'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <img src="/giuro.png" alt="" className="h-8 w-auto object-contain shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                  {t('giurosExplainerTitle')}
                </h4>
                <p className="text-sm text-yellow-600/80 dark:text-yellow-300/70 mb-3">
                  {t('giurosExplainerText')}
                </p>
                <button
                  onClick={() => navigate('/shop')}
                  className="text-sm font-bold text-yellow-700 dark:text-yellow-400 hover:underline flex items-center gap-1"
                >
                  {t('goToShop')} →
                </button>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div
            className={`rounded-3xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
          >
            {/* Header with Avatar */}
            <div
              className={`p-8 flex flex-col items-center border-b shrink-0 relative ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}
            >
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Edit Button (Top Left) */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`absolute top-4 left-4 p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-sky-400' : 'hover:bg-slate-100 text-sky-600'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              )}

              {/* Avatar Circle */}
              <div className="relative group">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={isEditing ? cycleAvatar : undefined}
                  onKeyDown={e => {
                    if (isEditing && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      cycleAvatar();
                    }
                  }}
                  className={`w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-4xl shadow-lg mb-4 ${frameClass} select-none outline-none focus:ring-sky-500
                ${isEditing ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
              `}
                >
                  {displayAvatar}
                </div>
                {isEditing && (
                  <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 rounded-full p-1 shadow-md">
                    <svg
                      className="w-4 h-4 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Handle / Name Display */}
              <h2 className="text-2xl font-black tracking-tight">{username}</h2>

              {/* Achievement Badges (earned through gameplay) */}
              {unlockedBadges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
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

              {isEditing ? (
                <div className="mt-2 w-full max-w-[200px]">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your Real Name"
                    onKeyDown={e => {
                      if (e.key === ' ') e.stopPropagation(); // prevent game hotkeys if any
                    }}
                    className={`w-full px-3 py-1 text-center text-sm rounded-lg border outline-none ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                  />
                  <div className="flex justify-center gap-2 mt-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs px-3 py-1 rounded bg-slate-200 dark:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="text-xs px-3 py-1 rounded bg-sky-500 text-white"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                profileData?.realName && (
                  <p className="text-sm font-medium opacity-70 mt-1">
                    {profileData.realName}{' '}
                    <span className="text-[10px] opacity-50 uppercase">(Private)</span>
                  </p>
                )
              )}

              <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-2">
                {t('playerSince')} {joinedDate}
              </p>
            </div>

            {/* Friend Requests */}
            <div className="px-6 pt-4">
              <FriendRequests username={username} />
            </div>

            {/* Stats Grid */}
            <div className="p-6 grid grid-cols-5 gap-2 border-b border-slate-100 dark:border-slate-800">
              <div className="text-center">
                <p className="text-xl font-black text-orange-500">🔥{dailyStreak}</p>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('streak')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-purple-500">👥{friendCount}</p>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('friends')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-700 dark:text-slate-200">
                  {totalGames}
                </p>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('games')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-emerald-500">{bestScore}</p>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('best')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-sky-500">{avgScore}</p>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('avg')}
                </p>
              </div>
            </div>

            {/* Achievements Section */}
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
                <p className="text-sm opacity-50 text-center py-4">
                  Play games to unlock achievements!
                </p>
              )}

              {/* Next Achievement Progress */}
              {nextBadge && (
                <div
                  className={`mt-4 p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold opacity-60">{t('nextAchievement')}</span>
                    <span className="text-lg">{nextBadge.emoji}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex-1 h-2 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'}`}
                    >
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                        style={{ width: `${Math.round(nextBadge.progress * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold opacity-60">
                      {Math.round(nextBadge.progress * 100)}%
                    </span>
                  </div>
                  <p className="text-xs opacity-50 mt-1">
                    {nextBadge.name}: {nextBadge.description}
                  </p>
                </div>
              )}
            </div>

            {/* Recent History */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-4">
                {t('recentActivity')}
              </h3>

              {allHistory.length === 0 ? (
                <div className="text-center py-10 opacity-40 text-sm">{t('noGamesYet')}</div>
              ) : (
                <div className="space-y-3">
                  {allHistory
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((game, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100'}`}
                      >
                        <div>
                          <p className="font-bold text-sm">{t('dailyChallenge')}</p>
                          <p className="text-[10px] text-slate-400">
                            {game.timestamp
                              ? new Date(game.timestamp).toLocaleDateString()
                              : 'Just now'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-lg text-emerald-500">{game.score}</span>
                          <span className="text-[10px] font-bold text-slate-400 ml-1">PTS</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ProfileScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
};

export default ProfileScreen;
