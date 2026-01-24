import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import { themeClasses } from '../../../../utils/themeUtils';

interface NextButtonProps {
  onNext: () => void;
  isLastQuestion: boolean;
  feedback: 'idle' | 'selected' | 'transitioning';
  isSubmit?: boolean;
  disabled?: boolean;
}

const NextButton: React.FC<NextButtonProps> = ({
  onNext,
  isLastQuestion,
  feedback,
  isSubmit,
  disabled,
}) => {
  const { theme, t } = useTheme();

  // Show button when answer is selected (manual mode) or during transition
  if (feedback !== 'selected' && feedback !== 'transitioning') {
    return null;
  }

  const label = isSubmit
    ? t('submit') || 'Submit'
    : isLastQuestion
      ? t('finishQuiz')
      : t('nextQuestion');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 md:mt-4 flex justify-center pb-4 relative z-50"
    >
      <button
        onClick={e => {
          e.stopPropagation();
          if (!disabled) {
            onNext();
          }
        }}
        disabled={disabled}
        className={`w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 text-sm md:text-base rounded-full font-black shadow-lg transition-all active:scale-95 border font-inter
                      ${themeClasses(theme, 'bg-neutral-200 hover:bg-white text-neutral-900 border-white', 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900')}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
        type="button"
      >
        {label}
      </button>
    </motion.div>
  );
};

export default NextButton;
