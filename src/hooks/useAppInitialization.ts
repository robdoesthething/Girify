import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useConfirm } from './useConfirm';

export const useAppInitialization = () => {
  const { theme, t } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { confirm, confirmConfig, handleClose: handleConfirmClose } = useConfirm();

  // Auth - now decoupled from game state
  const { user, profile, isLoading: authLoading, handleLogout: authLogout } = useAuth(); // No args needed

  // UI State
  const [isInitialized, setIsInitialized] = useState(false);
  const [, setInitError] = useState<string | null>(null);

  // Application Initialization (Global only)
  // Game-specific init (streets, etc) moved to GamePage
  useEffect(() => {
    // We can keep shop sync here if we want it global, or move to Shop page / Game page.
    // For now, let's keep it simple and assume it's light enough or dynamic import it.
    // Actually, syncWithLocal imports 'shop' which might pull in other stuff.
    // Let's dynamic import it.

    const init = async () => {
      try {
        const { syncWithLocal } = await import('../utils/shop');
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
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  const handleLogout = () => {
    authLogout(navigate);
  };

  const isLoading = authLoading || !isInitialized;

  return {
    theme,
    t,
    location,
    navigate,
    isLoading,
    confirm,
    confirmConfig,
    handleConfirmClose,
    user,
    profile,
    handleLogout,
    // No game state returned
  };
};
