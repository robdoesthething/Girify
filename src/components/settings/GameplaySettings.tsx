import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { themeClasses } from '../../utils/themeUtils';

interface GameplaySettingsProps {
  autoAdvance: boolean;
  setAutoAdvance: (val: boolean) => void;
}

const GameplaySettings: React.FC<GameplaySettingsProps> = ({ autoAdvance, setAutoAdvance }) => {
  const { theme, t } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 font-inter">Gameplay</h3>
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
          onClick={() => setAutoAdvance(!autoAdvance)}
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
  );
};

export default GameplaySettings;
