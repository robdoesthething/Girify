import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import StreetSnapshotMap from './StreetSnapshotMap';
import { useNavigate } from 'react-router-dom';
import { GAME, GIRIFY_EPOCH, STORAGE_KEYS, TIME, UI } from '../../../config/constants';
import { getTimeUntilNext } from '../../../utils/game/dailyChallenge';
import { useAuthContext } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { QuizResult, Street } from '../../../types/game';
import { GameHistory } from '../../../types/user';
import { calculateStreakFromDateStrings } from '../../../utils/stats';
import { storage } from '../../../utils/storage';
import { themeClasses } from '../../../utils/themeUtils';

interface SummaryScreenProps {
  score: number;
  total: number;
  theme: 'light' | 'dark';
  streak?: number;
  onRestart: () => void;
  onBackToMenu?: () => void;
  onKeepPlaying?: () => void;
  quizResults: QuizResult[];
  quizStreets: Street[];
  t: (key: string) => string;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({
  score,
  total,
  theme,
  streak,
  onRestart,
  onKeepPlaying,
  quizResults,
  t,
}) => {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const { language } = useTheme();
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [streetCuriosities, setStreetCuriosities] = useState<
    Record<string, { ca?: string; es?: string; en?: string }>
  >({});

  useEffect(() => {
    fetch('/streetCuriosities.json')
      .then(r => r.json())
      .then(setStreetCuriosities)
      .catch(() => {});
  }, []);

  const maxPossibleScore = total * 100;

  const streakValue = useMemo(() => {
    if (streak && streak > 0) {
      return streak;
    }
    try {
      const history = storage.get(STORAGE_KEYS.HISTORY, []);
      const streakCount = calculateStreakFromDateStrings(history.map((h: GameHistory) => h.date));
      return Math.max(streakCount, 1);
    } catch {
      return 1;
    }
  }, [streak]);

  const getScoreColor = () => {
    const ratio = score / maxPossibleScore;
    if (ratio >= UI.PERFORMANCE_THRESHOLDS.GOOD) {
      return 'text-emerald-400';
    }
    if (ratio >= UI.PERFORMANCE_THRESHOLDS.FAIR) {
      return 'text-amber-400';
    }
    return 'text-red-400';
  };

  const getGentrifRank = () => {
    const ratio = score / 1000;
    if (ratio >= 0.95) {
      return t('gentriRankVei');
    }
    if (ratio >= 0.8) {
      return t('gentriRankSpeculador');
    }
    if (ratio >= 0.6) {
      return t('gentriRankLandlord');
    }
    if (ratio >= 0.4) {
      return t('gentriRankNomad');
    }
    if (ratio >= 0.2) {
      return t('gentriRankExpat');
    }
    return t('gentriRankGuiri');
  };

  const getGreeting = () => {
    const ratio = score / maxPossibleScore;
    if (ratio >= UI.PERFORMANCE_THRESHOLDS.EXCELLENT) {
      return t('greetingExcellent');
    }
    if (ratio >= UI.PERFORMANCE_THRESHOLDS.GOOD) {
      return t('greetingGood');
    }
    if (ratio >= UI.PERFORMANCE_THRESHOLDS.FAIR) {
      return t('greetingFair');
    }
    return t('greetingDefault');
  };

  const buildShareText = () => {
    const dayNumber = Math.floor((Date.now() - GIRIFY_EPOCH.getTime()) / TIME.ONE_DAY) + 1;

    const squares = quizResults
      .map(r => {
        if (r.status === 'failed') {
          return '⬛';
        }
        return r.points >= GAME.POINTS.GOOD_THRESHOLD ? '🟩' : '🟨';
      })
      .join('');

    const formattedScore = score.toLocaleString('ca-ES');
    const districtLine = profile?.team ? `🏙️ ${profile.team}\n` : '';
    const streakLine = streakValue > 1 ? `🔥 ${streakValue} ${t('shareStreakDays')} · ` : '';
    const refSuffix = profile?.username ? `?ref=${profile.username}` : '';
    const rankLine = `${getGentrifRank()}\n`;

    return (
      `Girify #${dayNumber} — ${t('shareTextQuestion')}\n` +
      `${squares}\n` +
      `${formattedScore} / 1000\n` +
      `${rankLine}` +
      `${districtLine}` +
      `${streakLine}www.girifyapp.com${refSuffix}`
    );
  };

  const handleShare = async () => {
    const shareText = buildShareText();
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareStatus(t('copied') || 'Copiat!');
        setTimeout(() => setShareStatus(null), TIME.SUMMARY_ANIMATION_DELAY);
      }
    } catch (e) {
      console.error('[Game] Share failed:', e);
    }
  };

  const getCuriosity = (streetId: string) => {
    const entry = streetCuriosities[streetId];
    if (!entry) {
      return null;
    }
    const preferred = language as 'ca' | 'es' | 'en';
    const langs: ('ca' | 'es' | 'en')[] = [preferred, 'ca', 'es', 'en'];
    let text: string | undefined;
    let actualLang: 'ca' | 'es' | 'en' = preferred;
    for (const l of langs) {
      if (entry[l]) {
        text = entry[l];
        actualLang = l;
        break;
      }
    }
    if (!text) {
      return null;
    }
    return { text, lang: actualLang, isFallback: actualLang !== preferred };
  };

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-start py-8 px-6 text-center backdrop-blur-md transition-colors duration-500 pointer-events-auto overflow-y-auto font-inter
            ${themeClasses(theme, 'bg-slate-950/95 text-white', 'bg-slate-50/95 text-slate-800')}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-2 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            {getGreeting()}
          </h2>
          <p
            className={`text-sm uppercase tracking-widest font-bold ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
          >
            {t('todaysChallenge') || "Today's Challenge"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <div className="glass-panel p-4 flex flex-col items-center justify-center col-span-1">
            <span
              className={`text-xs uppercase tracking-wider font-bold mb-1 ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
            >
              {t('scoreLabel')}
            </span>
            <div className="flex flex-col items-center">
              <span className={`text-4xl md:text-5xl font-black leading-none ${getScoreColor()}`}>
                {score}
              </span>
              <span className="text-sm font-bold text-slate-400 mt-1">
                / {maxPossibleScore} {t('pts')}
              </span>
              <span className={`text-[11px] font-black mt-1 ${getScoreColor()}`}>
                {getGentrifRank()}
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 flex flex-col items-center justify-center col-span-1 bg-orange-500/10 border-orange-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10 text-6xl">🔥</div>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              {t('streak') || 'Streak'}
            </span>
            <span className="text-3xl md:text-4xl font-black text-white">{streakValue}</span>
            <span className="text-[10px] opacity-60 uppercase">{t('daysStreak') || 'Days'}</span>
          </div>
        </div>

        {/* Next challenge hook */}
        {!onKeepPlaying && (
          <div className="w-full mb-6 rounded-2xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 px-5 py-4 flex items-center gap-4">
            <span className="text-3xl">⏰</span>
            <div className="flex-1">
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
              >
                {t('nextChallenge') || 'Next challenge'}
              </p>
              <p className="text-xl font-black text-sky-400 tabular-nums">{getTimeUntilNext()}</p>
            </div>
            <p
              className={`text-xs font-semibold text-right max-w-[100px] leading-tight ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
            >
              {t('comeBackTomorrow') || 'Come back tomorrow to keep your streak!'}
            </p>
          </div>
        )}

        <div className="w-full mb-6">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
          >
            {t('resultsBreakdown') || 'Resultats'}
          </p>
          <div className="space-y-1.5">
            {quizResults.map((result, i) => {
              const isExpanded = expandedIndex === i;
              const isCorrect = result.status === 'correct';
              const curiosity = getCuriosity(result.street.id);
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-opacity active:opacity-70 ${
                      isExpanded ? 'rounded-t-xl' : 'rounded-xl'
                    } ${
                      isCorrect
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <span
                      className={`text-base font-black w-4 flex-shrink-0 ${
                        isCorrect ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold truncate opacity-90 block">
                        {result.street.name}
                      </span>
                      {curiosity && !isExpanded && (
                        <span
                          className={`text-[10px] block truncate mt-0.5 ${themeClasses(
                            theme,
                            'text-slate-500',
                            'text-slate-400'
                          )}`}
                        >
                          {curiosity.text.slice(0, 60)}…
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-black tabular-nums flex-shrink-0 ${
                        isCorrect ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isCorrect ? `+${result.points}` : '0'}
                    </span>
                    <span
                      className={`text-xs flex-shrink-0 ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
                    >
                      ▾
                    </span>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          className={`w-full rounded-b-xl overflow-hidden ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-x border-b border-emerald-500/20'
                              : 'bg-red-500/10 border-x border-b border-red-500/20'
                          }`}
                        >
                          <div className="p-1.5 pt-0">
                            <StreetSnapshotMap street={result.street} theme={theme} zoomable />
                          </div>
                          {curiosity && (
                            <div className="px-4 pb-3">
                              {curiosity.isFallback && (
                                <span
                                  className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-2 ${themeClasses(
                                    theme,
                                    'bg-slate-700 text-slate-400',
                                    'bg-slate-200 text-slate-500'
                                  )}`}
                                >
                                  {curiosity.lang}
                                </span>
                              )}
                              <p
                                className={`text-xs leading-relaxed mb-2 ${themeClasses(
                                  theme,
                                  'text-slate-300',
                                  'text-slate-600'
                                )}`}
                              >
                                {curiosity.text}
                              </p>
                              <a
                                href={`https://${curiosity.lang}.wikipedia.org/wiki/${encodeURIComponent(result.street.name)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:underline ${themeClasses(
                                  theme,
                                  'text-slate-500 hover:text-slate-400',
                                  'text-slate-400 hover:text-slate-600'
                                )}`}
                              >
                                🔗 Wikipedia
                              </a>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {!user && (
          <div
            className={`w-full mb-4 p-4 rounded-2xl border flex flex-col gap-2 text-left ${themeClasses(
              theme,
              'bg-sky-900/20 border-sky-700/30',
              'bg-sky-50 border-sky-200'
            )}`}
          >
            <p
              className={`text-xs font-black uppercase tracking-widest ${themeClasses(theme, 'text-sky-400', 'text-sky-600')}`}
            >
              {t('saveYourScore') || 'Save your score'}
            </p>
            <p className={`text-xs ${themeClasses(theme, 'text-slate-300', 'text-slate-600')}`}>
              {t('signInToSave') ||
                'Sign in to track your streak, compete on the leaderboard, and save your progress.'}
            </p>
            <button
              onClick={() => navigate('/?auth=login')}
              className="mt-1 self-start text-xs font-bold text-sky-500 hover:text-sky-400 underline underline-offset-2 transition-colors"
              type="button"
            >
              {t('signIn') || 'Sign in →'}
            </button>
          </div>
        )}

        <button
          onClick={handleShare}
          className="w-full py-5 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 active:scale-95 text-white rounded-2xl shadow-2xl font-black text-lg transition-all transform hover:scale-[1.02] mb-4 flex items-center justify-center gap-3 group"
        >
          <span className="text-2xl group-hover:rotate-12 transition-transform">📤</span>
          <div className="flex flex-col items-start leading-none">
            <span>{shareStatus || t('shareYourResult') || 'Share your result'}</span>
            <span className="text-[10px] font-medium opacity-80 mt-1 uppercase tracking-wide">
              {t('earnGiurosWhenFriendsJoin') || 'Earn giuros when friends join'}
            </span>
          </div>
        </button>

        <div className="flex gap-3 w-full mb-4">
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-500"
          >
            🏆 {t('leaderboard') || 'Leaderboard'}
          </button>
          {profile && (
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-500"
            >
              👤 {t('myProfile') || 'My Profile'}
            </button>
          )}
          <button
            onClick={() => navigate('/feedback')}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-500"
          >
            📝 {t('haveFeedback') || 'Feedback'}
          </button>
        </div>

        {onKeepPlaying ? (
          <button
            onClick={onKeepPlaying}
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-all active:scale-95
               bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white shadow-xl mb-6"
          >
            ♾️ {t('keepPlaying') || 'Keep Playing'}
          </button>
        ) : (
          <button
            onClick={onRestart}
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-all active:scale-95
               bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-500 glass-button mb-6"
          >
            🔄 {t('playAgain') || 'Play Again'}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default SummaryScreen;
