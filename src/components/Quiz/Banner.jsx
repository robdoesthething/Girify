import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import PropTypes from 'prop-types';

const Banner = ({ currentQuestionIndex, totalQuestions }) => {
  const { theme, t } = useTheme();

  return (
    <div className="w-full z-[800] pointer-events-none fixed top-12 left-0 right-0">
      <div className="mx-auto w-full max-w-xl px-4 pt-2">
        <div className="glass-panel rounded-b-xl rounded-t-none border-t-0 flex flex-col overflow-hidden shadow-xl ring-1 ring-white/10 pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-2 bg-[#000080]/90 backdrop-blur-md text-white">
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
    </div>
  );
};

Banner.propTypes = {
  currentQuestionIndex: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
};

export default Banner;
