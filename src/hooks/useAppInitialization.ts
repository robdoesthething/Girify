import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../features/auth/hooks/useAuth';
import useGameState from '../features/game/hooks/useGameState';
import useStreets from '../features/game/hooks/useStreets';
import { syncWithLocal } from '../utils/shop';
import { useAchievements } from './useAchievements';
import { useAnnouncements } from './useAnnouncements';
import { useConfirm } from './useConfirm';

export const useAppInitialization = () => {
  const { theme, t } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { validStreets, getHintStreets, isLoading: streetsLoading } = useStreets();
  const { confirm, confirmConfig, handleClose: handleConfirmClose } = useConfirm();

  // Game Logic - Must appear before useAuth if useAuth needs dispatch/state
  const gameStateResult = useGameState(validStreets, getHintStreets);
  const { state, dispatch, handleRegister } = gameStateResult;

  // Social / Notifications
  const announcements = useAnnouncements(state.username || '');
  const achievements = useAchievements(state.username || '', state.gameState, location.pathname);

  // Auth - depends on dispatch and currentGameState
  const {
    user,
    isLoading: authLoading,
    handleLogout: authLogout,
  } = useAuth(dispatch, state.gameState, announcements.checkAnnouncements);

  // UI State
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [, setInitError] = useState<string | null>(null);

  // Application Initialization
  useEffect(() => {
    const init = async () => {
      try {
        const { updated, errors } = await syncWithLocal();
        if (updated > 0) {
          console.warn(`[Init] Synced ${updated} shop items`);
        }
        if (errors > 0) {
          console.error(`[Init] Failed to sync ${errors} shop items`);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization failed:', error);
        setInitError('Failed to initialize resources');
        // notify('Failed to initialize application resources', 'error');
        // Keep mostly silent to not annoy user
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  // Sync auth user to game state
  useEffect(() => {
    if (user && !state.username) {
      if (user.displayName) {
        handleRegister(user.displayName);
      }
    }
  }, [user, state.username, handleRegister]);

  const handleDistrictComplete = async () => {
    setShowDistrictModal(false);
  };

  const handleLogout = () => {
    authLogout(navigate);
  };

  // Check announcements on home screen
  useEffect(() => {
    if (state.username && location.pathname === '/') {
      announcements.checkAnnouncements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.username, location.pathname]);

  const isLoading = authLoading || streetsLoading || !isInitialized;

  return {
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
    currentStreet: gameStateResult.currentStreet,
    handlers: {
      ...gameStateResult,
      handleDistrictComplete,
      dismissAnnouncement: announcements.dismissAnnouncement,
      dismissAchievement: achievements.dismissAchievement,
      handleLogout,
    },
    uiState: {
      pendingAnnouncement: announcements.pendingAnnouncement,
      newlyUnlockedBadge: achievements.newlyUnlockedBadge,
      showDistrictModal,
      emailVerified: user?.emailVerified ?? false,
    },
  };
};
