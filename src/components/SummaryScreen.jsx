import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { getCuriosityByStreets } from '../data/curiosities';
import { fetchWikiImage } from '../utils/wiki';
import FeedbackModal from './FeedbackModal';

const SummaryScreen = ({ score, total, theme, username, onRestart, quizStreets, t }) => {
  // 1/7 chance to show feedback instead of curiosity
  const [showFeedbackRequest] = useState(() => true); // FORCING FOR VERIFICATION

  const [view, setView] = useState(() => (showFeedbackRequest ? 'feedback' : 'curiosity'));
  const [showFeedbackModal, setShowFeedbackModal] = useState(showFeedbackRequest);

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
    const baseUrl = 'https://girifyapp.com';
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
      className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-colors duration-500 pointer-events-auto overflow-y-auto
            ${theme === 'dark' ? 'bg-slate-900/95 text-white' : 'bg-slate-50/95 text-slate-800'}`}
    >
      {/* Feedback Screen (Substitutive of Curiosity) */}
      {view === 'feedback' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md w-full relative z-20" // z-20 to ensure it sits above map if needed
        >
          <FeedbackModal
            isOpen={true}
            onClose={() => handleNext()}
            username={username}
            inline={true} // New prop to render inline without modal overlay if needed, or just reusing component
          />
          {/* Fallback Next button if user wants to skip without interacting with modal form explicitly */}
          <button
            onClick={handleNext}
            className="mt-4 text-sm font-bold opacity-60 hover:opacity-100 underline"
          >
            {t('skip') || 'Skip'}
          </button>
        </motion.div>
      )}

      {/* Curiosity Screen - Shows ONLY if Feedback is NOT shown */}
      {view === 'curiosity' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md relative z-20"
        >
          <h2 className="text-xs font-black mb-1 text-sky-500 uppercase tracking-[0.3em]">
            City Curiosity
          </h2>
          <h3 className="text-2xl font-black mb-4 text-slate-800 dark:text-white">
            {curiosity.title}
          </h3>

          <div className="rounded-[2.5rem] overflow-hidden mb-6 shadow-2xl border">
            <img
              src={displayImage}
              alt="Barcelona"
              className="w-full h-56 object-cover transition-opacity duration-500"
            />
            <div className="p-8">
              <p
                className={`text-xl leading-relaxed font-bold italic ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}
              >
                "{curiosity.fact}"
              </p>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full max-w-sm py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            {t('next') || 'Next'}
          </button>
        </motion.div>
      )}

      {/* Actions Screen - Referral & Play Again */}
      {view === 'actions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full max-w-md"
        >
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black mb-2">{t('greatJob') || 'Great Job!'} </h2>
            <p className="text-sm opacity-60">
              Score: <span className="font-bold text-sky-500">{score}</span> / {maxPossibleScore}
            </p>
          </div>

          {/* Primary: Share Referral Link */}
          <button
            onClick={handleShare}
            className="w-full py-6 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white rounded-2xl shadow-2xl font-black text-lg transition-all transform hover:scale-105 mb-4 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">🎁</span>
            <span>{t('shareAndEarnGiuros') || 'Share & Earn Giuros'}</span>
            <span className="text-xs font-normal opacity-80">
              {t('inviteFriendsEarnRewards') || 'Invite friends and earn rewards when they play!'}
            </span>
          </button>

          {/* Secondary: Play Again - STYLED TO BE OBVIOUS */}
          <button
            onClick={onRestart}
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-all animate-pulse-slow
               bg-slate-900 text-white hover:bg-black hover:scale-105 shadow-xl border-2 border-slate-700 dark:border-slate-500"
          >
            🔄 {t('playAgain') || 'Play Again'}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SummaryScreen;
