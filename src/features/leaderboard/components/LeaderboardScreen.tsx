import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { getLeaderboard } from '../../../utils/leaderboard';
import TopBar from '../../../components/TopBar';

interface ScoreEntry {
  id?: string;
  username: string;
  score: number;
  timestamp?: { seconds: number } | number | string;
}

interface LeaderboardScreenProps {
  currentUser?: string;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ currentUser }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly' | 'daily'>('all');
  const [error, setError] = useState<string | null>(null);

  const loadScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    setScores([]);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Server response took too long')), 5000)
      );
      const dataPromise = getLeaderboard(period);
      const data = (await Promise.race([dataPromise, timeoutPromise])) as ScoreEntry[] | null;

      if (data === null) {
        setScores([]);
      } else {
        setScores(data.filter(s => s.username && s.username !== 'UNKNOWN'));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Failed to load scores:', err);
      } else {
        console.error('Failed to load scores:', String(err));
      }

      let msg = 'Failed to load leaderboard';
      if (err instanceof Error) {
        msg = err.message || msg;
      } else {
        msg = String(err) || msg;
      }
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

  const TABS: { id: 'all' | 'monthly' | 'weekly' | 'daily'; label: string }[] = [
    { id: 'all', label: t('allTime') },
    { id: 'monthly', label: t('monthly') },
    { id: 'weekly', label: t('weekly') },
    { id: 'daily', label: t('daily') },
  ];

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}
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
            <h1 className="text-xl font-black absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 font-inter">
              <span className="text-2xl">🏆</span> {t('leaderboard')}
            </h1>
            <div className="w-10" />
          </div>

          <div className="flex justify-center mb-6">
            <div
              className={`flex p-1 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}
            >
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider
                         ${period === tab.id ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}
                      `}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-widest font-bold font-inter">
                  {t('loadingRankings')}
                </span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center p-6">
                <span className="text-4xl mb-4">⚠️</span>
                <p className="font-bold text-red-400 mb-2 font-inter">{error}</p>
                <button
                  onClick={loadScores}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg hover:opacity-80 transition-colors text-sm font-bold font-inter"
                  type="button"
                >
                  Try Again
                </button>
              </div>
            ) : scores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <span className="text-4xl mb-4">📭</span>
                <p className="font-bold font-inter">{t('noRecords')}</p>
              </div>
            ) : (
              <div className="space-y-2 pb-10">
                {scores.map((s, index) => {
                  let dateStr = 'Unknown';
                  try {
                    const ts = s.timestamp;
                    if (ts && typeof ts === 'object' && 'seconds' in ts) {
                      dateStr = new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      });
                    } else if (typeof ts === 'number' || typeof ts === 'string') {
                      dateStr = new Date(ts).toLocaleDateString(undefined, {
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={s.id || index}
                      onClick={() => {
                        const cleanClicked = s.username?.replace(/^@/, '') || '';
                        const myClean = currentUser?.replace(/^@/, '') || '';
                        if (cleanClicked.toLowerCase() === myClean.toLowerCase()) {
                          navigate('/profile');
                        } else {
                          navigate(`/user/${encodeURIComponent(s.username)}`);
                        }
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]
                        ${isMe ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10' : theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-sky-200 shadow-sm'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm
                          ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 opacity-50'}
                        `}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-sm flex items-center gap-1 font-inter">
                            {s.username}
                            {isMe && (
                              <span className="text-[10px] bg-sky-500 text-white px-1.5 rounded-full font-inter">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] opacity-50 font-mono">{dateStr}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-lg text-sky-500 font-inter">
                          {s.score.toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold opacity-40 uppercase font-inter">
                          Points
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardScreen;
