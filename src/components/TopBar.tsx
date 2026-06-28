import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { version } from '../../package.json';
import { Z_INDEX } from '../config/zIndex';
import { useTheme } from '../context/ThemeContext';
import { themeClasses } from '../utils/themeUtils';
import Logo from './Logo';
import Button from './ui/Button';
import Modal from './ui/Modal';

// Prefetch map for lazy-loaded route chunks
const prefetchRouteChunk: Record<string, () => void> = {
  leaderboard: () => import('../features/leaderboard/components/LeaderboardScreen'),
  shop: () => import('../features/shop/components/ShopScreen'),
  profile: () => import('../features/profile/components/ProfileScreen'),
  friends: () => import('../features/friends/components/FriendsScreen'),
};

interface TopBarProps {
  onOpenPage: (page: string | null) => void;
  username?: string;
  onTriggerLogin: (mode: 'signin' | 'signup') => void;
  onLogout?: () => void;
}

const TopBar: React.FC<TopBarProps> = React.memo(
  ({ onOpenPage, username, onTriggerLogin, onLogout }) => {
    const { theme, toggleTheme, t } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const versionTapCount = useRef(0);
    const versionTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleVersionTap = useCallback(() => {
      versionTapCount.current += 1;
      if (versionTapTimer.current) {
        clearTimeout(versionTapTimer.current);
      }
      if (versionTapCount.current >= 7) {
        versionTapCount.current = 0;
        setMenuOpen(false);
        navigate('/admin');
        return;
      }
      versionTapTimer.current = setTimeout(() => {
        versionTapCount.current = 0;
      }, 2000);
    }, [navigate]);
    // Close the drawer when navigation happens outside it (back button, in-page links).
    // State is adjusted during render to avoid a cascading effect re-render.
    const [lastPathname, setLastPathname] = useState(location.pathname);
    if (lastPathname !== location.pathname) {
      setLastPathname(location.pathname);
      setMenuOpen(false);
    }

    // Escape closes the drawer
    useEffect(() => {
      if (!menuOpen) {
        return undefined;
      }
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMenuOpen(false);
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [menuOpen]);

    const handlePrefetch = useCallback((page: string | null) => {
      if (page && prefetchRouteChunk[page]) {
        prefetchRouteChunk[page]();
      }
    }, []);

    const isActivePage = (page: string | null) =>
      page === null ? location.pathname === '/' : location.pathname === `/${page}`;

    const handleMenuClick = (page: string | null) => {
      const RESTRICTED_PAGES = ['profile', 'friends', 'admin'];

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
          className={`w-full h-12 shrink-0 ${Z_INDEX.NAVIGATION} flex items-center justify-between px-3 md:px-6 transition-colors duration-300
                ${themeClasses(theme, 'bg-slate-950/90 text-white', 'bg-white/90 text-slate-800')}
backdrop-blur-md border-b ${themeClasses(theme, 'border-white/8', 'border-slate-200')}
`}
        >
          <div className="flex items-center gap-4 md:gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2.5 rounded-full transition-all active:scale-90 shrink-0 ${themeClasses(theme, 'hover:bg-slate-700', 'hover:bg-slate-100')} `}
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

          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-full transition-all active:scale-90 shrink-0 ${themeClasses(theme, 'hover:bg-slate-700', 'hover:bg-slate-100')}`}
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm6.364 2.636a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zM21 11a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1zM17.657 17.657a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414zM12 19a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zM6.343 17.657a1 1 0 0 1 0-1.414l.707-.707a1 1 0 1 1 1.414 1.414l-.707.707a1 1 0 0 1-1.414 0zM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1zM6.343 6.343a1 1 0 0 1 1.414 0l.707.707A1 1 0 1 1 7.05 8.464l-.707-.707a1 1 0 0 1 0-1.414zM12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75 9.75 9.75 0 0 1 8.25 6a9.72 9.72 0 0 1 .252-2.252A9.752 9.752 0 0 0 12 21.75c3.58 0 6.703-1.924 8.45-4.797a9.75 9.75 0 0 0 1.302-.951z" />
              </svg>
            )}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                className={`fixed inset-0 bg-black/60 ${Z_INDEX.BACKDROP}`}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed top-0 bottom-0 left-0 w-64 ${Z_INDEX.MODAL} shadow-2xl flex flex-col
                                    ${themeClasses(theme, 'bg-slate-900 text-slate-100', 'bg-white text-slate-800')}
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

                <nav className="flex-1 flex flex-col gap-2 overflow-y-auto px-6 pb-4">
                  {[
                    { page: null, emoji: '🏠', label: t('home') },
                    { page: 'profile', emoji: '👤', label: t('myProfile') },
                    { page: 'friends', emoji: '👥', label: t('friends') },
                    { page: 'leaderboard', emoji: '🏆', label: t('leaderboard') },
                    { page: 'shop', emoji: '🛒', label: t('shop') },
                    { page: 'feedback', emoji: '📝', label: t('feedback') || 'Feedback' },
                    { page: 'settings', emoji: '⚙️', label: t('settings') },
                  ].map(item => (
                    <button
                      key={item.page ?? 'home'}
                      onClick={() => handleMenuClick(item.page)}
                      onMouseEnter={() => handlePrefetch(item.page)}
                      onTouchStart={() => handlePrefetch(item.page)}
                      className={`text-left py-2 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-4 shrink-0 ${isActivePage(item.page) ? 'text-sky-500 bg-sky-500/10' : ''}`}
                      type="button"
                    >
                      <span className="text-xl">{item.emoji}</span> {item.label}
                    </button>
                  ))}

                  <div
                    className={`h-px my-2 shrink-0 ${themeClasses(theme, 'bg-slate-700', 'bg-slate-200')}`}
                  />

                  {!username ? (
                    <>
                      <button
                        onClick={() => handleMenuClick('login')}
                        className={`text-left py-2 px-3 rounded-lg hover:bg-emerald-500/10 font-bold flex items-center gap-4 shrink-0 ${themeClasses(theme, 'text-emerald-400', 'text-emerald-600')}`}
                        type="button"
                      >
                        <span className="text-xl">🔑</span> {t('signIn')}
                      </button>
                      <button
                        onClick={() => handleMenuClick('signup')}
                        className="text-left py-2 px-3 rounded-lg hover:bg-sky-500/10 font-bold text-sky-500 flex items-center gap-4 shrink-0"
                        type="button"
                      >
                        <span className="text-xl">✨</span> {t('signUp')}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleMenuClick('logout')}
                      className="text-left py-2 px-3 rounded-lg hover:bg-red-500/10 font-bold text-red-500 flex items-center gap-4 shrink-0"
                      type="button"
                    >
                      <span className="text-xl">🚪</span> {t('logout')}
                    </button>
                  )}
                  <p
                    className="text-xs text-slate-400 text-center py-2 mt-1 select-none cursor-default"
                    onClick={handleVersionTap}
                  >
                    v{version} Girify
                  </p>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <Modal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          size="sm"
          showCloseButton={false}
        >
          <div className="text-center">
            <h3 className="text-xl font-black mb-2">{t('loginRequired') || 'Login Required'}</h3>
            <p className="mb-6 opacity-70">
              {t('loginRequiredMessage') ||
                'Join the Girify community! Create a profile to track your progress, earn badges, and compete on the leaderboard.'}
            </p>
            <div className="flex flex-col gap-4">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => {
                  setShowLoginModal(false);
                  onTriggerLogin('signup');
                }}
                type="button"
              >
                {t('signUp')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => {
                  setShowLoginModal(false);
                  onTriggerLogin('signin');
                }}
                type="button"
              >
                {t('signIn')}
              </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => setShowLoginModal(false)}
                type="button"
              >
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }
);

TopBar.displayName = 'TopBar';

export default TopBar;
