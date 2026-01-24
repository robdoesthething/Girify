export interface SettingsState {
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

export type SettingsAction =
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'SET_DEV_TAP_COUNT'; payload: number }
  | { type: 'RESET_DEV_TAP_COUNT' }
  | { type: 'SET_PROFILE_SETTINGS'; payload: SettingsState['profileSettings'] }
  | {
      type: 'UPDATE_NOTIFICATION_SETTINGS';
      payload: SettingsState['profileSettings']['notificationSettings'];
    };
