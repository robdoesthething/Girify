import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import SeoHead from './SeoHead';
import { Link } from 'react-router-dom';

const NEWS_HEADLINES = [
  'BREAKING: Local man finds parking in Gràcia on first try.',
  "ALERT: Guiri asks for 'Sangria' at classic Bodega.",
  'UPDATE: Rent prices drop by 0.00% this month.',
  'SCANDAL: Pidgeon steals whole croissant from tourist.',
];

const LandingPage = ({ onStart, onLogin, theme }) => {
  const { t } = useTheme();
  // Simple ticker for "Mejur Jouma" news
  const [newsIndex, setNewsIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNewsIndex(prev => (prev + 1) % NEWS_HEADLINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col relative ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} font-inter overflow-x-hidden`}
    >
      <SeoHead
        title="Girify - Become a Local"
        description="Master the streets of Barcelona. Guess streets, earn Giuros, and prove you know the real city."
      />

      {/* Hero Section - pt-16 to account for fixed TopBar */}
      <main className="flex-1 flex flex-col items-center pt-16 px-4 pb-12 w-full max-w-7xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full flex flex-col items-center text-center max-w-4xl pt-8"
        >
          {/* Pixel Art Hero */}
          <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 dark:border-white/10 mb-8 group">
            <img
              src="/images/guiri_invasion.png"
              alt="Barcelona Streets"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
              <h2 className="text-white text-xl md:text-3xl font-black tracking-tight text-balance shadow-black drop-shadow-lg">
                BECOME THE ULTIMATE LOCAL.
              </h2>
              <p className="text-white/80 text-sm md:text-base mt-2 font-mono">
                Show you know the real Barcelona... street by street.
              </p>
            </div>
          </div>

          <h1 className="heading-xl mb-6 max-w-2xl mx-auto text-balance">
            Master Selected Streets!
          </h1>

          <p className="text-lg md:text-xl font-medium opacity-70 mb-10 max-w-xl leading-relaxed text-balance">
            Navigate the city without a map. Earn{' '}
            <span className="text-yellow-500 font-bold">Giuros</span>, climb the rankings, and
            celebrate your neighborhood.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center mb-16">
            <button
              onClick={onLogin}
              className="flex-1 px-8 py-4 rounded-xl font-black text-xl bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30 transform hover:-translate-y-1 transition-all duration-300"
            >
              Sign Up to Play
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12 text-left">
            <div className="glass-panel p-6">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="font-bold text-lg mb-2">Rankings</h3>
              <p className="text-sm opacity-60">
                Compete with friends and neighbors for the top spot.
              </p>
            </div>
            <div className="glass-panel p-6">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="font-bold text-lg mb-2">Friendship</h3>
              <p className="text-sm opacity-60">Challenge your friends and track their progress.</p>
            </div>
            <div className="glass-panel p-6">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-bold text-lg mb-2">Rewards</h3>
              <p className="text-sm opacity-60">
                Earn Giuros to customize your profile and unlock badges.
              </p>
            </div>
          </div>

          {/* Social / Mayor Section */}
          <div className="w-full grid grid-cols-1 gap-6 p-4">
            {/* Character Card */}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl p-6 flex items-center gap-4 text-left border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 font-black text-6xl">NEWS</div>
              <img
                src="/images/mejur_jouma.png"
                alt="Mejur Jouma"
                className="w-24 h-24 rounded-full border-4 border-yellow-500 shadow-lg bg-indigo-900 object-cover"
              />
              <div>
                <div className="text-yellow-500 font-bold text-xs uppercase mb-1">
                  Mejur Jouma Reports
                </div>
                <div className="font-bold text-sm h-12 flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={newsIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="line-clamp-2"
                    >
                      "{NEWS_HEADLINES[newsIndex]}"
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer - Single copyright notice */}
      <footer className="relative mt-auto p-8 text-center text-sm opacity-40 font-mono z-10 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <p className="mb-2">&copy; {new Date().getFullYear()} Girify · Barcelona</p>
        <div className="flex justify-center gap-4">
          <Link to="/privacy" className="hover:text-white underline decoration-dotted">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-white underline decoration-dotted">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
