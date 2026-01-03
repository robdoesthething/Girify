import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { getCuriosityByStreets } from '../data/curiosities';
import { fetchWikiImage } from '../utils/wiki';

const getFirstName = fullName => {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0];
};

const getCongratsMessage = (score, maxScore, t) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return t('congratsOutstanding');
  if (percentage >= 75) return t('congratsExcellent');
  if (percentage >= 60) return t('congratsGreat');
  if (percentage >= 40) return t('congratsGood');
  return t('congratsKeepPracticing');
};

const SummaryScreen = ({
  score,
  total,
  theme,
  username,
  onRestart,
  quizResults,
  quizStreets,
  t,
}) => {
  const [view, setView] = useState('summary');
  const [curiosityRevealed, setCuriosityRevealed] = useState(false);

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

  const history = JSON.parse(localStorage.getItem('girify_history') || '[]');

  const handleShare = async () => {
    // Include referral code in share URL
    // Use prod URL if available, otherwise fallback
    const baseUrl = 'https://girifyapp.com'; // Updated to Prod URL
    const refCode = username ? username.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const shareUrl = refCode ? `${baseUrl}?ref=${refCode}` : baseUrl;
    const text = `🌆 Girify Daily Challenge:\nScore: ${score}/${maxPossibleScore}\n\nCan you beat me? Play here: ${shareUrl} #Girify #Barcelona`;

    const performShare = async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Girify - Barcelona Street Quiz',
            text: text,
          });
          return true;
        } else {
          await navigator.clipboard.writeText(text);
          // eslint-disable-next-line no-alert
          alert('Results copied to clipboard!');
          return true;
        }
      } catch {
        return false;
      }
    };

    const shared = await performShare();
    if (shared) setCuriosityRevealed(true);
  };

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-colors duration-500 pointer-events-auto overflow-y-auto
            ${theme === 'dark' ? 'bg-slate-900/95 text-white' : 'bg-slate-50/95 text-slate-800'}`}
    >
      {view === 'summary' && !curiosityRevealed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full max-w-md"
        >
          <div className="mb-1">
            <span className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-full text-[10px] uppercase font-bold tracking-widest border border-sky-500/20">
              {t('dailyChallengeComplete')}
            </span>
          </div>
          <h2 className="text-2xl font-black mb-4 tracking-tight">
            {getCongratsMessage(score, maxPossibleScore, t).replace(
              '!',
              `, ${getFirstName(username)}!`
            )}
          </h2>

          <div
            className={`w-full p-4 rounded-2xl border mb-4 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}
          >
            <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold block">
              {t('yourScore')}
            </span>
            <span className="text-3xl font-black text-sky-500">{score}</span>
            <span className="text-xs text-slate-400 ml-1">/ {maxPossibleScore}</span>
          </div>

          <div className="w-full mb-4">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
              {t('questionBreakdown')}
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {quizResults.map((result, idx) => {
                const isCorrect = result.status === 'correct';
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all
                      ${
                        isCorrect
                          ? theme === 'dark'
                            ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                            : 'bg-sky-500/10 border-sky-500 text-sky-600'
                          : theme === 'dark'
                            ? 'bg-slate-700/50 border-slate-600 text-slate-400'
                            : 'bg-slate-100 border-slate-300 text-slate-500'
                      }`}
                  >
                    <span className="text-[8px] font-bold opacity-60">Q{idx + 1}</span>
                    <span className="text-sm font-black">{Math.round(result.points)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`w-full p-4 rounded-2xl border mb-3 ${theme === 'dark' ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50 border-sky-100'}`}
          >
            <p className="text-sky-500 font-bold mb-1 text-sm">{t('cityCuriosityUnlocked')}</p>
            <p className="text-[10px] mb-3 text-slate-500 font-medium">{t('shareToReveal')}</p>
            <button
              onClick={handleShare}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-sm transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {t('shareAndReveal')}
            </button>
          </div>

          <div className="flex gap-2 w-full justify-center">
            <button
              onClick={() => setView('rankings')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}
            >
              Rankings
            </button>
          </div>
        </motion.div>
      )}

      {view === 'rankings' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center w-full max-w-sm"
        >
          <h2 className="text-2xl font-black mb-4">Rankings</h2>
          <div className="w-full space-y-2 mb-8">
            {history
              .filter(record => {
                // If logged in, show only my records. If guest (no username), show only guest records.
                return (record.username || '') === (username || '');
              })
              .slice(-3)
              .reverse()
              .map(record => (
                <div key={record.timestamp} className="p-3 border rounded-xl flex justify-between">
                  <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                  <span className="font-bold">{record.score}</span>
                </div>
              ))}
          </div>
          <button onClick={() => setView('summary')} className="px-6 py-2 bg-slate-200 rounded-lg">
            Back
          </button>
        </motion.div>
      )}

      {view === 'breakdown' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center w-full max-w-md h-full pb-20"
        >
          <h2 className="text-2xl font-black mb-4">Breakdown</h2>
          <div className="w-full flex-1 overflow-y-auto space-y-2">
            {quizResults.map((r, i) => (
              <div key={i} className="p-2 border rounded text-left">
                <div className="font-bold">{r.street.name}</div>
                <div
                  className={`text-xs ${r.status === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {r.status}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setView('summary')}
            className="px-6 py-2 bg-slate-200 rounded-lg mt-4"
          >
            Back
          </button>
        </motion.div>
      )}

      {curiosityRevealed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md"
        >
          <h2 className="text-xs font-black mb-1 text-sky-500 uppercase tracking-[0.3em]">
            City Curiosity
          </h2>
          <h3 className="text-2xl font-black mb-4 text-slate-800 dark:text-white">
            {curiosity.title}
          </h3>

          <div className="rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl border">
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
            onClick={onRestart}
            className="w-full max-w-sm py-5 bg-sky-500 hover:bg-sky-600 text-white rounded-[2rem] shadow-xl font-black text-xl transition-all transform hover:scale-105"
          >
            PLAY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SummaryScreen;
