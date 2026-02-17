import React, { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOAST_SHORT_MS } from '../config/appConstants';
import { useTheme } from '../context/ThemeContext';
import { useAdminPromotion } from '../hooks/useAdminPromotion';
import { useConfirm as useCommonConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { SettingsAction, SettingsState } from '../types/settings';
import { getUserProfile } from '../utils/social';
import { themeClasses } from '../utils/themeUtils';
import { ConfirmDialog } from './ConfirmDialog';
import TopBar from './TopBar';
import { PageHeader } from './ui';

// Import Sections
import AccountSettings from './settings/AccountSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import GameplaySettings from './settings/GameplaySettings';
import LanguageSettings from './settings/LanguageSettings';
import NotificationSettings from './settings/NotificationSettings';

interface SettingsScreenProps {
  onLogout: () => void;
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

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout, username }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();
  const { toast, success: showSuccess, error: showError } = useToast();
  const { confirm, confirmConfig, handleClose } = useCommonConfirm();
  const [autoAdvance, setAutoAdvance] = useState(false);

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

  const { promoteToAdmin } = useAdminPromotion({
    onSuccess: () => {
      showSuccess('Success! You are now an Admin.');
      dispatch({ type: 'SET_ADMIN', payload: true });
      setTimeout(() => window.location.reload(), TOAST_SHORT_MS);
    },
    onError: (msg: string) => showError(msg),
  });

  const handleAdminAccess = async () => {
    const input = (await confirm('Promote to admin? (Internal use only)'))
      ? // eslint-disable-next-line no-alert
        window.prompt('Enter admin key:')
      : null;

    if (!input) {
      return;
    }

    if (!username) {
      showError('Username not found. Please log in again.');
      return;
    }

    await promoteToAdmin(input, username);
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
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <TopBar
        onOpenPage={page => navigate(page ? `/${page}` : '/')}
        onTriggerLogin={mode => navigate(`/?auth=${mode}`)}
      />

      <div className="flex-1 w-full px-4 py-8 pt-20 overflow-x-hidden overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          <PageHeader title={t('settings')} />

          <div className="space-y-6">
            {toast && (
              <div
                className={`mb-4 p-3 rounded-xl text-center font-bold text-sm font-inter ${
                  toast.type === 'success'
                    ? `bg-emerald-500/20 ${themeClasses(theme, 'text-emerald-400', 'text-emerald-600')}`
                    : toast.type === 'error'
                      ? `bg-red-500/20 ${themeClasses(theme, 'text-red-400', 'text-red-600')}`
                      : toast.type === 'warning'
                        ? `bg-amber-500/20 ${themeClasses(theme, 'text-amber-400', 'text-amber-600')}`
                        : `bg-sky-500/20 ${themeClasses(theme, 'text-sky-400', 'text-sky-600')}`
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
        </div>
      </div>

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
