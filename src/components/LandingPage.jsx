import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
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

  // Use lazy state initialization for stable random number (pure and efficient)
  const [dailyPlayers] = useState(() => Math.floor(Math.random() * 500) + 1200);

  useEffect(() => {
    const interval = setInterval(() => {
      setNewsIndex(prev => (prev + 1) % NEWS_HEADLINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} font-inter overflow-x-hidden`}
    >
      <SeoHead
        title="Girify - Guiris vs Locals"
        description="Defend Barcelona from the tourist invasion. Guess streets, earn Giuros, and prove you are a true local."
      />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center pt-10 px-4 pb-12 w-full max-w-7xl mx-auto">
        <div className="w-full flex justify-between items-center mb-8 px-4">
          <Logo className="h-16 w-auto object-contain" />
          <button onClick={onLogin} className="px-6 py-2 rounded-xl text-sm font-bold glass-button">
            {t('login') || 'Login'}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full flex flex-col items-center text-center max-w-4xl"
        >
          {/* Pixel Art Hero */}
          <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 dark:border-white/10 mb-8 group">
            <img
              src="/images/guiri_invasion.png"
              alt="Guiris invading Barcelona"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
              <h2 className="text-white text-xl md:text-3xl font-black tracking-tight text-balance shadow-black drop-shadow-lg">
                THE INVASION HAS BEGUN.
              </h2>
              <p className="text-white/80 text-sm md:text-base mt-2 font-mono">
                Only true locals can save the city... by guessing streets correctly.
              </p>
            </div>
          </div>

          <h1 className="heading-xl mb-6 max-w-2xl mx-auto text-balance">Reclaim the Streets!</h1>

          <p className="text-lg md:text-xl font-medium opacity-70 mb-10 max-w-xl leading-relaxed text-balance">
            Prove you know your city better than a tourist with a map. Earn{' '}
            <span className="text-yellow-500 font-bold">Giuros</span>, collect badges, and defend
            your neighborhood.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center mb-16">
            <button
              onClick={onStart}
              className="flex-1 px-8 py-4 rounded-xl font-black text-xl bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30 transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Mission
            </button>
          </div>

          {/* Social / Mayor Section */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
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

            {/* Features Card */}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl p-6 flex flex-col justify-center text-left border border-slate-200 dark:border-slate-800">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 text-center p-2 rounded-xl bg-slate-200 dark:bg-slate-800">
                  <div className="text-2xl">🏆</div>
                  <div className="text-[10px] uppercase font-bold opacity-60 mt-1">Rank Up</div>
                </div>
                <div className="flex-1 text-center p-2 rounded-xl bg-slate-200 dark:bg-slate-800">
                  <div className="text-2xl">🦐</div>
                  <div className="text-[10px] uppercase font-bold opacity-60 mt-1">No Guiris</div>
                </div>
                <div className="flex-1 text-center p-2 rounded-xl bg-slate-200 dark:bg-slate-800">
                  <div className="text-2xl">💰</div>
                  <div className="text-[10px] uppercase font-bold opacity-60 mt-1">Get Rich</div>
                </div>
              </div>
              <p className="text-xs opacity-60 text-center">
                Join {dailyPlayers} locals playing today.
              </p>
            </div>
          </div>
        </motion.div>
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
