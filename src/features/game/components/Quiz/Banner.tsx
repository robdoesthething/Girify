import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import { themeClasses } from '../../../../utils/themeUtils';

interface BannerProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  practiceMode?: boolean;
  onExit?: () => void;
}

const Banner: React.FC<BannerProps> = ({
  currentQuestionIndex,
  totalQuestions,
  practiceMode = false,
  onExit,
}) => {
  const { theme, t } = useTheme();

  return (
    <div className="w-full z-[800] pointer-events-none fixed top-12 left-0 right-0">
      <div className="mx-auto w-full max-w-xl px-4 pt-2">
        {/* Improved banner with rounded corners and better visual hierarchy */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 pointer-events-auto transform transition-all duration-300">
          {/* Header section with gradient background */}
          <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-navy to-navy-light backdrop-blur-md text-white">
            <span className="text-sm font-bold uppercase tracking-wider opacity-95 font-inter whitespace-nowrap">
              {practiceMode
                ? t('practiceMode') || 'Practice Mode'
                : t('dailyChallenge') || 'Daily Challenge'}
            </span>
            {practiceMode ? (
              <button
                type="button"
                onClick={onExit}
                className="text-xs font-bold font-mono bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-inner transition-colors flex-shrink-0 ml-2"
              >
                ✕ {t('exitPractice') || 'Exit'}
              </button>
            ) : (
              <span className="text-xs font-bold font-mono bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-inner flex-shrink-0 ml-2">
                {currentQuestionIndex + 1} / {totalQuestions}
              </span>
            )}
          </div>

          {/* Progress bar container with improved styling */}
          <div
            className={`relative w-full h-1.5 ${themeClasses(theme, 'bg-slate-800/50', 'bg-slate-200/50')}`}
          >
            {/* Animated progress bar with glow effect */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-500 shadow-glow"
              style={{
                width: practiceMode
                  ? '100%'
                  : `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
              }}
            >
              {/* Pulse animation at the end */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
