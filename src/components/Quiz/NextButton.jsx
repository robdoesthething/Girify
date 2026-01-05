import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

import { useTheme } from '../../context/ThemeContext';
import PropTypes from 'prop-types';

const NextButton = ({ onNext, isLastQuestion, feedback, isSubmit }) => {
  const { theme, t } = useTheme();

  // Show button when answer is selected (manual mode) or during transition
  if (feedback !== 'selected' && feedback !== 'transitioning') return null;

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
          onNext();
        }}
        className={`w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 text-sm md:text-base rounded-full font-black shadow-lg transition-all active:scale-95 border
                    ${
                      theme === 'dark'
                        ? 'bg-neutral-200 hover:bg-white text-neutral-900 border-white' // High contrast button for dark mode
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                    }
                `}
      >
        {label}
      </button>
    </motion.div>
  );
};

NextButton.propTypes = {
  onNext: PropTypes.func.isRequired,
  isLastQuestion: PropTypes.bool.isRequired,
  feedback: PropTypes.oneOf(['idle', 'selected', 'transitioning']).isRequired,
  isSubmit: PropTypes.bool,
};

export default NextButton;
