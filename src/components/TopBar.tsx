import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText,
  Home,
  Info,
  Lock,
  LogIn,
  LogOut,
  MessageSquare,
  Newspaper,
  Settings,
  ShoppingCart,
  Trophy,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
    const { theme, t } = useTheme();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
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
                ${themeClasses(theme, 'bg-slate-700/90 text-white', 'bg-white/90 text-slate-800')}
backdrop-blur-md border-b ${themeClasses(theme, 'border-slate-600', 'border-slate-200')}
`}
        >
          <div className="flex items-center gap-4 md:gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2.5 rounded-full transition-all active:scale-90 shrink-0 ${themeClasses(theme, 'hover:bg-neutral-300', 'hover:bg-slate-100')} `}
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

          <div className="w-10" />
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

                <nav className="flex-1 flex flex-col gap-2 overflow-y-auto px-6 pb-4">
                  {[
                    { page: null, icon: <Home size={18} />, label: t('home') },
                    { page: 'profile', icon: <User size={18} />, label: t('myProfile') },
                    { page: 'friends', icon: <Users size={18} />, label: t('friends') },
                    { page: 'leaderboard', icon: <Trophy size={18} />, label: t('leaderboard') },
                    { page: 'shop', icon: <ShoppingCart size={18} />, label: t('shop') },
                    { page: 'about', icon: <Info size={18} />, label: t('about') },
                    { page: 'news', icon: <Newspaper size={18} />, label: t('news') || 'News' },
                    {
                      page: 'feedback',
                      icon: <MessageSquare size={18} />,
                      label: t('feedback') || 'Feedback',
                    },
                    { page: 'settings', icon: <Settings size={18} />, label: t('settings') },
                    { page: 'privacy', icon: <Lock size={18} />, label: t('privacy') || 'Privacy' },
                    {
                      page: 'terms',
                      icon: <FileText size={18} />,
                      label: t('terms') || 'Terms',
                    },
                  ].map(item => (
                    <button
                      key={item.page ?? 'home'}
                      onClick={() => handleMenuClick(item.page)}
                      onMouseEnter={() => handlePrefetch(item.page)}
                      onTouchStart={() => handlePrefetch(item.page)}
                      className={`text-left py-2.5 px-3 rounded-lg hover:bg-slate-500/10 font-medium flex items-center gap-3 shrink-0 ${isActivePage(item.page) ? 'text-sky-500 bg-sky-500/10' : ''}`}
                      type="button"
                    >
                      <span className="w-5 flex items-center justify-center opacity-70 shrink-0">
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}

                  <div
                    className={`h-px my-2 shrink-0 ${themeClasses(theme, 'bg-slate-700', 'bg-slate-200')}`}
                  />

                  {!username ? (
                    <>
                      <button
                        onClick={() => handleMenuClick('login')}
                        className={`text-left py-2.5 px-3 rounded-lg hover:bg-emerald-500/10 font-bold flex items-center gap-3 shrink-0 ${themeClasses(theme, 'text-emerald-400', 'text-emerald-600')}`}
                        type="button"
                      >
                        <span className="w-5 flex items-center justify-center shrink-0">
                          <LogIn size={18} />
                        </span>
                        {t('signIn')}
                      </button>
                      <button
                        onClick={() => handleMenuClick('signup')}
                        className="text-left py-2.5 px-3 rounded-lg hover:bg-sky-500/10 font-bold text-sky-500 flex items-center gap-3 shrink-0"
                        type="button"
                      >
                        <span className="w-5 flex items-center justify-center shrink-0">
                          <UserPlus size={18} />
                        </span>
                        {t('signUp')}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleMenuClick('logout')}
                      className="text-left py-2.5 px-3 rounded-lg hover:bg-red-500/10 font-bold text-red-500 flex items-center gap-3 shrink-0"
                      type="button"
                    >
                      <span className="w-5 flex items-center justify-center shrink-0">
                        <LogOut size={18} />
                      </span>
                      {t('logout')}
                    </button>
                  )}
                  <p className="text-xs text-slate-400 text-center py-2 mt-1">v{version} Girify</p>
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
