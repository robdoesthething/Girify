import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getFriendCount } from '../utils/social';
import FriendRequests from './FriendRequests';
import PropTypes from 'prop-types';

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

  const [history, setHistory] = React.useState([]);
  const [joinedDate, setJoinedDate] = React.useState(new Date().toLocaleDateString());
  const [friendCount, setFriendCount] = React.useState(0);

  React.useEffect(() => {
    try {
      const rawHistory = localStorage.getItem('girify_history');
      const parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
      if (Array.isArray(parsedHistory)) {
        setHistory(parsedHistory);
      }

      const savedDate = localStorage.getItem('girify_joined');
      if (savedDate) setJoinedDate(savedDate);
    } catch (e) {
      console.error('Profile data load error:', e);
      setHistory([]);
    }

    const loadFriendCount = async () => {
      if (username) {
        const count = await getFriendCount(username);
        setFriendCount(count);
      }
    };
    loadFriendCount();
  }, [username]);

  const totalGames = history.length;
  const bestScore = totalGames > 0 ? Math.max(...history.map(h => (h && h.score) || 0)) : 0;
  const totalScore = history.reduce((acc, curr) => acc + ((curr && curr.score) || 0), 0);
  const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
  const dailyStreak = calculateStreak(history);
  const initial = username ? username.charAt(0).toUpperCase() : '?';

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

          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-lg mb-4 ring-4 ring-white dark:ring-slate-700">
            {initial}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{username || 'Player'}</h2>
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-1">
            {t('playerSince')} {joinedDate}
          </p>
        </div>

        {/* Friend Requests (Only for current user looking at themselves) */}
        {/* Note: The ProfileScreen is usually FOR the Current User. PublicProfileModal is for others. */}
        {/* So we can safely assume 'username' is the current user if this component is used for "My Profile" */}
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
                        {game.timestamp ? new Date(game.timestamp).toLocaleDateString() : 'Just now'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black text-lg ${game.score >= 800 ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        {game.score}
                      </span>
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
