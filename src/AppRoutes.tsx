import { AnimatePresence } from 'framer-motion';
import React, { Suspense, lazy } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

// Eagerly loaded (needed immediately)
import AnnouncementModal from './components/AnnouncementModal';
import GameScreen from './components/GameScreen';
import TopBar from './components/TopBar';

// Lazy loaded (route-based code splitting)
const AboutScreen = lazy(() => import('./components/AboutScreen'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
const FeedbackScreen = lazy(() => import('./components/FeedbackScreen'));
const FriendsScreen = lazy(() => import('./components/FriendsScreen'));
const LeaderboardScreen = lazy(() => import('./components/LeaderboardScreen'));
const NewsScreen = lazy(() => import('./components/NewsScreen'));
const ProfileScreen = lazy(() => import('./components/ProfileScreen'));
const PublicProfileScreen = lazy(() => import('./components/PublicProfileScreen'));
const SettingsScreen = lazy(() => import('./components/SettingsScreen'));
const ShopScreen = lazy(() => import('./components/ShopScreen'));
const StreetsFetcher = lazy(() => import('./components/StreetsFetcher'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const VerifyEmailScreen = lazy(() => import('./components/VerifyEmailScreen'));
const AchievementModal = lazy(() => import('./components/AchievementModal'));
const ConfirmDialog = lazy(() =>
  import('./components/ConfirmDialog').then(m => ({ default: m.ConfirmDialog }))
);

import { STORAGE_KEYS } from './config/constants';
import { useTheme } from './context/ThemeContext';
import { useAchievements } from './hooks/useAchievements';
import { useAnnouncements } from './hooks/useAnnouncements';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
import { useStreets } from './hooks/useStreets';
import { GameHistory } from './types/user';
import { getTodaySeed, hasPlayedToday } from './utils/dailyChallenge';
import { saveScore } from './utils/leaderboard';
import { hasDailyReferral } from './utils/social';
import { storage } from './utils/storage';

import { useConfirm } from './hooks/useConfirm';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
  </div>
);

const AppRoutes: React.FC = () => {
  const { theme, t, deviceMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  // Street data hook
  const { validStreets, getHintStreets } = useStreets();

  // Confirmation Hook
  const { confirm, confirmConfig, handleClose } = useConfirm();

  // Game Logic Hook
  const {
    state,
    dispatch,
    currentStreet,
    setupGame,
    handleSelectAnswer,
    handleNext,
    handleRegister,
    processAnswer,
  } = useGameState(validStreets, getHintStreets);

  // Announcement hook
  const { pendingAnnouncement, dismissAnnouncement, checkAnnouncements } = useAnnouncements(
    state.username || ''
  );

  // Achievement hook
  const { newlyUnlockedBadge, dismissAchievement } = useAchievements(
    state.username,
    state.gameState,
    location.pathname
  );

  // Auth hook
  const { emailVerified, handleLogout: performLogout } = useAuth(
    dispatch,
    state.gameState,
    checkAnnouncements
  );
  const handleLogout = () => performLogout(navigate);

  const handleOpenPage = async (page: string | null) => {
    // Check if user is in the middle of a game
    if (state.gameState === 'playing' && state.currentQuestionIndex < state.quizStreets.length) {
      const confirmed = await confirm(
        t('exitGameWarning') ||
          'Exit game? Your current score will be saved. You can play again anytime!',
        'Exit Game',
        true
      );
      if (!confirmed) {
        return;
      } // Don't navigate if user cancels

      // User confirmed - save current progress before exiting
      try {
        const history = storage.get<GameHistory[]>(STORAGE_KEYS.HISTORY, []);
        const avgTime = state.quizResults.length
          ? (
              state.quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0) /
              state.quizResults.length
            ).toFixed(1)
          : 0;

        const partialRecord = {
          date: getTodaySeed().toString(),
          score: state.score,
          avgTime: avgTime.toString(),
          timestamp: Date.now(),
          username: state.username || 'guest',
          incomplete: true, // Mark as incomplete
        };
        history.push(partialRecord);
        storage.set(STORAGE_KEYS.HISTORY, history);

        if (state.username) {
          const username = state.username;
          hasDailyReferral(username).then(isBonus => {
            saveScore(username, state.score, partialRecord.avgTime as any, {
              isBonus,
              correctAnswers: state.correct,
              questionCount: state.currentQuestionIndex + 1,
              streakAtPlay: state.streak || 0,
            });
          });
        }
      } catch (e) {
        console.error('[Game] Error saving partial progress:', e);
      }

      // Reset game state to intro so game can be restarted
      dispatch({ type: 'SET_GAME_STATE', payload: 'summary' });
    }

    // If null/undefined, go home. Else go to page.
    navigate(page ? `/${page}` : '/');
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
            bg-slate-50 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}
        `}
    >
      <TopBar
        onOpenPage={handleOpenPage}
        username={state.username || undefined}
        onTriggerLogin={(mode = 'signin') => {
          dispatch({ type: 'SET_REGISTER_MODE', payload: mode });
          dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
          navigate('/');
        }}
        onLogout={handleLogout}
      />

      {/* Announcement Modal */}
      <AnimatePresence>
        {pendingAnnouncement && (
          <AnnouncementModal announcement={pendingAnnouncement} onDismiss={dismissAnnouncement} />
        )}
      </AnimatePresence>

      {/* Achievement Modal */}
      <AnimatePresence>
        {newlyUnlockedBadge && (
          <Suspense fallback={null}>
            <AchievementModal achievement={newlyUnlockedBadge} onDismiss={dismissAchievement} />
          </Suspense>
        )}
      </AnimatePresence>

      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route
              path="/"
              element={
                state.username && !emailVerified ? (
                  <VerifyEmailScreen theme={theme as 'light' | 'dark'} />
                ) : (
                  <GameScreen
                    state={state}
                    dispatch={dispatch}
                    theme={theme as 'light' | 'dark'}
                    deviceMode={deviceMode}
                    t={t}
                    currentStreet={currentStreet}
                    handleSelectAnswer={handleSelectAnswer}
                    handleNext={handleNext}
                    processAnswer={processAnswer}
                    setupGame={setupGame}
                    handleRegister={handleRegister}
                    hasPlayedToday={hasPlayedToday}
                  />
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
                  onLogout={handleLogout}
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

            {/* Admin Route */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/fetch-streets" element={<StreetsFetcher />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>

      {/* Global Copyright Footer */}
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
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      </Suspense>
    </div>
  );
};

export default AppRoutes;
