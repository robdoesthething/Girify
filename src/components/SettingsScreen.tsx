import { motion } from 'framer-motion';
import React, { useEffect, useReducer } from 'react';
import { STORAGE_KEYS } from '../config/constants';
import { useTheme } from '../context/ThemeContext';
import { useConfirm } from '../hooks/useConfirm';
import { useNotification } from '../hooks/useNotification';
import { useNotifications } from '../hooks/useNotifications';
import { UserProfile } from '../types/user';
import { getUserProfile, updateUserProfile } from '../utils/social';
import { storage } from '../utils/storage';
import { themeClasses } from '../utils/themeUtils';
import { ConfirmDialog } from './ConfirmDialog';

interface SettingsScreenProps {
  onClose: () => void;
  onLogout: () => void;
  autoAdvance: boolean;
  setAutoAdvance: (val: boolean) => void;
  username?: string;
}

interface SettingsState {
  isAdmin: boolean;
  devTapCount: number;
  profileSettings: {
    notificationSettings: {
      dailyReminder: boolean;
      friendActivity: boolean;
      newsUpdates: boolean;
    };
  };
}

type SettingsAction =
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'SET_DEV_TAP_COUNT'; payload: number }
  | { type: 'RESET_DEV_TAP_COUNT' }
  | { type: 'SET_PROFILE_SETTINGS'; payload: SettingsState['profileSettings'] }
  | {
      type: 'UPDATE_NOTIFICATION_SETTINGS';
      payload: SettingsState['profileSettings']['notificationSettings'];
    };

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
  const { theme, themeMode, changeTheme, language, changeLanguage, languages, t } = useTheme();
  const { notify } = useNotification();
  const { confirm, confirmConfig, handleClose } = useConfirm();

  const { isSupported, isIOS, requestPermission } = useNotifications() as {
    isSupported: boolean;
    isIOS: boolean;
    requestPermission: () => Promise<boolean>;
  };

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
    if (username) {
      getUserProfile(username).then(data => {
        const profile = data as UserProfile;
        if (profile) {
          dispatch({
            type: 'SET_PROFILE_SETTINGS',
            payload: {
              notificationSettings: profile.notificationSettings || {
                dailyReminder: true,
                friendActivity: true,
                newsUpdates: true,
              },
            },
          });
        }
      });
    }
  }, [username]);

  const handleVersionClick = () => {
    if (isAdmin) {
      return;
    }
    const newCount = devTapCount + 1;
    dispatch({ type: 'SET_DEV_TAP_COUNT', payload: newCount });
    if (newCount >= 7) {
      handleAdminAccess();
      dispatch({ type: 'RESET_DEV_TAP_COUNT' });
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { auth, db } = await import('../firebase');
      const { doc, getDoc } = await import('firebase/firestore');

      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'admins', auth.currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            dispatch({ type: 'SET_ADMIN', payload: true });
          }
        } catch (e) {
          console.error('Admin check failed', e);
        }
      }
    };
    checkAdmin();
  }, []);

  const handleClearHistory = async () => {
    if (
      await confirm(
        t('clearHistoryConfirm') ||
          'Are you sure you want to clear your game history? This cannot be undone.',
        'Clear History',
        true
      )
    ) {
      storage.remove(STORAGE_KEYS.HISTORY);
      notify(t('historyCleared') || 'Game history cleared.', 'success');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleSignOut = async () => {
    if (await confirm('Are you sure you want to sign out?', 'Sign Out')) {
      onLogout();
    }
  };

  const toggleAutoAdvance = () => {
    setAutoAdvance(!autoAdvance);
  };

  const handleAdminAccess = async () => {
    const input = (await confirm('Promote to admin? (Internal use only)'))
      ? // eslint-disable-next-line no-alert
        window.prompt('Enter admin key:')
      : null;
    if (input === 'GIRIFY_ADMIN_ACCESS_2026_SECURE') {
      try {
        const { setDoc, doc, updateDoc } = await import('firebase/firestore');
        const { db, auth } = await import('../firebase');

        if (auth.currentUser) {
          await setDoc(doc(db, 'admins', auth.currentUser.uid), {
            email: auth.currentUser.email,
            promotedAt: new Date(),
          });

          if (username) {
            await updateDoc(doc(db, 'users', username), {
              role: 'admin',
            });
          }

          notify('Success! You are now an Admin.', 'success');
          dispatch({ type: 'SET_ADMIN', payload: true });
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (e: unknown) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        notify(`Error promoting: ${errorMessage}`, 'error');
      }
    } else {
      if (input) {
        notify('Access Denied.', 'error');
      }
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
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 font-inter">
              {t('language')}
            </h3>
            <div
              className={`p-4 rounded-xl border ${themeClasses(theme, 'border-slate-800 bg-slate-800/50', 'border-slate-100 bg-slate-50')}`}
            >
              <div className="flex gap-2">
                {languages.map(lang => {
                  const getButtonClass = () => {
                    if (language === lang.code) {
                      return 'bg-sky-500 text-white shadow-md';
                    }
                    return themeClasses(
                      theme,
                      'bg-slate-700 hover:bg-slate-600 text-slate-300',
                      'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    );
                  };

                  return (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all font-inter ${getButtonClass()}`}
                      type="button"
                    >
                      <span className="mr-1">{lang.flag}</span> {lang.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 font-inter">
              {t('appearance') || 'Appearance'}
            </h3>
            <div
              className={`p-1.5 rounded-xl border flex ${themeClasses(theme, 'border-slate-800 bg-slate-800/50', 'border-slate-100 bg-slate-50')}`}
            >
              {[
                { id: 'light', icon: '☀️', label: 'Light' },
                { id: 'dark', icon: '🌙', label: 'Dark' },
                { id: 'auto', icon: '⚙️', label: 'System' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => {
                    changeTheme(mode.id as 'light' | 'dark' | 'auto');
                    if (username) {
                      updateUserProfile(username, { theme: mode.id as 'light' | 'dark' | 'auto' });
                    }
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all font-inter ${themeMode === mode.id ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:hover:text-slate-300'}`}
                  type="button"
                >
                  <span className="text-lg">{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 font-inter">
              Gameplay
            </h3>
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${themeClasses(theme, 'border-slate-800 bg-slate-800/50', 'border-slate-100 bg-slate-50')}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-full ${themeClasses(theme, 'bg-emerald-500/20 text-emerald-400', 'bg-emerald-100 text-emerald-600')}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <span className="font-medium font-inter">{t('autoAdvance')}</span>
                  <p className="text-xs opacity-50 font-inter">{t('autoAdvanceDesc')}</p>
                </div>
              </div>
              <button
                onClick={toggleAutoAdvance}
                className={`w-12 h-7 rounded-full transition-colors relative ${autoAdvance ? 'bg-emerald-500' : 'bg-slate-300'}`}
                type="button"
                role="switch"
                aria-checked={autoAdvance}
                aria-label={t('autoAdvance') || 'Auto Advance'}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${autoAdvance ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 font-inter">
              Notifications
            </h3>
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${themeClasses(theme, 'border-slate-800 bg-slate-800/50', 'border-slate-100 bg-slate-50')}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-full ${themeClasses(theme, 'bg-amber-500/20 text-amber-400', 'bg-amber-100 text-amber-600')}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div>
                  <span className="font-medium font-inter">Daily Reminders</span>
                  <p className="text-xs opacity-50 font-inter">Get reminded to play each day</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const isEnabled = profileSettings.notificationSettings?.dailyReminder ?? true;
                  if (!isSupported) {
                    notify('Notifications not supported on this device.', 'warning');
                    return;
                  }
                  if (!isEnabled) {
                    const granted = await requestPermission();
                    if (!granted) {
                      notify('Permission blocked. Please enable in browser settings.', 'warning');
                      return;
                    } else {
                      notify('Notifications enabled!', 'success');
                    }
                  } else {
                    notify('Notifications disabled.', 'info');
                  }
                  const newSettings = {
                    ...profileSettings.notificationSettings,
                    dailyReminder: !isEnabled,
                  };
                  dispatch({ type: 'UPDATE_NOTIFICATION_SETTINGS', payload: newSettings });
                  if (username) {
                    await updateUserProfile(username, { notificationSettings: newSettings });
                  }
                }}
                className={`w-12 h-7 rounded-full transition-colors relative ${(profileSettings.notificationSettings?.dailyReminder ?? true) ? 'bg-emerald-500' : 'bg-slate-300'}`}
                type="button"
                role="switch"
                aria-checked={profileSettings.notificationSettings?.dailyReminder ?? true}
                aria-label="Daily Reminders"
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${(profileSettings.notificationSettings?.dailyReminder ?? true) ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
            {isIOS && (
              <p className="text-xs text-rose-500 mt-2 font-inter">
                Daily reminders not reliable on iPhone PWA
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 font-inter">
              Data & Account
            </h3>
            <button
              onClick={handleClearHistory}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors font-medium dark:bg-rose-900/20 dark:border-rose-900/50 dark:text-rose-400 font-inter"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear Game History
            </button>

            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors font-medium font-inter ${themeClasses(theme, 'border-slate-700 hover:bg-slate-800', 'border-slate-200 hover:bg-slate-50')}`}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {t('logout')}
            </button>
          </div>

          <div className="pt-2">
            {isAdmin ? (
              <a
                href="/admin"
                className="block w-full text-center p-3 rounded-xl bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 transition-colors font-inter"
              >
                Open Admin Panel
              </a>
            ) : (
              <div className="mt-8 text-center pb-4">
                <button
                  type="button"
                  onClick={handleVersionClick}
                  className="text-xs text-slate-300 dark:text-slate-700 select-none cursor-default font-mono hover:text-slate-500 dark:hover:text-slate-500 transition-colors bg-transparent border-0"
                  aria-label="Version Info"
                >
                  v0.1.0
                </button>
              </div>
            )}
          </div>
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
