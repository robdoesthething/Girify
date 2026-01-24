import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../../hooks/useToast';
import { SettingsAction } from '../../types/settings';
import { updateUserProfile } from '../../utils/social';
import { themeClasses } from '../../utils/themeUtils';

interface NotificationSettingsProps {
  settings: {
    dailyReminder: boolean;
    friendActivity: boolean;
    newsUpdates: boolean;
  };
  username?: string;
  dispatch: React.Dispatch<SettingsAction>;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  username,
  dispatch,
}) => {
  const { theme } = useTheme();
  const { toast, success: showSuccess, warning: showWarning, info: showInfo } = useToast();

  const { isSupported, isIOS, requestPermission } = useNotifications() as {
    isSupported: boolean;
    isIOS: boolean;
    requestPermission: () => Promise<boolean>;
  };

  const handleToggleDaily = async () => {
    const isEnabled = settings.dailyReminder ?? true;

    if (!isSupported) {
      showWarning('Notifications not supported on this device.');
      return;
    }

    if (!isEnabled) {
      // Trying to enable
      const granted = await requestPermission();
      if (!granted) {
        showWarning('Permission blocked. Please enable in browser settings.');
        return;
      } else {
        showSuccess('Notifications enabled!');
      }
    } else {
      showInfo('Notifications disabled.');
    }

    const newSettings = {
      ...settings,
      dailyReminder: !isEnabled,
    };

    dispatch({ type: 'UPDATE_NOTIFICATION_SETTINGS', payload: newSettings });

    if (username) {
      await updateUserProfile(username, { notificationSettings: newSettings });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 font-inter">
        Notifications
      </h3>

      {toast && (
        <div
          className={`mb-4 p-3 rounded-xl text-center font-bold text-sm font-inter ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : toast.type === 'warning'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
          }`}
        >
          {toast.text}
        </div>
      )}

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
          onClick={handleToggleDaily}
          className={`w-12 h-7 rounded-full transition-colors relative ${(settings.dailyReminder ?? true) ? 'bg-emerald-500' : 'bg-slate-300'}`}
          type="button"
          role="switch"
          aria-checked={settings.dailyReminder ?? true}
          aria-label="Daily Reminders"
        >
          <div
            className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${(settings.dailyReminder ?? true) ? 'left-6' : 'left-1'}`}
          />
        </button>
      </div>
      {isIOS && (
        <p className="text-xs text-rose-500 mt-2 font-inter">
          Daily reminders not reliable on iPhone PWA
        </p>
      )}
    </div>
  );
};

export default NotificationSettings;
