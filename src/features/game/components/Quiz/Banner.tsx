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
  const progress = practiceMode ? 100 : ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="w-full z-[800] pointer-events-none fixed top-12 left-0 right-0">
      <div className="mx-auto w-full max-w-xl px-4 pt-1.5">
        <div className="glass-panel rounded-full overflow-hidden shadow-lg ring-1 ring-white/10 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-navy to-navy-light backdrop-blur-md text-white">
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest opacity-60 shrink-0">
              {practiceMode ? t('practiceMode') || 'Practice' : t('dailyChallenge') || 'Daily'}
            </span>
            <div
              className={`flex-1 h-1 rounded-full overflow-hidden ${themeClasses(theme, 'bg-white/15', 'bg-white/25')}`}
            >
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {practiceMode ? (
              <button
                type="button"
                onClick={onExit}
                className="text-[10px] font-bold font-mono bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full transition-colors shrink-0"
              >
                ✕ {t('exitPractice') || 'Exit'}
              </button>
            ) : (
              <span className="text-[10px] font-bold font-mono bg-white/20 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {currentQuestionIndex + 1}/{totalQuestions}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
