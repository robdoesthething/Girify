import React from 'react';
import { useTheme } from '../context/ThemeContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Logo from './Logo';
import SeoHead from './SeoHead';

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
      <main className="flex-1 flex flex-col items-center pt-20 px-6 pb-12 text-center relative w-full max-w-7xl mx-auto">
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
          <Logo className="h-28 md:h-36 w-auto object-contain mb-8 hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />

          <h1 className="heading-xl mb-6 max-w-4xl mx-auto text-balance">
            {t('landingHeadline') || 'Master the Streets of Barcelona'}
          </h1>

          <p className="text-lg md:text-2xl font-light opacity-80 mb-10 max-w-2xl leading-relaxed text-balance">
            {t('landingSubheadline') ||
              'Join thousands of locals and explorers in the ultimate daily street trivia challenge.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={onStart}
              className={`flex-1 px-8 py-5 rounded-2xl font-bold text-xl transform hover:scale-105 transition-all duration-300 shadow-2xl
                ${
                  hasPlayedToday
                    ? 'bg-[#000080] hover:bg-slate-900 text-white ring-2 ring-[#000080]/50 shadow-[#000080]/20'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/30 ring-2 ring-sky-400/50'
                }`}
            >
              {hasPlayedToday ? (
                <span className="flex flex-col items-center leading-none gap-1">
                  <span>{t('replayChallenge')}</span>
                  <span className="text-[10px] opacity-80 font-medium normal-case tracking-wider">
                    {t('scoreNotSaved')}
                  </span>
                </span>
              ) : (
                t('startQuiz') || 'Play Now'
              )}
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
              {t('login') || 'I have an account'}
            </button>
          </div>

          {/* Social Proof Text */}
          <p className="mt-6 text-sm opacity-60 font-medium tracking-wide">
            Join <span className="text-sky-400 font-bold">20,000+</span> players mastering the city
          </p>
        </motion.div>

        {/* Bento Grid Features */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4">
          {/* Main Feature: Daily Challenge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-2 glass-panel p-8 text-left relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-32 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-colors" />
            <h3 className="heading-lg mb-2 text-sky-400">Daily Challenge</h3>
            <p className="opacity-70 text-lg mb-6 max-w-md">
              Every day, 5 new streets. Compete with the whole city for the top spot. Can you get
              5/5?
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-xs font-bold text-sky-400"
                >
                  {i}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature: Streaks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="col-span-1 glass-panel p-8 text-left relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-24 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors" />
            <span className="text-4xl mb-4 block">🔥</span>
            <h3 className="text-2xl font-bold text-orange-400 mb-2">Build Streaks</h3>
            <p className="opacity-70">
              Consistency is key. Play daily to keep your flame alive and earn 2x Giuros.
            </p>
          </motion.div>

          {/* Feature: Leaderboards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="col-span-1 glass-panel p-8 text-left relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-24 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
            <span className="text-4xl mb-4 block">🏆</span>
            <h3 className="text-2xl font-bold text-emerald-400 mb-2">Rank Up</h3>
            <p className="opacity-70">
              Climb the local leaderboards. See how you compare to neighbors.
            </p>
          </motion.div>

          {/* Feature: Badges/Cosmetics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="col-span-1 md:col-span-2 glass-panel p-8 text-left relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors" />
            <h3 className="heading-lg mb-2 text-purple-400">Earn & Customize</h3>
            <p className="opacity-70 text-lg mb-0 max-w-lg">
              Win Giuros to unlock exclusive badges, frames, and titles. Show off your expertise
              with style.
            </p>
          </motion.div>
        </div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-full max-w-4xl mx-auto mt-24 mb-12 text-center"
        >
          <h2 className="heading-xl bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mb-12 text-3xl md:text-4xl">
            How it Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl glass flex items-center justify-center text-4xl mb-6 shadow-lg shadow-sky-500/10 ring-1 ring-white/10">
                🗺️
              </div>
              <h3 className="text-xl font-bold mb-2">Explore</h3>
              <p className="opacity-60 text-sm px-4">
                We highlight a random street in Barcelona on the map. Zoom, pan, and investigate.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl glass flex items-center justify-center text-4xl mb-6 shadow-lg shadow-pink-500/10 ring-1 ring-white/10">
                🧠
              </div>
              <h3 className="text-xl font-bold mb-2">Guess</h3>
              <p className="opacity-60 text-sm px-4">
                Type the street name. No multiple choice. Pure local knowledge (or good research).
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl glass flex items-center justify-center text-4xl mb-6 shadow-lg shadow-emerald-500/10 ring-1 ring-white/10">
                🚀
              </div>
              <h3 className="text-xl font-bold mb-2">Rank Up</h3>
              <p className="opacity-60 text-sm px-4">
                Earn Giuros, buy upgrades, and climb the daily leaderboard. Become a legend.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-sm opacity-40 font-mono">
        <p>
          &copy; {new Date().getFullYear()} Girify · Barcelona ·{' '}
          <span className="hover:text-white underline decoration-dotted cursor-pointer">
            Privacy
          </span>{' '}
          ·{' '}
          <span className="hover:text-white underline decoration-dotted cursor-pointer">Terms</span>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
