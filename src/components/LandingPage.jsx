import React from 'react';
import { useTheme } from '../context/ThemeContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Logo from './Logo';
import SeoHead from './SeoHead';
import { Link } from 'react-router-dom';

const LandingPage = ({ onStart, onLogin, theme, hasPlayedToday }) => {
  const { t } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} font-inter overflow-x-hidden`}
    >
      <SeoHead
        title={t('landingTitle') || 'Play Barcelona Streets Quiz'}
        description={
          t('landingDescription') ||
          "Test your knowledge of Barcelona's streets. Compete in daily challenges, earn badges, and climb the leaderboard."
        }
      />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 px-6 pb-12 text-center relative w-full max-w-7xl mx-auto">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20 top-[-20%]">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full flex flex-col items-center mb-16"
        >
          <Logo className="h-32 md:h-40 w-auto object-contain mb-8 hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />

          <h1 className="heading-xl mb-6 max-w-4xl mx-auto text-balance">
            {t('landingHeadline') || 'Master the Streets of Barcelona'}
          </h1>

          <p className="text-lg md:text-2xl font-light opacity-80 mb-10 max-w-2xl leading-relaxed text-balance">
            {t('landingSubheadline') ||
              'Join locals and explorers in the ultimate daily street trivia challenge.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
            <button
              onClick={onStart}
              className="flex-1 px-8 py-5 rounded-2xl font-black text-xl bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/30 ring-4 ring-sky-500/20 transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              {hasPlayedToday ? t('playAgain') || 'Play Again' : t('startQuiz') || 'Play Now'}
            </button>
            <button
              onClick={onLogin}
              className={`flex-1 px-8 py-5 rounded-2xl font-bold text-xl transform hover:scale-105 transition-all duration-300 glass-button
                ${
                  theme === 'dark'
                    ? 'text-slate-300 border-slate-700 hover:border-slate-500'
                    : 'text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
            >
              {t('login') || 'Login'}
            </button>
          </div>

          {/* Social Proof Text */}
          <p className="mt-8 text-sm opacity-60 font-medium tracking-wide">
            Compete, Earn Badges, and Rank Up!
          </p>
        </motion.div>

        {/* Features Minimal */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-8">
          <div className="p-6 rounded-2xl glass-panel text-left">
            <div className="text-3xl mb-2">🗺️</div>
            <h3 className="font-bold text-lg">Explore</h3>
            <p className="text-sm opacity-70">Discover new corners of the city every day.</p>
          </div>
          <div className="p-6 rounded-2xl glass-panel text-left">
            <div className="text-3xl mb-2">🧠</div>
            <h3 className="font-bold text-lg">Guess</h3>
            <p className="text-sm opacity-70">Test your knowledge without multiple choice.</p>
          </div>
          <div className="p-6 rounded-2xl glass-panel text-left">
            <div className="text-3xl mb-2">🏅</div>
            <h3 className="font-bold text-lg">Earn Badges</h3>
            <p className="text-sm opacity-70">
              Collect exclusive rewards and show off your status.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-sm opacity-40 font-mono">
        <p className="mb-2">&copy; {new Date().getFullYear()} Girify · Barcelona</p>
        <div className="flex justify-center gap-4">
          <Link to="/privacy" className="hover:text-white underline decoration-dotted">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-white underline decoration-dotted">
            Terms
          </Link>
        </div>
        <p className="mt-4 text-xs">Vibe Coded with React & Firebase</p>
      </footer>
    </div>
  );
};

export default LandingPage;
