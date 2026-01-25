import { AnimatePresence } from 'framer-motion';
import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { STORAGE_KEYS } from './config/constants';
import { GameProvider } from './context/GameContext';
import { useAppInitialization } from './hooks/useAppInitialization';
import { GameHistory } from './types/user';
import { getTodaySeed, hasPlayedToday } from './utils/game/dailyChallenge';
import { storage } from './utils/storage';
import { themeClasses } from './utils/themeUtils';

// Eagerly loaded components
import AnnouncementModal from './components/AnnouncementModal';
import DebugOverlay from './components/DebugOverlay';
import TopBar from './components/TopBar';

// Lazy loaded routes
import {
  AboutScreen,
  AchievementModal,
  AdminPanel,
  AdminRoute,
  ConfirmDialog,
  DistrictSelectionModal,
  FeedbackScreen,
  FriendsScreen,
  GameScreen,
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
    t,
    location,
    navigate,
    isLoading,
    confirm,
    confirmConfig,
    handleConfirmClose,
    state,
    dispatch,
    currentStreet,
    handlers,
    uiState,
  } = useAppInitialization();

  // Show loader while initializing
  if (isLoading) {
    return <PageLoader />;
  }

  const handleOpenPage = async (page: string | null) => {
    // Check if user is in the middle of a game
    if (state.gameState === 'playing' && state.currentQuestionIndex < state.quizStreets.length) {
      const confirmed = await confirm(
        t('exitGameWarning') || 'Exit game? Your current score will be saved.',
        'Exit Game',
        true
      );
      if (!confirmed) {
        return;
      }

      // Save partial progress
      try {
        const history = storage.get<GameHistory[]>(STORAGE_KEYS.HISTORY, []);
        const avgTime = state.quizResults.length
          ? (
              state.quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0) /
              state.quizResults.length
            ).toFixed(1)
          : 0;

        history.push({
          date: getTodaySeed().toString(),
          score: state.score,
          avgTime: avgTime.toString(),
          timestamp: Date.now(),
          username: state.username || 'guest',
          incomplete: true,
        });
        storage.set(STORAGE_KEYS.HISTORY, history);
      } catch (e) {
        console.error('[Game] Error saving partial progress:', e);
      }

      dispatch({ type: 'SET_GAME_STATE', payload: 'summary' });
    }

    navigate(page ? `/${page}` : '/');
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 bg-slate-50 ${themeClasses(theme, 'text-white', 'text-slate-900')}`}
    >
      <TopBar
        onOpenPage={handleOpenPage}
        username={state.username || undefined}
        onTriggerLogin={(mode = 'signin') => {
          dispatch({ type: 'SET_REGISTER_MODE', payload: mode });
          dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
          navigate('/');
        }}
        onLogout={handlers.handleLogout}
      />

      {/* Modals */}
      <AnimatePresence>
        {uiState.pendingAnnouncement && (
          <AnnouncementModal
            announcement={uiState.pendingAnnouncement}
            onDismiss={handlers.dismissAnnouncement}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {uiState.newlyUnlockedBadge && (
          <Suspense fallback={null}>
            <AchievementModal
              achievement={uiState.newlyUnlockedBadge}
              onDismiss={handlers.dismissAchievement}
            />
          </Suspense>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {uiState.showDistrictModal && (
          <Suspense fallback={null}>
            <DistrictSelectionModal
              username={state.username || ''}
              onComplete={handlers.handleDistrictComplete}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Routes */}
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route
              path="/"
              element={
                state.username && !uiState.emailVerified ? (
                  <VerifyEmailScreen theme={theme as 'light' | 'dark'} />
                ) : (
                  <GameProvider
                    value={{
                      state,
                      dispatch,
                      currentStreet,
                      handlers: {
                        handleSelectAnswer: handlers.handleSelectAnswer,
                        handleNext: handlers.handleNext,
                        processAnswer: handlers.processAnswer,
                        setupGame: handlers.setupGame,
                        handleRegister: handlers.handleRegister,
                        hasPlayedToday,
                      },
                    }}
                  >
                    <GameScreen />
                  </GameProvider>
                )
              }
            />
            <Route
              path="/leaderboard"
              element={<LeaderboardScreen currentUser={state.username || undefined} />}
            />
            <Route
              path="/settings"
              element={
                <SettingsScreen
                  onClose={() => handleOpenPage(null)}
                  onLogout={handlers.handleLogout}
                  autoAdvance={state.autoAdvance}
                  setAutoAdvance={val => dispatch({ type: 'SET_AUTO_ADVANCE', payload: val })}
                  username={state.username || undefined}
                />
              }
            />
            <Route path="/about" element={<AboutScreen onClose={() => handleOpenPage(null)} />} />
            <Route path="/profile" element={<ProfileScreen username={state.username || ''} />} />
            <Route
              path="/user/:username"
              element={<PublicProfileScreen currentUser={state.username || undefined} />}
            />
            <Route
              path="/friends"
              element={
                <FriendsScreen
                  username={state.username || ''}
                  onClose={() => handleOpenPage(null)}
                />
              }
            />
            <Route path="/shop" element={<ShopScreen username={state.username || ''} />} />
            <Route
              path="/news"
              element={
                <NewsScreen
                  username={state.username || undefined}
                  onClose={() => handleOpenPage(null)}
                />
              }
            />
            <Route
              path="/feedback"
              element={
                <FeedbackScreen
                  username={state.username || ''}
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

      <DebugOverlay />
    </div>
  );
};

export default AppRoutes;
