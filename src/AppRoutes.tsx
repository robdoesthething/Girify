import { AnimatePresence } from 'framer-motion';
import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import TopBar from './components/TopBar';
import { useAppInitialization } from './hooks/useAppInitialization';
import { themeClasses } from './utils/themeUtils';

// Lazy loaded components for better code splitting
const DebugOverlay = React.lazy(() => import('./components/DebugOverlay'));

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

  const currentUsername =
    profile?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || undefined;

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 bg-slate-50 ${themeClasses(theme, 'text-white', 'text-slate-900')}`}
    >
      <TopBar
        onOpenPage={handleOpenPage}
        username={currentUsername}
        onTriggerLogin={(mode = 'signin') => {
          navigate('/', {
            state: { mode: 'register', submode: mode },
          });
        }}
        onLogout={handleLogout}
      />

      {/* Scrollable Content Area */}
      <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route
                path="/"
                element={
                  user && user.email_confirmed_at === null ? (
                    <VerifyEmailScreen theme={theme as 'light' | 'dark'} />
                  ) : (
                    <GamePage username={currentUsername} />
                  )
                }
              />
              <Route
                path="/leaderboard"
                element={<LeaderboardScreen currentUser={currentUsername} />}
              />
              <Route
                path="/settings"
                element={<SettingsScreen onLogout={handleLogout} username={currentUsername} />}
              />
              <Route path="/friends" element={<FriendsScreen username={currentUsername || ''} />} />
              <Route path="/shop" element={<ShopScreen username={currentUsername || ''} />} />
              <Route path="/about" element={<AboutScreen />} />
              <Route path="/news" element={<NewsScreen username={currentUsername} />} />
              <Route
                path="/feedback"
                element={<FeedbackScreen username={currentUsername || ''} />}
              />
              <Route path="/profile" element={<ProfileScreen username={currentUsername || ''} />} />
              <Route
                path="/u/:handle"
                element={<PublicProfileScreen currentUser={currentUsername} />}
              />

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPanel />} />
                {import.meta.env.DEV && (
                  <Route path="/fetch-streets" element={<StreetsFetcher />} />
                )}
              </Route>
            </Routes>
          </AnimatePresence>
        </Suspense>

        {/* Footer - positioned at bottom of scrollable area content or fixed?
            Original was absolute bottom-1. If we want it to scroll with content, put it here.
            If we want it fixed, keep it outside. But fixed might cover content.
            Let's keep it outside as per original design, but pointer-events-none makes it click-through. */}
      </div>

      <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none opacity-40 mix-blend-difference pb-4 z-10">
        <p
          className={`text-[10px] font-medium font-inter ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
        >
          © {new Date().getFullYear()} Girify. All rights reserved.
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

      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <DebugOverlay />
        </Suspense>
      )}
    </div>
  );
};

export default AppRoutes;
