import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useGameState } from '../features/game/hooks/useGameState';
import { useStreets } from '../features/game/hooks/useStreets';
import { useAchievements } from './useAchievements';
import { useAnnouncements } from './useAnnouncements';
import { useAuthRedirect } from './useAuthRedirect';
import { useConfirm } from './useConfirm';

export const useAppInitialization = () => {
  const { theme, t } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Street data hook
  const { validStreets, getHintStreets, isLoading: isLoadingStreets } = useStreets();

  // Confirmation Hook
  const { confirm, confirmConfig, handleClose: handleConfirmClose } = useConfirm();

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

  // Auth redirect handling (Google OAuth + district modal)
  const { showDistrictModal, isProcessingRedirect, handleDistrictComplete } = useAuthRedirect({
    username: state.username,
    handleRegister,
  });

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

  return {
    theme,
    t,
    location,
    navigate,
    isLoading: isLoadingStreets || isProcessingRedirect,
    confirm,
    confirmConfig,
    handleConfirmClose,
    state,
    dispatch,
    currentStreet,
    handlers: {
      setupGame,
      handleSelectAnswer,
      handleNext,
      handleRegister,
      processAnswer,
      handleLogout,
      handleDistrictComplete,
      dismissAnnouncement,
      dismissAchievement,
    },
    uiState: {
      showDistrictModal,
      pendingAnnouncement,
      newlyUnlockedBadge,
      emailVerified,
    },
  };
};
