import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { DISTRICTS } from '../data/districts';
import { themeClasses } from '../utils/themeUtils';
import SeoHead from './SeoHead';

const NEWS_HEADLINES = [
  'BREAKING: Local man finds parking in Gràcia on first try.',
  "ALERT: Guiri asks for 'Sangria' at classic Bodega.",
  'UPDATE: Rent prices drop by 0.00% this month.',
  'SCANDAL: Pidgeon steals whole croissant from tourist.',
];

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  theme: 'light' | 'dark';
  hasPlayedToday: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, theme }) => {
  const { t } = useTheme();
  const [newsIndex, setNewsIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNewsIndex(prev => (prev + 1) % NEWS_HEADLINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col relative ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 text-slate-900')} font-inter overflow-x-hidden`}
    >
      <SeoHead
        title="Girify - Become a Local"
        description="Master the streets of Barcelona. Guess streets, earn Giuros, and prove you know the real city."
      />

      {/* Animated background blobs for light mode */}
      {theme === 'light' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-sky-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-40 -right-20 w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      )}

      <main className="flex-1 flex flex-col items-center pt-16 px-4 pb-12 w-full max-w-7xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full flex flex-col items-center text-center max-w-4xl pt-8"
        >
          {/* Hero image with improved styling */}
          <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200 dark:border-slate-800 mb-10 group">
            <img
              src="/images/guiri_invasion.png"
              alt="Barcelona Streets"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-24">
              <h2 className="text-white text-2xl md:text-4xl font-black tracking-tight text-balance leading-tight">
                Become the Ultimate Local
              </h2>
              <p className="text-white/90 text-sm md:text-lg mt-3 font-medium">
                Show you know the real Barcelona... street by street
              </p>
            </div>
          </div>

          {/* Main heading - improved typography */}
          <h1 className="text-4xl md:text-6xl font-black mb-4 max-w-3xl mx-auto text-balance bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-400 leading-tight">
            {t('masterSelectedStreets') || 'Master Selected Streets!'}
          </h1>

          {/* Subtitle with better spacing */}
          <p className="text-lg md:text-xl font-medium text-slate-600 dark:text-slate-300 mb-12 max-w-2xl leading-relaxed text-balance">
            Navigate the city without a map. Earn{' '}
            <span className="text-yellow-500 dark:text-yellow-400 font-bold px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-500/20 rounded">
              Giuros
            </span>
            , climb the rankings, and celebrate your neighborhood.
          </p>

          {/* CTA Button - completely redesigned */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center mb-20">
            <button
              onClick={onLogin}
              className="group relative flex-1 px-10 py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white shadow-xl shadow-sky-500/30 transform hover:scale-105 hover:shadow-2xl hover:shadow-sky-500/40 active:scale-95 transition-all duration-300 overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" />

              <span className="relative flex items-center justify-center gap-2">
                Sign Up to Play
                <svg
                  className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </button>
          </div>

          {/* Feature cards with improved design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16 text-left">
            {[
              {
                emoji: '🏆',
                title: 'Rankings',
                desc: 'Compete with friends and neighbors for the top spot.',
              },
              {
                emoji: '🤝',
                title: 'Friendship',
                desc: 'Challenge your friends and track their progress.',
              },
              {
                emoji: '💰',
                title: 'Rewards',
                desc: 'Earn Giuros to customize your profile and unlock badges.',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.3 }}
                className="glass-panel p-8 transition-all duration-300 group"
              >
                <div className="text-5xl mb-5 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.emoji}
                </div>
                <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* District Showcase - MEET THE NEIGHBORHOODS */}
          <div className="w-full mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-400">
                Choose Your Allegiance
              </h2>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>

            <div className="relative group/scroller">
              {/* Fade edges */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />

              <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-4 snap-x scrollbar-hide -mx-4">
                {DISTRICTS.map((district, i) => (
                  <motion.div
                    key={district.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-shrink-0 snap-center"
                  >
                    <div className="w-48 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col items-center gap-4">
                      <div
                        className={`w-24 h-24 rounded-full bg-gradient-to-br ${district.color} p-1 shadow-inner relative overflow-hidden`}
                      >
                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                          <img
                            src={district.logo}
                            alt={district.teamName}
                            className="w-16 h-16 object-contain drop-shadow-lg"
                            style={{ imageRendering: 'pixelated', mixBlendMode: 'multiply' }}
                          />
                        </div>
                      </div>

                      <div className="text-center">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1">
                          {district.teamName}
                        </h3>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {district.name}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* News section with Mayor Jaume */}
          <div className="w-full max-w-2xl">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-left border-2 border-slate-300 dark:border-slate-700 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-8xl pointer-events-none">
                NEWS
              </div>

              {/* Mayor Jaume Pixel Art */}
              <div className="relative">
                <img
                  src="/assets/pixel_mayor_jaume.png"
                  alt="Mayor Jaume"
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-4 border-yellow-500 shadow-xl shadow-yellow-500/20 bg-indigo-900/50 object-cover flex-shrink-0 transform group-hover:scale-105 transition-transform duration-300"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-900">
                  MAYOR
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="inline-block text-yellow-600 dark:text-yellow-400 font-bold text-xs uppercase mb-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-500/20 rounded-full">
                  🎙️ Mayor Jaume Reports
                </div>
                <div className="font-bold text-base sm:text-lg min-h-[3rem] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={newsIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="line-clamp-2 text-slate-800 dark:text-slate-200 font-medium italic"
                    >
                      &quot;{NEWS_HEADLINES[newsIndex]}&quot;
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer with subtle improvements */}
      <footer className="relative p-8 text-center text-sm text-slate-600 dark:text-slate-400 font-mono z-10 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
        <p className="mb-3">&copy; {new Date().getFullYear()} Girify · Barcelona</p>
        <div className="flex justify-center gap-6">
          <Link
            to="/privacy"
            className="hover:text-slate-700 dark:hover:text-white underline decoration-dotted underline-offset-4 transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="hover:text-slate-700 dark:hover:text-white underline decoration-dotted underline-offset-4 transition-colors"
          >
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
