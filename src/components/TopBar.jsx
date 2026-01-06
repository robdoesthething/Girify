import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import PropTypes from 'prop-types';

const TopBar = ({ onOpenPage }) => {
  const { theme, t } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = page => {
    onOpenPage(page);
    setMenuOpen(false);
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 h-12 z-[4000] flex items-center justify-between px-3 md:px-6 transition-colors duration-300
                ${theme === 'dark' ? 'bg-slate-700/90 text-white' : 'bg-white/90 text-slate-800'}
backdrop-blur-md border-b ${theme === 'dark' ? 'border-slate-600' : 'border-slate-200'}
`}
      >
        {/* Left: Menu & Brand */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2 rounded-full transition-colors shrink-0 ${theme === 'dark' ? 'hover:bg-neutral-300' : 'hover:bg-slate-100'} `}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <button
            onClick={() => onOpenPage(null)}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <Logo className="h-5 md:h-7 w-auto object-contain" />
          </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          {/* Theme Toggle Removed */}
        </div>
      </div>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[6000]"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 left-0 w-64 z-[7000] p-6 shadow-2xl
                                    ${theme === 'dark' ? 'bg-neutral-200 text-neutral-900' : 'bg-white text-slate-800'}
`}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">{t('menu')}</h2>
                <button onClick={() => setMenuOpen(false)} className="p-1 hover:opacity-75">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-col gap-4">
                <button
                  onClick={() => handleMenuClick('home')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium text-sky-500 bg-sky-500/10"
                >
                  🏠 {t('home')}
                </button>
                <button
                  onClick={() => handleMenuClick('profile')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium"
                >
                  👤 {t('myProfile')}
                </button>
                <button
                  onClick={() => handleMenuClick('friends')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium"
                >
                  👥 {t('friends')}
                </button>
                <button
                  onClick={() => handleMenuClick('leaderboard')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium"
                >
                  🏆 {t('leaderboard')}
                </button>
                <button
                  onClick={() => handleMenuClick('shop')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium"
                >
                  🛒 {t('shop')}
                </button>
                <button
                  onClick={() => handleMenuClick('about')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium"
                >
                  ℹ️ {t('about')}
                </button>
                <button
                  onClick={() => handleMenuClick('settings')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium"
                >
                  ⚙️ {t('settings')}
                </button>
              </nav>

              <div className="absolute bottom-6 left-6 right-6 text-xs text-slate-500 text-center">
                v1.0.1 Girify
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

TopBar.propTypes = {
  onOpenPage: PropTypes.func.isRequired,
};

export default TopBar;
