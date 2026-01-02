import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import PropTypes from 'prop-types';

const SettingsScreen = ({ onClose, onLogout, autoAdvance, setAutoAdvance }) => {
  const { theme, toggleTheme, language, changeLanguage, languages, t, deviceMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    'Notification' in window && Notification.permission === 'granted'
  );

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

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      // eslint-disable-next-line no-alert
      alert('This browser does not support desktop notification');
      return;
    }

    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      // eslint-disable-next-line no-alert
      alert("Notifications enabled! You'll receive daily reminders.");
    } else {
      setNotificationsEnabled(false);
      // eslint-disable-next-line no-alert
      alert('Notifications denied. Please enable them in your browser settings.');
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
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">{t('theme')}</h3>
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                </div>
                <span className="font-medium">{t('darkMode')}</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-12 h-7 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${theme === 'dark' ? 'left-6' : 'left-1'}`}
                />
              </button>
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
          {['mobile', 'tablet'].includes(deviceMode) && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">
                Notifications
              </h3>
              <div
                className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}
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
                  <span className="font-medium">Daily Reminders</span>
                </div>
                <button
                  onClick={handleEnableNotifications}
                  className={`w-12 h-7 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${notificationsEnabled ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>
            </div>
          )}

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
};

export default SettingsScreen;
