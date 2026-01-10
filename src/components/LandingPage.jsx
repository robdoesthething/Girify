import React from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Logo from './Logo';
import SeoHead from './SeoHead';

const LandingPage = ({ onStart, onLogin, theme, hasPlayedToday }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      <SeoHead
        title={t('landingTitle') || 'Play Barcelona Streets Quiz'}
        description={
          t('landingDescription') ||
          "Test your knowledge of Barcelona's streets. Compete in daily challenges, earn badges, and climb the leaderboard."
        }
      />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-sky-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-2xl w-full flex flex-col items-center"
        >
          <Logo className="h-24 md:h-32 w-auto object-contain mb-8 hover:scale-105 transition-transform duration-500" />

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-emerald-500">
            {t('landingHeadline') || 'Master the Streets of Barcelona'}
          </h1>

          <p className="text-lg md:text-xl font-light opacity-80 mb-10 max-w-lg leading-relaxed">
            {t('landingSubheadline') ||
              'Join thousands of locals and explorers in the ultimate daily street trivia challenge.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={onStart}
              className={`flex-1 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all duration-300
                ${
                  hasPlayedToday
                    ? 'bg-[#000080] hover:bg-slate-900 text-white shadow-[#000080]/20'
                    : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20'
                }`}
            >
              {hasPlayedToday ? (
                <span className="flex flex-col items-center leading-none gap-1">
                  <span>{t('replayChallenge')}</span>
                  <span className="text-[10px] opacity-80 font-medium normal-case tracking-normal">
                    {t('scoreNotSaved')}
                  </span>
                </span>
              ) : (
                t('startQuiz') || 'Play Now'
              )}
            </button>
            <button
              onClick={onLogin}
              className={`flex-1 px-8 py-4 rounded-2xl font-bold text-lg border-2 transform hover:scale-105 transition-all duration-300
                ${
                  theme === 'dark'
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-white text-slate-600'
                }`}
            >
              {t('login') || 'I have an account'}
            </button>
          </div>

          {/* Social Proof / Stats */}
          <div className="mt-12 flex items-center justify-center gap-8 opacity-60 text-sm font-medium uppercase tracking-widest">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-sky-500">20k+</span>
              <span>Streets</span>
            </div>
            <div className="w-px h-8 bg-current opacity-20" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-emerald-500">Daily</span>
              <span>Challenges</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs opacity-40">
        <p>&copy; {new Date().getFullYear()} Girify. Made with ❤️ in BCN.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
