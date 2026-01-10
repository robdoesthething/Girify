import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import PropTypes from 'prop-types';

const Banner = ({ currentQuestionIndex, totalQuestions }) => {
  const { theme, t } = useTheme();

  return (
    <div className="absolute top-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-[1000]">
      <div className="glass-panel rounded-xl flex flex-col overflow-hidden shadow-2xl ring-1 ring-white/20">
        <div className="flex items-center justify-between px-6 py-3 bg-[#000080]/80 backdrop-blur-md text-white">
          <span className="text-xs font-bold uppercase tracking-widest opacity-90">
            {t('whichStreet')}
          </span>
          <span className="text-xs font-mono font-bold opacity-80 bg-white/10 px-2 py-1 rounded">
            {currentQuestionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <div className={`w-full h-1 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div
            className="bg-sky-500 h-full transition-all duration-500 shadow-[0_0_10px_#0ea5e9]"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

Banner.propTypes = {
  currentQuestionIndex: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
};

export default Banner;
