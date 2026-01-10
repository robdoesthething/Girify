import React, { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../utils/leaderboard';
import PropTypes from 'prop-types';

const LeaderboardScreen = ({ onClose, currentUser }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // 'all', 'monthly', 'weekly', 'daily'

  const [error, setError] = useState(null);

  const loadScores = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setScores([]); // Clear previous scores while loading

    try {
      // Race against a 5-second timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Server response took too long')), 5000)
      );
      const dataPromise = getLeaderboard(period);

      const data = await Promise.race([dataPromise, timeoutPromise]);

      if (data === null) {
        setScores([]);
      } else {
        setScores(data.filter(s => s.username && s.username !== 'UNKNOWN'));
      }
    } catch (err) {
      console.error('Failed to load scores:', err);
      // Detailed error message for debugging
      let msg = err.message || 'Failed to load leaderboard';
      if (msg.includes('Missing or insufficient permissions')) {
        msg = 'Database permissions error. Ask admin to check Firestore rules.';
      } else if (msg.includes('Timeout')) {
        msg = 'Connection timed out. Please check your internet.';
      }
      setError(msg);
      setScores([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const TABS = [
    { id: 'all', label: t('allTime') },
    { id: 'monthly', label: t('monthly') },
    { id: 'weekly', label: t('weekly') },
    { id: 'daily', label: t('daily') },
  ];

  return (
    <div
      className={`fixed inset-0 z-[8000] flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-md pointer-events-auto ${theme === 'dark' ? 'bg-slate-950/90 text-slate-50' : 'bg-slate-50/95 text-slate-900'}`}
    >
      <div className="w-full max-w-4xl h-full md:h-auto md:max-h-[85vh] flex flex-col glass-panel overflow-hidden shadow-2xl ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <h2 className="heading-lg text-2xl flex items-center gap-2">
            <span className="text-sky-500">🏆</span> {t('leaderboard')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
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
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 bg-slate-50/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Tabs - Segmented Control */}
          <div className="flex p-1 rounded-lg bg-slate-950/20 shadow-inner w-full md:w-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wider
                       ${
                         period === tab.id
                           ? 'bg-sky-500 text-white shadow-lg'
                           : 'text-slate-500 hover:text-slate-300'
                       }
                    `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dense Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50 space-y-4">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs uppercase tracking-widest font-bold">
                {t('loadingRankings')}
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <span className="text-4xl mb-4">⚠️</span>
              <p className="font-bold text-red-400 mb-2">{error}</p>
              <button
                onClick={loadScores}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm font-bold"
              >
                Try Again
              </button>
            </div>
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-40">
              <span className="text-4xl mb-4">📭</span>
              <p className="font-bold">{t('noRecords')}</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur text-xs uppercase tracking-widest font-bold text-slate-500 border-b border-white/10 z-10">
                <tr>
                  <th className="p-4 w-16 text-center">#</th>
                  <th className="p-4">{t('displayName') || 'User'}</th>
                  <th className="p-4 hidden md:table-cell">{t('games') || 'Date'}</th>
                  <th className="p-4 text-right">{t('score') || 'Score'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scores.map((s, index) => {
                  let dateStr = 'Unknown';
                  try {
                    if (s.timestamp && s.timestamp.seconds) {
                      dateStr = new Date(s.timestamp.seconds * 1000).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      });
                    } else if (s.timestamp) {
                      dateStr = new Date(s.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      });
                    }
                  } catch {
                    dateStr = '--';
                  }

                  const isMe =
                    currentUser &&
                    s.username?.toLowerCase().replace(/^@/, '') ===
                      currentUser.toLowerCase().replace(/^@/, '');

                  return (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      key={s.id || index}
                      onClick={() => {
                        const cleanClicked = s.username?.replace(/^@/, '') || '';
                        const myClean = currentUser?.replace(/^@/, '') || '';
                        if (cleanClicked.toLowerCase() === myClean.toLowerCase())
                          navigate('/profile');
                        else navigate(`/user/${encodeURIComponent(s.username)}`);
                      }}
                      className={`group cursor-pointer hover:bg-white/5 transition-colors
                                ${isMe ? 'bg-sky-500/10 hover:bg-sky-500/20' : ''}
                            `}
                    >
                      <td className="p-4 text-center font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                        {index < 3 ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                      ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-slate-300 text-slate-900' : 'bg-amber-600 text-white'}
                                   `}
                          >
                            {index + 1}
                          </span>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-200 group-hover:text-white flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${isMe ? 'bg-sky-500' : 'bg-transparent'}`}
                        />
                        {s.username}
                      </td>
                      <td className="p-4 hidden md:table-cell opacity-40 font-mono text-xs">
                        {dateStr}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-sky-400">
                        {s.score.toLocaleString()}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

LeaderboardScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
  currentUser: PropTypes.string,
};

export default LeaderboardScreen;
