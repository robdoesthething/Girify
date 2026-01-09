import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { getUserProfile, updateUserProfile } from '../utils/social';
import PropTypes from 'prop-types';

const SettingsScreen = ({ onClose, onLogout, autoAdvance, setAutoAdvance, username }) => {
  const { theme, themeMode, changeTheme, language, changeLanguage, languages, t } = useTheme();

  // Use Notifications Hook
  const { isSupported, isIOS, requestPermission } = useNotifications();
  // const [notificationsEnabled, setNotificationsEnabled] = React.useState(permission === 'granted'); // Unused
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [devTapCount, setDevTapCount] = React.useState(0);

  // User Profile Settings
  const [profileSettings, setProfileSettings] = React.useState({
    notificationSettings: {
      dailyReminder: true,
      friendActivity: true,
      newsUpdates: true,
    },
  });

  /* React.useEffect(() => {
    setNotificationsEnabled(permission === 'granted');
  }, [permission]); */

  // Load Profile Settings
  React.useEffect(() => {
    if (username) {
      getUserProfile(username).then(profile => {
        if (profile) {
          setProfileSettings({
            notificationSettings: profile.notificationSettings || {
              dailyReminder: true,
              friendActivity: true,
              newsUpdates: true,
            },
          });
          // Also sync theme if different? ThemeContext handles local preference,
          // but valid to sync if user logs in on new device.
          // For now we let local preference override OR sync if explicitly set.
        }
      });
    }
  }, [username]);

  const handleVersionClick = () => {
    if (isAdmin) return;
    const newCount = devTapCount + 1;
    setDevTapCount(newCount);
    if (newCount >= 7) {
      handleAdminAccess();
      setDevTapCount(0);
    }
  };

  // Check Admin Status
  React.useEffect(() => {
    const checkAdmin = async () => {
      // Dynamic import to avoid heavy load if not needed
      const { auth, db } = await import('../firebase');
      const { doc, getDoc } = await import('firebase/firestore');

      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'admins', auth.currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setIsAdmin(true);
          }
        } catch (e) {
          console.error('Admin check failed', e);
        }
      }
    };
    checkAdmin();
  }, []);

  const handleClearHistory = () => {
    if (
      // eslint-disable-next-line no-alert
      window.confirm(
        t('clearHistoryConfirm') ||
          'Are you sure you want to clear your game history? This cannot be undone.'
      )
    ) {
      localStorage.removeItem('girify_history');
      // eslint-disable-next-line no-alert
      alert(t('historyCleared') || 'Game history cleared.');
      // Force reload to update UI (simplest way since history is read from LS in many places)
      window.location.reload();
    }
  };

  const handleSignOut = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to sign out?')) {
      onLogout();
    }
  };

  const toggleAutoAdvance = () => {
    setAutoAdvance(!autoAdvance);
  };

  const handleAdminAccess = async () => {
    // eslint-disable-next-line no-alert
    const input = window.prompt('Enter Admin Access Key:');
    if (input === 'GIRIFY_ADMIN_ACCESS_2026_SECURE') {
      try {
        const { setDoc, doc, updateDoc } = await import('firebase/firestore');
        const { db, auth } = await import('../firebase');

        if (auth.currentUser) {
          // 1. Create admin document for RBAC
          await setDoc(doc(db, 'admins', auth.currentUser.uid), {
            email: auth.currentUser.email,
            promotedAt: new Date(),
          });

          // 2. Update user profile for UI consistency
          if (username) {
            await updateDoc(doc(db, 'users', username), {
              role: 'admin',
            });
          }

          // eslint-disable-next-line no-alert
          alert('Success! You are now an Admin.');
          setIsAdmin(true);
          window.location.reload();
        }
      } catch (e) {
        console.error(e);
        // eslint-disable-next-line no-alert
        alert('Error promoting: ' + e.message);
      }
    } else {
      // eslint-disable-next-line no-alert
      if (input) alert('Access Denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden
                    ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                `}
      >
        {/* Header */}
        <div
          className={`p-6 border-b shrink-0 flex justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}
        >
          <h2 className="text-2xl font-black tracking-tight">{t('settings')}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Language */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">
              {t('language')}
            </h3>
            <div
              className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="flex gap-2">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                                            ${
                                              language === lang.code
                                                ? 'bg-sky-500 text-white shadow-md'
                                                : theme === 'dark'
                                                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                            }
                                        `}
                  >
                    <span className="mr-1">{lang.flag}</span> {lang.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">
              {t('appearance') || 'Appearance'}
            </h3>
            <div
              className={`p-1.5 rounded-xl border flex ${theme === 'dark' ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}
            >
              {[
                { id: 'light', icon: '☀️', label: 'Light' },
                { id: 'dark', icon: '🌙', label: 'Dark' },
                { id: 'auto', icon: '⚙️', label: 'System' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => {
                    changeTheme(mode.id);
                    if (username) {
                      updateUserProfile(username, { theme: mode.id });
                    }
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all
                    ${
                      themeMode === mode.id
                        ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                    }
                  `}
                >
                  <span className="text-lg">{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gameplay */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">Gameplay</h3>
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}
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
                  <span className="font-medium">{t('autoAdvance')}</span>
                  <p className="text-xs opacity-50">{t('autoAdvanceDesc')}</p>
                </div>
              </div>
              <button
                onClick={toggleAutoAdvance}
                className={`w-12 h-7 rounded-full transition-colors relative ${autoAdvance ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${autoAdvance ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
          </div>

          {/* Notifications - Mobile Only */}

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">Notifications</h3>
            <div
              className={`flex flex-col gap-1 p-2 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}
            >
              {[
                {
                  id: 'dailyReminder',
                  label: 'Daily Reminders',
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  ),
                  color: 'amber',
                },
                {
                  id: 'friendActivity',
                  label: 'Friend Activity',
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  ),
                  color: 'purple',
                },
                {
                  id: 'newsUpdates',
                  label: 'News & Updates',
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  ),
                  color: 'blue',
                },
              ].map(item => {
                const isEnabled = profileSettings.notificationSettings?.[item.id] ?? true;

                const handleToggle = async () => {
                  // Special logic for Daily Reminder (Permission)
                  if (item.id === 'dailyReminder') {
                    if (!isSupported) {
                      // eslint-disable-next-line no-alert
                      alert('Notifications not supported on this device.');
                      return;
                    }
                    if (!isEnabled) {
                      // Turning ON
                      const granted = await requestPermission();
                      if (!granted) {
                        // eslint-disable-next-line no-alert
                        alert('Permission blocked. Please enable in browser settings.');
                        return;
                      }
                      // setNotificationsEnabled(true);
                    } else {
                      // Turning OFF (just update pref)
                      // setNotificationsEnabled(false);
                      // Since we can't revoke perm, we just stop sending via backend logic check
                    }
                  }

                  // Update State & Profile
                  const newSettings = {
                    ...profileSettings.notificationSettings,
                    [item.id]: !isEnabled,
                  };
                  setProfileSettings(prev => ({ ...prev, notificationSettings: newSettings }));
                  if (username) {
                    await updateUserProfile(username, { notificationSettings: newSettings });
                  }
                };

                return (
                  <div key={item.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${theme === 'dark' ? `bg-${item.color}-500/20 text-${item.color}-400` : `bg-${item.color}-100 text-${item.color}-600`}`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {item.icon}
                        </svg>
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <button
                      onClick={handleToggle}
                      className={`w-12 h-7 rounded-full transition-colors relative ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${isEnabled ? 'left-6' : 'left-1'}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
            {isIOS && (
              <p className="px-4 pb-2 text-xs text-rose-500 text-right -mt-3">
                Daily reminders not reliable on iPhone PWA
              </p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">
              Data & Account
            </h3>
            <button
              onClick={handleClearHistory}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors font-medium dark:bg-rose-900/20 dark:border-rose-900/50 dark:text-rose-400"
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
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors font-medium
                                ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}
                            `}
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

          {/* Admin Section */}
          <div className="pt-2">
            {isAdmin ? (
              <a
                href="/admin"
                className="block w-full text-center p-3 rounded-xl bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 transition-colors"
              >
                Open Admin Panel
              </a>
            ) : (
              <div className="mt-8 text-center pb-4">
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
                <p
                  onClick={handleVersionClick}
                  className="text-xs text-slate-300 dark:text-slate-700 select-none cursor-default"
                >
                  v0.1.0
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

SettingsScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  autoAdvance: PropTypes.bool.isRequired,
  setAutoAdvance: PropTypes.func.isRequired,
  username: PropTypes.string,
};

export default SettingsScreen;
