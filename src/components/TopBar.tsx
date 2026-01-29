import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { themeClasses } from '../utils/themeUtils';
import Logo from './Logo';

interface TopBarProps {
  onOpenPage: (page: string | null) => void;
  username?: string;
  onTriggerLogin: (mode: 'signin' | 'signup') => void;
  onLogout?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onOpenPage, username, onTriggerLogin, onLogout }) => {
  const { theme, t } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleMenuClick = (page: string | null) => {
    const RESTRICTED_PAGES = ['profile', 'friends', 'leaderboard', 'shop', 'admin'];

    if (page === 'login') {
      onTriggerLogin('signin');
      setMenuOpen(false);
      return;
    }
    if (page === 'signup') {
      onTriggerLogin('signup');
      setMenuOpen(false);
      return;
    }
    if (page === 'logout') {
      if (onLogout) {
        onLogout();
      }
      setMenuOpen(false);
      return;
    }

    if (page && RESTRICTED_PAGES.includes(page) && !username) {
      setShowLoginModal(true);
      setMenuOpen(false);
      return;
    }

    onOpenPage(page);
    setMenuOpen(false);
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 h-12 z-[4000] flex items-center justify-between px-3 md:px-6 transition-colors duration-300
                ${themeClasses(theme, 'bg-slate-700/90 text-white', 'bg-white/90 text-slate-800')}
backdrop-blur-md border-b ${themeClasses(theme, 'border-slate-600', 'border-slate-200')}
`}
      >
        <div className="flex items-center gap-4 md:gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2.5 rounded-full transition-colors shrink-0 ${themeClasses(theme, 'hover:bg-neutral-300', 'hover:bg-slate-100')} `}
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
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
            type="button"
            aria-label="Go to home"
          >
            <Logo className="h-5 md:h-7 w-auto object-contain" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[6000]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 left-0 w-64 z-[7000] shadow-2xl flex flex-col
                                    ${themeClasses(theme, 'bg-neutral-200 text-neutral-900', 'bg-white text-slate-800')}
`}
            >
              <div className="flex justify-between items-center p-6 pb-4 shrink-0">
                <h2 className="text-xl font-bold">{t('menu')}</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2.5 hover:opacity-75"
                  type="button"
                  aria-label="Close menu"
                >
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

              <nav className="flex-1 flex flex-col gap-2 overflow-y-auto px-6 pb-20">
                <button
                  onClick={() => handleMenuClick(null)}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium text-sky-500 bg-sky-500/10 flex items-center gap-4 shrink-0"
                  type="button"
                >
                  <span className="text-xl">🏠</span> {t('home')}
                </button>
                <button
                  onClick={() => handleMenuClick('profile')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-4 shrink-0"
                  type="button"
                >
                  <span className="text-xl">👤</span> {t('myProfile')}
                </button>
                <button
                  onClick={() => handleMenuClick('friends')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-4 shrink-0"
                  type="button"
                >
                  <span className="text-xl">👥</span> {t('friends')}
                </button>
                <button
                  onClick={() => handleMenuClick('leaderboard')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-4 shrink-0"
                  type="button"
                >
                  <span className="text-xl">🏆</span> {t('leaderboard')}
                </button>
                <button
                  onClick={() => handleMenuClick('shop')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-4 shrink-0"
                  type="button"
                >
                  <span className="text-xl">🛒</span> {t('shop')}
                </button>
                <button
                  onClick={() => handleMenuClick('about')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-4 shrink-0"
                  type="button"
                >
                  <span className="text-xl">ℹ️</span> {t('about')}
                </button>
                <button
                  onClick={() => handleMenuClick('news')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-4 shrink-0"
                  type="button"
                >
                  <span className="text-xl">📰</span> {t('news') || 'News'}
                </button>
                <button
                  onClick={() => handleMenuClick('feedback')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-4 shrink-0"
                  type="button"
                >
                  <span className="text-xl">📝</span> {t('feedback') || 'Feedback'}
                </button>
                <button
                  onClick={() => handleMenuClick('settings')}
                  className="text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-4 shrink-0"
                  type="button"
                >
                  <span className="text-xl">⚙️</span> {t('settings')}
                </button>

                <div className="h-px bg-slate-200 dark:bg-slate-700 my-2 shrink-0" />

                {!username ? (
                  <>
                    <button
                      onClick={() => handleMenuClick('login')}
                      className="text-left py-2 px-3 rounded-lg hover:bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-4 shrink-0"
                      type="button"
                    >
                      <span className="text-xl">🔑</span> Sign In
                    </button>
                    <button
                      onClick={() => handleMenuClick('signup')}
                      className="text-left py-2 px-3 rounded-lg hover:bg-sky-500/10 font-bold text-sky-500 flex items-center gap-4 shrink-0"
                      type="button"
                    >
                      <span className="text-xl">✨</span> Sign Up
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleMenuClick('logout')}
                    className="text-left py-2 px-3 rounded-lg hover:bg-red-500/10 font-bold text-red-500 flex items-center gap-4 shrink-0"
                    type="button"
                  >
                    <span className="text-xl">🚪</span> Log Out
                  </button>
                )}
              </nav>

              <div className="mb-6 mx-6 p-2 text-xs text-slate-500 text-center shrink-0">
                v1.0.1 Girify
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative z-10 w-full max-w-sm p-6 rounded-2xl shadow-xl text-center
                        ${themeClasses(theme, 'bg-slate-800 text-white', 'bg-white text-slate-800')}
                    `}
            >
              <h3 className="text-xl font-black mb-2">{t('loginRequired') || 'Login Required'}</h3>
              <p className="mb-6 opacity-70">
                {t('loginRequiredMessage') ||
                  'Join the Girify community! Create a profile to track your progress, earn badges, and compete on the leaderboard.'}
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    onTriggerLogin('signup');
                  }}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                  type="button"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    onTriggerLogin('signin');
                  }}
                  className="w-full py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-bold transition-all"
                  type="button"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-3 text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium transition-colors"
                  type="button"
                >
                  {t('cancel') || 'Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopBar;
