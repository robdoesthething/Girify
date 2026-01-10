import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { getCuriosityByStreets } from '../data/curiosities';
import { fetchWikiImage } from '../utils/wiki';
import { useNavigate } from 'react-router-dom';

const SummaryScreen = ({ score, total, theme, username, onRestart, quizStreets, t }) => {
  const navigate = useNavigate();
  // Always show curiosities first, then actions
  const [view, setView] = useState('curiosity');

  const maxPossibleScore = total * 100;
  const curiosity = useMemo(() => getCuriosityByStreets(quizStreets), [quizStreets]);
  const [displayImage, setDisplayImage] = useState(curiosity.image);

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

  const handleNext = () => {
    setView('actions');
  };

  const handleShare = async () => {
    const baseUrl = 'https://girify.com'; // Updated domain
    const refCode = username ? username.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const shareUrl = refCode ? `${baseUrl}?ref=${refCode}` : baseUrl;
    const text = `🌆 Girify Daily Challenge:\nScore: ${score}/${maxPossibleScore}\n\nCan you beat me? Play here: ${shareUrl} #Girify #Barcelona`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Girify - Barcelona Street Quiz',
          text: text,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // eslint-disable-next-line no-alert
        alert('Referral link copied to clipboard!');
      }
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-colors duration-500 pointer-events-auto overflow-y-auto font-inter
            ${theme === 'dark' ? 'bg-slate-950/95 text-white' : 'bg-slate-50/95 text-slate-800'}`}
    >
      {/* Curiosity Screen */}
      {view === 'curiosity' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md relative z-20 w-full"
        >
          <h2 className="text-xs font-black mb-2 text-sky-500 uppercase tracking-[0.3em]">
            City Curiosity
          </h2>
          <h3 className="heading-lg mb-6 text-balance">{curiosity.title}</h3>

          <div className="glass-panel w-full overflow-hidden mb-8 shadow-2xl group">
            <div className="overflow-hidden h-64 w-full relative">
              <img
                src={displayImage}
                alt="Barcelona"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            </div>

            <div className="p-8 text-left">
              <p className="text-xl leading-relaxed font-medium text-slate-200">
                "{curiosity.fact}"
              </p>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl shadow-xl shadow-sky-500/20 font-bold text-lg transition-all transform hover:scale-[1.02]"
          >
            {t('next') || 'Next'}
          </button>
        </motion.div>
      )}

      {/* Actions Screen - Bento Grid Layout */}
      {view === 'actions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full max-w-md animate-fadeIn"
        >
          <div className="mb-8 text-center">
            <h2 className="heading-xl mb-2">{t('greatJob') || 'Great Job!'} </h2>
            <p className="text-sm opacity-60 uppercase tracking-widest font-semibold">
              Challenge Complete
            </p>
          </div>

          {/* Bento Stats Grid */}
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            {/* Score Card */}
            <div className="glass-panel p-6 flex flex-col items-center justify-center col-span-2">
              <span className="text-5xl font-black text-sky-400 mb-1">{score}</span>
              <span className="text-xs opacity-50 uppercase tracking-wider">
                Score / {maxPossibleScore}
              </span>
            </div>

            {/* Rank Card (Placeholder logic) */}
            <div className="glass-panel p-4 flex flex-col items-center justify-center bg-emerald-500/10 border-emerald-500/20">
              <span className="text-2xl mb-1">🌟</span>
              <span className="text-sm font-bold text-emerald-400">Top 10%</span>
              <span className="text-[10px] opacity-40">Estimated</span>
            </div>

            {/* Streak Card */}
            <div className="glass-panel p-4 flex flex-col items-center justify-center bg-orange-500/10 border-orange-500/20">
              <span className="text-2xl mb-1">🔥</span>
              <span className="text-sm font-bold text-orange-400">Streak</span>
              <span className="text-[10px] opacity-40">Kept Alive</span>
            </div>
          </div>

          {/* Primary: Share Referral Link */}
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

          {/* Secondary: Play Again */}
          <button
            onClick={onRestart}
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-all 
               bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-500 glass-button mb-6"
          >
            🔄 {t('playAgain') || 'Play Again'}
          </button>

          {/* Feedback Link */}
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
