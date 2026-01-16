import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../../../config/constants';
import { getCuriosityByStreets } from '../../../data/curiosities';
import { storage } from '../../../utils/storage';
import { fetchWikiImage } from '../../../utils/wiki';

import { TIME, UI } from '../../../config/constants';
import { QuizResult, Street } from '../../../types/game';
import { GameHistory } from '../../../types/user';

interface Curiosity {
  title: string;
  fact: string;
  image?: string;
}

interface SummaryScreenProps {
  score: number;
  total: number;
  theme: 'light' | 'dark';
  username?: string;
  realName?: string;
  streak?: number;
  onRestart: () => void;
  quizResults: QuizResult[];
  quizStreets: Street[];
  t: (key: string) => string;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({
  score,
  total,
  theme,
  username,
  streak,
  onRestart,
  quizStreets,
  t,
}) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'curiosity' | 'actions'>('curiosity');
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const maxPossibleScore = total * 100;
  const curiosity = useMemo<Curiosity>(
    () => getCuriosityByStreets(quizStreets) as Curiosity,
    [quizStreets]
  );
  const [displayImage, setDisplayImage] = useState(curiosity.image);

  const streakValue = useMemo(() => {
    if (streak && streak > 0) {
      return streak;
    }
    try {
      const history = storage.get(STORAGE_KEYS.HISTORY, []);
      if (history.length === 0) {
        return 1;
      }

      const uniqueDates = [...new Set(history.map((h: GameHistory) => h.date))].sort().reverse();
      if (uniqueDates.length === 0) {
        return 1;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0].replace(/-/g, '');
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0].replace(/-/g, '');

      if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 1;
      }

      let currentStreak = 0;
      const expectedDate = new Date(now);

      for (const dateStr of uniqueDates) {
        const expected = expectedDate.toISOString().split('T')[0].replace(/-/g, '');
        if (dateStr === expected) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
      return Math.max(currentStreak, 1);
    } catch {
      return 1;
    }
  }, [streak]);

  const getGreeting = () => {
    const ratio = score / maxPossibleScore;

    if (ratio >= UI.PERFORMANCE_THRESHOLDS.EXCELLENT) {
      return '🏆 Unstoppable! The streets know your name!';
    }
    if (ratio >= UI.PERFORMANCE_THRESHOLDS.GOOD) {
      return '🔥 Great job! You really know this city!';
    }
    if (ratio >= UI.PERFORMANCE_THRESHOLDS.FAIR) {
      return '👍 Not bad! Keep exploring!';
    }
    return '🗺️ Keep wandering! Every street has a story.';
  };

  useEffect(() => {
    let active = true;
    const loadDynamicImage = async () => {
      if (curiosity.title) {
        const url = await fetchWikiImage(curiosity.title);
        if (active && url) {
          setDisplayImage(url);
        }
      }
    };
    loadDynamicImage();
    return () => {
      active = false;
    };
  }, [curiosity]);

  const handleNext = () => setView('actions');

  const handleShare = async () => {
    const baseUrl = 'https://girify.com';
    const refCode = username ? username.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const shareUrl = refCode ? `${baseUrl}?ref=${refCode}` : baseUrl;
    const text = `🌆 Girify Daily Challenge:\nScore: ${score}/${maxPossibleScore}\n\nCan you beat me? Play here: ${shareUrl} #Girify #Barcelona`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Girify - Barcelona Street Quiz',
          text,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('Copied!');
        setTimeout(() => setShareStatus(null), TIME.SUMMARY_ANIMATION_DELAY);
      }
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-colors duration-500 pointer-events-auto overflow-y-auto font-inter z-[5000]
            ${theme === 'dark' ? 'bg-slate-950/95 text-white' : 'bg-slate-50/95 text-slate-800'}`}
    >
      {view === 'curiosity' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md relative z-20 w-full"
        >
          <h2 className="text-xs font-black mb-2 text-sky-400 uppercase tracking-[0.3em] drop-shadow-md">
            {t('cityCuriosity') || 'City Curiosity'}
          </h2>
          <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-6 text-balance text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight">
            {curiosity.title}
          </h3>

          <div className="glass-panel w-full overflow-hidden mb-6 shadow-2xl group border border-white/10 relative rounded-3xl">
            <div className="overflow-hidden h-48 md:h-64 w-full relative">
              <img
                src={displayImage}
                alt="Barcelona"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
              <div className="absolute bottom-3 right-3">
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-full bg-sky-500 hover:bg-sky-600 transition-all active:scale-95 shadow-lg text-white"
                  title="Share this curiosity"
                >
                  🎁
                </button>
              </div>
            </div>

            <div className="p-6 text-left relative z-10 bg-slate-950/80 backdrop-blur-md border-t border-white/10">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 block">
                {t('didYouKnow') || 'Did you know?'}
              </span>
              <p className="text-lg leading-relaxed font-medium text-white drop-shadow-sm">
                &quot;{curiosity.fact}&quot;
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleShare}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-sm transition-all"
            >
              {shareStatus || `🎁 ${t('share') || 'Share & Earn'}`}
            </button>
            <button
              onClick={handleNext}
              className="flex-[2] py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl shadow-xl shadow-sky-500/20 font-bold text-lg transition-all transform hover:scale-[1.02]"
            >
              {t('next') || 'Next'}
            </button>
          </div>
        </motion.div>
      )}

      {view === 'actions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full max-w-md animate-fadeIn"
        >
          <div className="mb-8 text-center animate-slide-up">
            <h2 className="text-2xl md:text-3xl font-black mb-2 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
              {getGreeting()}
            </h2>
            <p className="text-sm opacity-60 uppercase tracking-widest font-bold">
              {t('todaysChallenge') || "Today's Challenge"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="glass-panel p-4 flex flex-col items-center justify-center col-span-1 asp-square">
              <span className="text-xs opacity-50 uppercase tracking-wider font-bold mb-1">
                Score
              </span>
              <div className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-black text-emerald-400 leading-none">
                  {score}
                </span>
                <span className="text-sm font-bold text-slate-400 mt-1">
                  / {maxPossibleScore} {t('pts')}
                </span>
              </div>
            </div>

            <div className="glass-panel p-4 flex flex-col items-center justify-center col-span-1 asp-square bg-orange-500/10 border-orange-500/20 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 text-6xl">🔥</div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                {t('streak') || 'Streak'}
              </span>
              <span className="text-3xl md:text-4xl font-black text-white">{streakValue}</span>
              <span className="text-[10px] opacity-60 uppercase">{t('daysStreak') || 'Days'}</span>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white rounded-2xl shadow-2xl font-black text-lg transition-all transform hover:scale-[1.02] mb-4 flex items-center justify-center gap-3 group"
          >
            <span className="text-2xl group-hover:rotate-12 transition-transform">🎁</span>
            <div className="flex flex-col items-start leading-none">
              <span>{t('shareAndEarnGiuros') || 'Share & Earn Giuros'}</span>
              <span className="text-[10px] font-medium opacity-80 mt-1 uppercase tracking-wide">
                {t('inviteFriendsEarnRewards') || 'Invite friends & earn'}
              </span>
            </div>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-all
               bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-500 glass-button mb-6"
          >
            🔄 {t('playAgain') || 'Play Again'}
          </button>

          <button
            onClick={() => navigate('/feedback')}
            className="text-xs opacity-40 hover:opacity-100 hover:text-sky-400 transition-colors uppercase tracking-widest font-semibold"
          >
            📝 {t('haveFeedback') || 'Share Feedback'}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SummaryScreen;
