import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import TopBar from './components/TopBar';
import LeaderboardScreen from './components/LeaderboardScreen';
import SettingsScreen from './components/SettingsScreen';
import AboutScreen from './components/AboutScreen';
import ProfileScreen from './components/ProfileScreen';
import FriendsScreen from './components/FriendsScreen';
import PublicProfileScreen from './components/PublicProfileScreen';
import GameScreen from './components/GameScreen';
import ShopScreen from './components/ShopScreen';
import FeedbackScreen from './components/FeedbackScreen';
import AdminRoute from './components/AdminRoute';
import AdminPanel from './components/AdminPanel';
import StreetsFetcher from './components/StreetsFetcher';
import NewsScreen from './components/NewsScreen';
import AnnouncementModal from './components/AnnouncementModal';
import LandingPage from './components/LandingPage';

import { useTheme } from './context/ThemeContext';
import { useStreets } from './hooks/useStreets';
import { useAchievements } from './hooks/useAchievements';
import { useAnnouncements } from './hooks/useAnnouncements';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
import { hasPlayedToday, getTodaySeed } from './utils/dailyChallenge';
import { saveScore } from './utils/leaderboard';
import { hasDailyReferral } from './utils/social';
import { auth } from './firebase';
import { storage } from './utils/storage';
import { STORAGE_KEYS } from './config/constants';

import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import VerifyEmailScreen from './components/VerifyEmailScreen';
import AchievementModal from './components/AchievementModal';
import { useConfirm } from './hooks/useConfirm';
import { ConfirmDialog } from './components/ConfirmDialog';

const AppRoutes = () => {
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
    state.username
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

  const handleOpenPage = async page => {
    // Check if user is in the middle of a game
    if (state.gameState === 'playing' && state.currentQuestionIndex < state.quizStreets.length) {
      const confirmed = await confirm(
        t('exitGameWarning') ||
          'Exit game? Your current score will be saved. You can play again anytime!',
        'Exit Game',
        true
      );
      if (!confirmed) return; // Don't navigate if user cancels

      // User confirmed - save current progress before exiting
      try {
        const history = storage.get(STORAGE_KEYS.HISTORY, []);
        const avgTime = state.quizResults.length
          ? (
              state.quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0) /
              state.quizResults.length
            ).toFixed(1)
          : 0;

        const partialRecord = {
          date: getTodaySeed(),
          score: state.score,
          avgTime: avgTime,
          timestamp: Date.now(),
          username: state.username,
          incomplete: true, // Mark as incomplete
        };
        history.push(partialRecord);
        storage.set(STORAGE_KEYS.HISTORY, history);

        if (state.username) {
          hasDailyReferral(state.username).then(isBonus => {
            saveScore(state.username, state.score, partialRecord.avgTime, {
              isBonus,
              correctAnswers: state.correct,
              questionCount: state.questionIndex + 1,
              email: auth.currentUser?.email,
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
        username={state.username}
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
          <AchievementModal achievement={newlyUnlockedBadge} onDismiss={dismissAchievement} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route
            path="/"
            element={
              state.username && !emailVerified ? (
                <VerifyEmailScreen theme={theme} />
              ) : (
                <GameScreen
                  state={state}
                  dispatch={dispatch}
                  theme={theme}
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
            element={
              <LeaderboardScreen
                onClose={() => handleOpenPage(null)}
                currentUser={state.username}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsScreen
                onClose={() => handleOpenPage(null)}
                onLogout={handleLogout}
                autoAdvance={state.autoAdvance}
                setAutoAdvance={val => dispatch({ type: 'SET_AUTO_ADVANCE', payload: val })}
                username={state.username}
              />
            }
          />
          <Route path="/about" element={<AboutScreen onClose={() => handleOpenPage(null)} />} />
          <Route
            path="/profile"
            element={
              <ProfileScreen onClose={() => handleOpenPage(null)} username={state.username} />
            }
          />
          <Route
            path="/user/:username"
            element={<PublicProfileScreen currentUser={state.username} />}
          />
          <Route
            path="/friends"
            element={
              <FriendsScreen onClose={() => handleOpenPage(null)} username={state.username} />
            }
          />
          <Route path="/shop" element={<ShopScreen username={state.username} />} />
          <Route
            path="/news"
            element={<NewsScreen onClose={() => handleOpenPage(null)} username={state.username} />}
          />
          <Route
            path="/feedback"
            element={
              <FeedbackScreen
                username={state.username}
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

      {/* Global Copyright Footer */}
      <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none opacity-40 mix-blend-difference pb-4">
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
          © 2025 Girify. All rights reserved.
        </p>
      </div>

      <ConfirmDialog
        isOpen={!!confirmConfig}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        isDangerous={confirmConfig?.isDangerous}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </div>
  );
};

export default AppRoutes;
