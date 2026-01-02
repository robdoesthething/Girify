import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import PropTypes from 'prop-types';

const Hints = ({ hintStreets, hintsRevealed, onReveal, feedback }) => {
  const { theme, t } = useTheme();

  const canReveal = hintsRevealed < 3 && hintsRevealed < hintStreets.length;

  if (feedback !== 'idle' && hintStreets.length === 0) return null;
  if (feedback === 'idle' && hintStreets.length === 0) return null;

  return (
    <div
      className={`p-2 md:p-4 border-t ${theme === 'dark' ? 'border-neutral-800 bg-neutral-900' : 'border-slate-100 bg-slate-50'}`}
    >
      <div className="flex flex-col gap-1.5 md:gap-3">
        <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider">
          <span>{t('hints')}</span>
          {canReveal && (
            <button
              onClick={onReveal}
              className="text-sky-500 hover:text-sky-600 transition-colors text-[10px] md:text-xs"
            >
              {t('revealHint')}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 md:gap-2">
          {hintStreets.slice(0, hintsRevealed).map(street => (
            <div
              key={street.id}
              className={`text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 rounded-lg border flex items-center gap-2 animate-fadeIn
                            ${
                              theme === 'dark'
                                ? 'bg-slate-700 border-slate-600 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-600'
                            }
                        `}
            >
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-sky-500"></div>
              <span>Near: {street.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Hints.propTypes = {
  hintStreets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  hintsRevealed: PropTypes.number.isRequired,
  onReveal: PropTypes.func.isRequired,
  feedback: PropTypes.oneOf(['idle', 'transitioning']).isRequired,
};

export default Hints;
