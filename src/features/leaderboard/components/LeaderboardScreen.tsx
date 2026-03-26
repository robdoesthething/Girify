import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTopBarNav } from '../../../hooks/useTopBarNav';
import TopBar from '../../../components/TopBar';
import { PageHeader } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import {
  getLeaderboard,
  getTeamLeaderboard,
  ScoreEntry,
  TeamScoreEntry,
} from '../../../utils/social/leaderboard';
import { themeClasses } from '../../../utils/themeUtils';
import IndividualScoreRow from './IndividualScoreRow';
import TeamScoreRow from './TeamScoreRow';

const LEADERBOARD_TIMEOUT_MS = 10000;
const LEADERBOARD_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface LeaderboardScreenProps {
  currentUser?: string;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ currentUser }) => {
  const { theme, t } = useTheme();
  const topBarNav = useTopBarNav();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [teamScores, setTeamScores] = useState<TeamScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly' | 'daily'>('all');
  const [viewMode, setViewMode] = useState<'individual' | 'teams'>('individual');
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<
    Map<string, { scores: ScoreEntry[]; teamScores: TeamScoreEntry[]; fetchedAt: number }>
  >(new Map());

  const loadScores = useCallback(async () => {
    const cacheKey = `${viewMode}-${period}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < LEADERBOARD_CACHE_TTL_MS) {
      setScores(cached.scores);
      setTeamScores(cached.teamScores);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setScores([]);
    setTeamScores([]);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Timeout: Server response took too long')),
          LEADERBOARD_TIMEOUT_MS
        )
      );

      if (viewMode === 'teams') {
        const dataPromise = getTeamLeaderboard(period);
        const data = (await Promise.race([dataPromise, timeoutPromise])) as TeamScoreEntry[];
        const result = data || [];
        setTeamScores(result);
        cacheRef.current.set(cacheKey, { scores: [], teamScores: result, fetchedAt: Date.now() });
      } else {
        const dataPromise = getLeaderboard(period);
        const data = (await Promise.race([dataPromise, timeoutPromise])) as ScoreEntry[] | null;

        if (data === null) {
          setScores([]);
          cacheRef.current.set(cacheKey, { scores: [], teamScores: [], fetchedAt: Date.now() });
        } else {
          const filtered = data.filter(s => s.username && s.username !== 'UNKNOWN');
          setScores(filtered);
          cacheRef.current.set(cacheKey, {
            scores: filtered,
            teamScores: [],
            fetchedAt: Date.now(),
          });
        }
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
  }, [period, viewMode]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const TABS: { id: 'all' | 'monthly' | 'weekly' | 'daily'; label: string }[] = [
    { id: 'all', label: t('allTime') },
    { id: 'monthly', label: t('monthly') },
    { id: 'weekly', label: t('weekly') },
    { id: 'daily', label: t('daily') },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest font-bold font-inter">
            {t('loadingRankings')}
          </span>
        </div>
      );
    }

    if (error) {
      return (
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
      );
    }

    if (viewMode === 'teams') {
      if (teamScores.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <span className="text-5xl mb-4">🏙️</span>
            <p className="font-bold font-inter text-base mb-1">No districts on the board yet</p>
            <p className="text-xs font-inter opacity-70">
              Play a game to represent your neighborhood!
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-2 pb-10">
          {teamScores.map((team, index) => (
            <TeamScoreRow key={team.id} team={team} index={index} />
          ))}
        </div>
      );
    }

    // Individual View
    if (scores.length === 0) {
      const isFiltered = period !== 'all';
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
          <span className="text-5xl mb-4">{isFiltered ? '⏳' : '🏆'}</span>
          <p className="font-bold font-inter text-base mb-1">
            {isFiltered ? 'No games played yet this period' : 'Be the first on the board!'}
          </p>
          <p className="text-xs font-inter opacity-70">
            {isFiltered
              ? 'Try a different time range, or go play!'
              : 'Play a game and claim the #1 spot.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2 pb-10">
        {scores.map((s, index) => (
          <IndividualScoreRow
            key={s.id || index}
            entry={s}
            index={index}
            currentUser={currentUser}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <TopBar onOpenPage={topBarNav.onOpenPage} onTriggerLogin={topBarNav.onTriggerLogin} />

      <div className="flex-1 w-full px-4 py-8 pt-20 overflow-x-hidden overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          <PageHeader title={`🏆 ${t('leaderboard')}`} />

          {/* Individual/Teams Toggle */}
          <div className="flex justify-center mb-4">
            <div
              className={`flex p-1 rounded-xl ${themeClasses(theme, 'bg-slate-800', 'bg-slate-200')}`}
            >
              <button
                onClick={() => setViewMode('individual')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase
                  ${viewMode === 'individual' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                type="button"
              >
                👤 {t('individual') || 'Individual'}
              </button>
              <button
                onClick={() => setViewMode('teams')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase
                  ${viewMode === 'teams' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                type="button"
              >
                🏆 {t('teams') || 'Teams'}
              </button>
            </div>
          </div>

          {/* Period Tabs */}
          <div className="flex justify-center mb-6">
            <div
              className={`flex p-1 rounded-xl ${themeClasses(theme, 'bg-slate-800', 'bg-slate-200')}`}
            >
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all tracking-wider uppercase
                         ${period === tab.id ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}
                      `}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardScreen;
