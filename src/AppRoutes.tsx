import { AnimatePresence } from 'framer-motion';
import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { STORAGE_KEYS } from './config/constants';
import { useAppInitialization } from './hooks/useAppInitialization';
import { storage } from './utils/storage';
import { themeClasses } from './utils/themeUtils';

// Lazy loaded components for better code splitting
const DebugOverlay = React.lazy(() => import('./components/DebugOverlay'));
const TopBar = React.lazy(() => import('./components/TopBar'));

// Lazy loaded routes
import {
  AboutScreen,
  AdminPanel,
  AdminRoute,
  ConfirmDialog,
  FeedbackScreen,
  FriendsScreen,
  GamePage,
  LeaderboardScreen,
  NewsScreen,
  PageLoader,
  PrivacyPolicy,
  ProfileScreen,
  PublicProfileScreen,
  SettingsScreen,
  ShopScreen,
  StreetsFetcher,
  TermsOfService,
  VerifyEmailScreen,
} from './routes';

const AppRoutes: React.FC = () => {
  const {
    theme,
    // t is used via themeClasses only
    location,
    navigate,
    isLoading,
    // confirm is available but not used in this component
    confirmConfig,
    handleConfirmClose,
    user,
    profile,
    handleLogout,
  } = useAppInitialization();

  // Show loader while initializing
  if (isLoading) {
    return <PageLoader />;
  }

  const handleOpenPage = (page: string | null) => {
    // Note: Game progress saving is now handled by GamePage unmount/cleanup
    navigate(page ? `/${page}` : '/');
  };

  const currentUsername = profile?.username || user?.displayName || undefined;

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 bg-slate-50 ${themeClasses(theme, 'text-white', 'text-slate-900')}`}
    >
      <Suspense fallback={<div className="h-14" />}>
        <TopBar
          onOpenPage={handleOpenPage}
          username={currentUsername}
          onTriggerLogin={(mode = 'signin') => {
            navigate('/', {
              state: { mode: mode === 'signup' ? 'register' : 'register', submode: mode },
            });
          }}
          onLogout={handleLogout}
        />
      </Suspense>

      {/* Routes */}
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route
              path="/"
              element={
                user && user.emailVerified === false ? (
                  <VerifyEmailScreen theme={theme as 'light' | 'dark'} />
                ) : (
                  <GamePage username={currentUsername} user={user} />
                )
              }
            />
            <Route
              path="/leaderboard"
              element={<LeaderboardScreen currentUser={currentUsername} />}
            />
            <Route
              path="/settings"
              element={
                <SettingsScreen
                  onClose={() => handleOpenPage(null)}
                  onLogout={handleLogout}
                  autoAdvance={false} // Auto-advance state moved to GamePage
                  setAutoAdvance={() => {}} // No-op for global settings
                  username={currentUsername}
                />
              }
            />
            <Route path="/about" element={<AboutScreen onClose={() => handleOpenPage(null)} />} />
            <Route path="/profile" element={<ProfileScreen username={currentUsername || ''} />} />
            <Route
              path="/user/:username"
              element={<PublicProfileScreen currentUser={currentUsername} />}
            />
            <Route
              path="/friends"
              element={
                <FriendsScreen
                  username={currentUsername || ''}
                  onClose={() => handleOpenPage(null)}
                />
              }
            />
            <Route path="/shop" element={<ShopScreen username={currentUsername || ''} />} />
            <Route
              path="/news"
              element={
                <NewsScreen username={currentUsername} onClose={() => handleOpenPage(null)} />
              }
            />
            <Route
              path="/feedback"
              element={
                <FeedbackScreen
                  username={currentUsername || ''}
                  onClose={() => {
                    storage.set(STORAGE_KEYS.LAST_FEEDBACK, Date.now().toString());
                    handleOpenPage(null);
                  }}
                />
              }
            />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/fetch-streets" element={<StreetsFetcher />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>

      {/* Footer */}
      <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none opacity-40 mix-blend-difference pb-4">
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 font-inter">
          © 2025 Girify. All rights reserved.
        </p>
      </div>

      <Suspense fallback={null}>
        <ConfirmDialog
          isOpen={!!confirmConfig}
          title={confirmConfig?.title || ''}
          message={confirmConfig?.message || ''}
          isDangerous={confirmConfig?.isDangerous || false}
          onConfirm={() => handleConfirmClose(true)}
          onCancel={() => handleConfirmClose(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DebugOverlay />
      </Suspense>
    </div>
  );
};

export default AppRoutes;
