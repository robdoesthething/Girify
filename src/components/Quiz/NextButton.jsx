import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const NextButton = ({ onNext, isLastQuestion, feedback }) => {
    const { theme, t } = useTheme();

    if (feedback !== 'transitioning') return null;

    const label = isLastQuestion ? t('finishQuiz') : t('nextQuestion');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 md:mt-4 flex justify-center pb-4 relative z-50"
        >
            <button
                onClick={onNext}
                className={`w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 text-sm md:text-base rounded-full font-semibold shadow-lg transition-all active:scale-95
                    ${theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }
                `}
            >
                {label}
            </button>
        </motion.div>
    );
};

export default NextButton;
