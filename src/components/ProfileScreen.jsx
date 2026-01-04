import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getFriendCount, getUserProfile, updateUserProfile } from '../utils/social';
import FriendRequests from './FriendRequests';
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

  // Initialize state functions to avoid synchronous effect updates
  const [history] = useState(() => {
    try {
      const rawHistory = localStorage.getItem('girify_history');
      const parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
      const list = Array.isArray(parsedHistory) ? parsedHistory : [];
      // Filter: Keep only the FIRST attempt per day (User Requirement)
      // Assuming 'date' is the day seed (YYYYMMDD integer)
      const seenDates = new Set();
      const uniqueList = [];
      list.forEach(game => {
        if (!seenDates.has(game.date)) {
          seenDates.add(game.date);
          uniqueList.push(game);
        }
      });
      return uniqueList;
    } catch (e) {
      console.error('Profile data load error:', e);
      return [];
    }
  });

  const [joinedDate] = useState(() => {
    return localStorage.getItem('girify_joined') || new Date().toLocaleDateString();
  });

  const [friendCount, setFriendCount] = useState(0);

  // Profile Edit State
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatarId, setEditAvatarId] = useState(0); // 0-indexed for array

  useEffect(() => {
    const loadProfile = async () => {
      if (username) {
        const count = await getFriendCount(username);
        setFriendCount(count);

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

  const totalGames = history.length;
  const bestScore = totalGames > 0 ? Math.max(...history.map(h => (h && h.score) || 0)) : 0;
  const totalScore = history.reduce((acc, curr) => acc + ((curr && curr.score) || 0), 0);
  const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
  const dailyStreak = calculateStreak(history);

  // Determine display avatar
  const currentAvatarId = isEditing
    ? editAvatarId
    : profileData?.avatarId
      ? profileData.avatarId - 1
      : 0;

  // Safe bounds check
  const safeAvatarIndex = Math.max(0, Math.min(currentAvatarId, AVATARS.length - 1));
  const displayAvatar = AVATARS[safeAvatarIndex];

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden
                    ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                `}
      >
        {/* Header with Avatar */}
        <div
          className={`p-8 flex flex-col items-center border-b shrink-0 relative ${theme === 'dark' ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}
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
              className={`w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-4xl shadow-lg mb-4 ring-4 ring-white dark:ring-slate-700 select-none outline-none focus:ring-sky-500
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
            <p className="text-xl font-black text-slate-700 dark:text-slate-200">{totalGames}</p>
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

        {/* Recent History */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-4">
            {t('recentActivity')}
          </h3>

          {history.length === 0 ? (
            <div className="text-center py-10 opacity-40 text-sm">{t('noGamesYet')}</div>
          ) : (
            <div className="space-y-3">
              {history
                .slice()
                .reverse()
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
      </motion.div>
    </div>
  );
};

ProfileScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
};

export default ProfileScreen;
