import { AnimatePresence } from 'framer-motion';
import { Suspense, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import AchievementModal from '../../../components/AchievementModal';
import AnnouncementModal from '../../../components/AnnouncementModal';
import DistrictSelectionModal from '../../../components/DistrictSelectionModal';
import { GameProvider } from '../../../context/GameContext';
import { useAchievements } from '../../../hooks/useAchievements';
import { useAnnouncements } from '../../../hooks/useAnnouncements';
import { useAuthRedirect } from '../../../hooks/useAuthRedirect';
import { hasPlayedToday } from '../../../utils/game/dailyChallenge';
import useGameState from '../hooks/useGameState';
import useStreets from '../hooks/useStreets';
import GameScreen from './GameScreen';

export interface GamePageProps {
  username?: string;
}

function GamePageContent({ username }: GamePageProps) {
  const { validStreets, getHintStreets, isLoading: streetsLoading } = useStreets();
  const {
    state,
    dispatch,
    currentStreet,
    setupGame,
    processAnswer,
    handleSelectAnswer,
    handleNext,
    handleRegister,
  } = useGameState(validStreets, getHintStreets);
  const location = useLocation();

  // Handle register mode from navigation
  useEffect(() => {
    if (location.state?.mode === 'register' && state.gameState !== 'register') {
      dispatch({ type: 'SET_REGISTER_MODE', payload: 'signup' });
      dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
      // Clear the location state to prevent re-triggering after panel close
      window.history.replaceState({}, document.title);
    }
  }, [location.state, dispatch, state.gameState]);

  // Sync username if provided
  useEffect(() => {
    if (username && state.username !== username) {
      dispatch({ type: 'SET_USERNAME', payload: username });
    }
  }, [username, state.username, dispatch]);

  // Social / Notifications
  const announcements = useAnnouncements(state.username || '');
  const achievements = useAchievements(state.username || '', state.gameState, location.pathname);

  // District check — prompts logged-in users without a team to pick one
  const { showDistrictModal, handleDistrictComplete, handleDistrictDismiss } = useAuthRedirect({
    username: state.username,
    handleRegister,
  });

  // Check announcements on home screen
  useEffect(() => {
    if (state.username) {
      announcements.checkAnnouncements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.username]);

  const providerValue = useMemo(
    () => ({
      state,
      dispatch,
      currentStreet,
      handlers: {
        setupGame,
        processAnswer,
        handleSelectAnswer,
        handleNext,
        handleRegister,
        hasPlayedToday,
      },
    }),
    [
      state,
      dispatch,
      currentStreet,
      setupGame,
      processAnswer,
      handleSelectAnswer,
      handleNext,
      handleRegister,
    ]
  );

  if (streetsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <GameProvider value={providerValue}>
      <GameScreen />

      <AnimatePresence>
        {announcements.pendingAnnouncement && (
          <AnnouncementModal
            announcement={announcements.pendingAnnouncement}
            onDismiss={announcements.dismissAnnouncement}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {achievements.newlyUnlockedBadge && (
          <Suspense fallback={null}>
            <AchievementModal
              achievement={achievements.newlyUnlockedBadge}
              onDismiss={achievements.dismissAchievement}
            />
          </Suspense>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDistrictModal && (
          <Suspense fallback={null}>
            <DistrictSelectionModal
              username={state.username || ''}
              onComplete={handleDistrictComplete}
              onDismiss={handleDistrictDismiss}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </GameProvider>
  );
}

export default GamePageContent;
