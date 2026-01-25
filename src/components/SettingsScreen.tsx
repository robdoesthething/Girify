import { motion } from 'framer-motion';
import React, { useEffect, useReducer } from 'react';
import { TOAST_SHORT_MS } from '../config/appConstants';
import { useTheme } from '../context/ThemeContext';
import { useConfirm as useCommonConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { SettingsAction, SettingsState } from '../types/settings'; // Types extracted
import { getUserProfile } from '../utils/social';
import { themeClasses } from '../utils/themeUtils';
import { ConfirmDialog } from './ConfirmDialog';

// Import Sections
import AccountSettings from './settings/AccountSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import GameplaySettings from './settings/GameplaySettings';
import LanguageSettings from './settings/LanguageSettings';
import NotificationSettings from './settings/NotificationSettings';

interface SettingsScreenProps {
  onClose: () => void;
  onLogout: () => void;
  autoAdvance: boolean;
  setAutoAdvance: (val: boolean) => void;
  username?: string;
}

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_ADMIN':
      return { ...state, isAdmin: action.payload };
    case 'SET_DEV_TAP_COUNT':
      return { ...state, devTapCount: action.payload };
    case 'RESET_DEV_TAP_COUNT':
      return { ...state, devTapCount: 0 };
    case 'SET_PROFILE_SETTINGS':
      return { ...state, profileSettings: action.payload };
    case 'UPDATE_NOTIFICATION_SETTINGS':
      return {
        ...state,
        profileSettings: {
          ...state.profileSettings,
          notificationSettings: action.payload,
        },
      };
    default:
      return state;
  }
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onClose,
  onLogout,
  autoAdvance,
  setAutoAdvance,
  username,
}) => {
  const { theme, t } = useTheme();
  const { toast, success: showSuccess, error: showError } = useToast();
  // Renamed hook usage to avoid naming collision if any, or just use useConfirm but imported as useCommonConfirm to clarify
  // Actually checking original import: import { useConfirm } from '../hooks/useConfirm';
  // I'll stick to useConfirm.
  const { confirm, confirmConfig, handleClose } = useCommonConfirm();

  const [settingsState, dispatch] = useReducer(settingsReducer, {
    isAdmin: false,
    devTapCount: 0,
    profileSettings: {
      notificationSettings: {
        dailyReminder: true,
        friendActivity: true,
        newsUpdates: true,
      },
    },
  });

  const { isAdmin, devTapCount, profileSettings } = settingsState;

  useEffect(() => {
    const loadProfileSettings = async () => {
      if (username) {
        const profile = await getUserProfile(username);
        if (profile?.notificationSettings) {
          dispatch({
            type: 'SET_PROFILE_SETTINGS',
            payload: { notificationSettings: profile.notificationSettings },
          });
        }
        if (profile?.role === 'admin') {
          dispatch({ type: 'SET_ADMIN', payload: true });
        }
      }
    };
    loadProfileSettings();
  }, [username]);

  const handleAdminAccess = async () => {
    const input = (await confirm('Promote to admin? (Internal use only)'))
      ? // eslint-disable-next-line no-alert
        window.prompt('Enter admin key:')
      : null;

    if (!input) {
      return; // User cancelled
    }

    if (!username) {
      showError('Username not found. Please log in again.');
      return;
    }

    try {
      const { auth } = await import('../firebase');

      if (!auth.currentUser) {
        showError('Not authenticated. Please log in again.');
        return;
      }

      // Get Firebase ID token
      const idToken = await auth.currentUser.getIdToken();

      // Call API endpoint
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          adminKey: input,
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle specific error cases
        if (response.status === 429) {
          showError('Too many attempts. Please try again later.');
        } else if (response.status === 403) {
          showError('Access Denied.');
        } else if (response.status === 401) {
          showError('Authentication failed. Please log in again.');
        } else {
          showError(data.error || 'Failed to promote to admin.');
        }
        return;
      }

      // Success
      showSuccess('Success! You are now an Admin.');
      dispatch({ type: 'SET_ADMIN', payload: true });
      setTimeout(() => window.location.reload(), TOAST_SHORT_MS);
    } catch (e: unknown) {
      console.error('[Settings] Error promoting to admin:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      showError(`Error promoting: ${errorMessage}`);
    }
  };

  const handleVersionClick = () => {
    const newCount = devTapCount + 1;
    dispatch({ type: 'SET_DEV_TAP_COUNT', payload: newCount });
    if (newCount >= 7) {
      handleAdminAccess();
      dispatch({ type: 'RESET_DEV_TAP_COUNT' });
    }
  };

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-white text-slate-900')}`}
      >
        <div
          className={`p-6 border-b shrink-0 flex justify-between items-center ${themeClasses(theme, 'border-slate-800', 'border-slate-100')}`}
        >
          <h2 className="text-2xl font-black tracking-tight font-inter">{t('settings')}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${themeClasses(theme, 'hover:bg-slate-800', 'hover:bg-slate-100')}`}
            type="button"
            aria-label={t('close') || 'Close'}
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {/* Main Toast UI */}
          {toast && (
            <div
              className={`mb-4 p-3 rounded-xl text-center font-bold text-sm font-inter ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : toast.type === 'error'
                    ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                    : toast.type === 'warning'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
              }`}
            >
              {toast.text}
            </div>
          )}

          <LanguageSettings />

          <AppearanceSettings username={username} />

          <GameplaySettings autoAdvance={autoAdvance} setAutoAdvance={setAutoAdvance} />

          <NotificationSettings
            settings={profileSettings.notificationSettings}
            username={username}
            dispatch={dispatch}
          />

          <AccountSettings
            onLogout={onLogout}
            isAdmin={isAdmin}
            onAdminAccess={handleVersionClick}
          />
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={!!confirmConfig}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        isDangerous={confirmConfig?.isDangerous}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </div>
  );
};

export default SettingsScreen;
