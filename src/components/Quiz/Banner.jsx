import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacers, shadows } from '../../styles/tokens';
import PropTypes from 'prop-types';

const Banner = ({ currentQuestionIndex, totalQuestions }) => {
  const { theme, t } = useTheme();

  return (
    <div className="absolute top-12 left-0 right-0 z-[1000] flex flex-col shadow-lg">
      <div className="bg-[#000080] text-white font-bold text-center py-3 px-3 uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2">
        <span className="text-[10px] opacity-80 font-medium transform-none normal-case">
          {t('whichStreet')}
        </span>
        <span className="opacity-50">|</span>
        <span>
          {t('question')} {currentQuestionIndex + 1} {t('of')} {totalQuestions}
        </span>
      </div>
      <div className={`w-full h-1.5 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div
          className="bg-sky-500 h-1.5 transition-all duration-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
          style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>
    </div>
  );
};

Banner.propTypes = {
  currentQuestionIndex: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
};

export default Banner;
