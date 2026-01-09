import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getFriendCount, getUserProfile, updateUserProfile } from '../utils/social';
import { getGiuros, getEquippedCosmetics } from '../utils/giuros';
import cosmetics from '../data/cosmetics.json';
import { getUnlockedAchievements, getNextAchievement } from '../data/achievements';
import { calculateStreak } from '../utils/stats';
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

const ProfileScreen = ({ username }) => {
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

  // Show/Hide Giuros Info
  const [showGiurosInfo, setShowGiurosInfo] = useState(false);

  // Achievements State
  const [selectedAchievement, setSelectedAchievement] = useState(null);

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
  // const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0; // Unused
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

      <div className="flex-1 w-full px-4 py-8 pt-20 overflow-x-hidden">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity z-10"
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
            <h1 className="text-xl font-black absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 max-w-[60%] truncate justify-center">
              {t('profile') || 'Profile'}
            </h1>

            {/* Giuros Balance */}
            <button
              onClick={() => setShowGiurosInfo(!showGiurosInfo)}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <img src="/giuro.png" alt="Giuros" className="h-6 w-auto object-contain" />
              <span className="font-black text-lg text-yellow-600 dark:text-yellow-400">
                {giuros}
              </span>
            </button>
          </div>

          {!profileData && (
            // Loading state
            <div className="py-10 text-center opacity-50">Loading profile...</div>
          )}

          {profileData && (
            <>
              {/* Giuros Explainer Callout - Hidden by default, toggled by clicking icon */}
              <AnimatePresence>
                {showGiurosInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="relative mb-8 mx-2 filter drop-shadow-md overflow-hidden"
                  >
                    <div
                      className={`p-4 rounded-xl border-2 border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white relative z-10`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src="/giuro.png"
                          alt=""
                          className="h-8 w-auto object-contain shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <h3 className="font-black text-lg mb-1">{t('giurosExplainerTitle')}</h3>
                          <p className="text-sm opacity-80 mb-3 leading-relaxed">
                            {t('giurosExplainerText')}
                          </p>
                          <button
                            onClick={() => navigate('/shop')}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-black uppercase tracking-wider hover:scale-105 transition-transform"
                          >
                            {t('goToShop')}
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Speech Bubble Tail */}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Profile Info - Removed Card Style, now cleaner layout */}
              <div className="flex flex-col items-center mb-8">
                {/* Avatar Circle */}
                <div className="relative group mb-4">
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
                    className={`w-28 h-28 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-5xl shadow-2xl ${frameClass} select-none outline-none focus:ring-sky-500
                ${isEditing ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
              `}
                  >
                    {displayAvatar}
                  </div>
                  {/* Edit Button overlay */}
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`absolute -bottom-1 -right-1 p-2 rounded-full shadow-lg ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  )}
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
                <h2 className="text-3xl font-black tracking-tight mb-1">
                  {username.toLowerCase()}
                </h2>

                {/* Equipped Title + Real Name */}
                <div className="flex flex-col items-center gap-1">
                  {/* Show equipped title badge/icon if any */}
                  {/* (Assuming titleId maps to a string or object in future, just showing emoji for now if applicable) */}

                  {isEditing ? (
                    <div className="mt-2 w-full max-w-[200px] flex flex-col gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Your Real Name"
                        onKeyDown={e => {
                          if (e.key === ' ') e.stopPropagation(); // prevent game hotkeys if any
                        }}
                        className={`w-full px-3 py-2 text-center text-sm rounded-lg border outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                      />
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="flex-1 text-xs px-3 py-2 rounded-lg bg-sky-500 text-white font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-3">
                  {t('playerSince')} {joinedDate}
                </p>
              </div>

              {/* Friend Requests */}
              <div className="mb-6">
                <FriendRequests username={username} />
              </div>

              {/* Stats Grid - Clean, no borders, just icons */}
              <div className="grid grid-cols-5 gap-4 mb-8">
                <div className="flex flex-col items-center p-3 rounded-2xl bg-orange-500/10 dark:bg-orange-500/5">
                  <span className="text-2xl mb-1">🔥</span>
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-xl font-black text-orange-500">{dailyStreak}</span>
                    <span className="text-[10px] font-bold opacity-50">
                      Max: {Math.max(dailyStreak, profileData?.maxStreak || 0)}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                    {t('streak')}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/5">
                  <span className="text-2xl mb-1">👥</span>
                  <span className="text-xl font-black text-purple-500">{friendCount}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                    {t('friends')}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-500/10 dark:bg-slate-500/5">
                  <span className="text-2xl mb-1">🎮</span>
                  <span className="text-xl font-black text-slate-700 dark:text-slate-200">
                    {totalGames}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                    {t('games')}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5">
                  <span className="text-2xl mb-1">🏆</span>
                  <span className="text-xl font-black text-emerald-500">{bestScore}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                    {t('best')}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-sky-500/10 dark:bg-sky-500/5">
                  <span className="text-2xl mb-1">⚡️</span>
                  <span className="text-xl font-black text-sky-500">
                    {totalScore >= 1000 ? `${(totalScore / 1000).toFixed(1)}k` : totalScore}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                    Total
                  </span>
                </div>
              </div>

              {/* Achievements Section */}
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-4 text-sky-500 flex items-center gap-2">
                  {t('achievements')}{' '}
                  <span className="text-sm opacity-60 text-slate-500 dark:text-slate-400">
                    ({unlockedBadges.length})
                  </span>
                </h3>

                {unlockedBadges.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {unlockedBadges.map(badge => (
                      <button
                        key={badge.id}
                        onClick={() =>
                          setSelectedAchievement(
                            selectedAchievement?.id === badge.id ? null : badge
                          )
                        }
                        className={`flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer border w-full h-full text-left ${
                          selectedAchievement?.id === badge.id
                            ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/20 scale-105 shadow-md'
                            : theme === 'dark'
                              ? 'bg-slate-800 border-transparent hover:bg-slate-700'
                              : 'bg-white border-transparent shadow-sm hover:shadow-md'
                        }`}
                        title={badge.description}
                      >
                        <span className="text-3xl mb-1">{badge.emoji}</span>
                        <span className="text-[10px] text-center font-bold opacity-70 leading-tight">
                          {badge.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm opacity-50 text-center py-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    Play games to unlock achievements!
                  </p>
                )}

                {/* Selected Achievement Detail View */}
                <AnimatePresence>
                  {selectedAchievement && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 overflow-hidden"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{selectedAchievement.emoji}</span>
                        <div>
                          <h4 className="font-bold text-sky-600 dark:text-sky-400">
                            {selectedAchievement.name}
                          </h4>
                          <p className="text-sm opacity-80">{selectedAchievement.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Next Achievement Progress */}
                {nextBadge && (
                  <div
                    className={`mt-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold opacity-60">{t('nextAchievement')}</span>
                      <span className="text-lg">{nextBadge.emoji}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex-1 h-3 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}
                      >
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all shadow-sm"
                          style={{ width: `${Math.round(nextBadge.progress * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold opacity-60 w-8 text-right">
                        {Math.round(nextBadge.progress * 100)}%
                      </span>
                    </div>
                    <p className="text-xs opacity-50 mt-2">
                      {nextBadge.name}: {nextBadge.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Recent History */}
              <div className="mb-20">
                <h3 className="font-bold text-lg mb-4 text-sky-500">{t('recentActivity')}</h3>

                {allHistory.length === 0 ? (
                  <div className="text-center py-10 opacity-40 text-sm">{t('noGamesYet')}</div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const sorted = [...allHistory]
                        .filter(g => {
                          // Filter last 7 days
                          if (!g.timestamp) return false;
                          const daysDiff = (Date.now() - g.timestamp) / (1000 * 60 * 60 * 24);
                          return daysDiff <= 7;
                        })
                        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                      const dailyEarliest = new Map();
                      // Determine earliest timestamp for each date
                      sorted.forEach(g => {
                        if (g.timestamp) {
                          if (
                            !dailyEarliest.has(g.date) ||
                            g.timestamp < dailyEarliest.get(g.date)
                          ) {
                            dailyEarliest.set(g.date, g.timestamp);
                          }
                        }
                      });

                      return sorted.slice(0, 50).map((game, i) => {
                        // It is the daily result if its timestamp matches the earliest for that date
                        const isDaily =
                          game.timestamp && dailyEarliest.get(game.date) === game.timestamp;

                        return (
                          <div
                            key={i}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-colors
                                  ${
                                    isDaily
                                      ? theme === 'dark'
                                        ? 'bg-emerald-900/10 border-emerald-500/20'
                                        : 'bg-emerald-50 border-emerald-100'
                                      : theme === 'dark'
                                        ? 'bg-slate-800/50 border-slate-700'
                                        : 'bg-white border-slate-100'
                                  }`}
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
                              <span
                                className={`font-black text-lg ${isDaily ? 'text-emerald-600 dark:text-emerald-400 scale-110 inline-block' : 'text-slate-400 font-medium'}`}
                              >
                                {game.score}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 ml-1">PTS</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

ProfileScreen.propTypes = {
  username: PropTypes.string.isRequired,
};

export default ProfileScreen;
