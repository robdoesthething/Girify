import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getToggleButtonClass } from '../../utils/buttonClasses';
import { updateUserProfile } from '../../utils/social';
import { themeClasses } from '../../utils/themeUtils';

interface AppearanceSettingsProps {
  username?: string;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ username }) => {
  const { theme, themeMode, changeTheme, t } = useTheme();

  const handleThemeChange = (modeId: 'light' | 'dark' | 'auto') => {
    changeTheme(modeId);
    if (username) {
      updateUserProfile(username, { theme: modeId });
    }
  };

  return (
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
            onClick={() => handleThemeChange(mode.id as 'light' | 'dark' | 'auto')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all font-inter ${getToggleButtonClass(
              theme,
              themeMode === mode.id,
              'bg-white dark:bg-slate-700 text-sky-500 shadow-sm'
            )}`}
            type="button"
          >
            <span className="text-lg">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AppearanceSettings;
