import React from 'react';

import PropTypes from 'prop-types';

const Options = ({ options, onSelect, selectedAnswer, feedback, autoAdvance }) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col justify-center px-4 pb-2">
      <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 sm:gap-3 w-full max-w-lg mx-auto h-full sm:h-auto">
        {options.map(opt => {
          const isSelected = selectedAnswer && opt.id === selectedAnswer.id;
          const isSubmitted = feedback !== 'idle';

          let btnClass = '';

          if (isSubmitted) {
            if (isSelected) {
              // User's answer
              if (autoAdvance) {
                // Auto-mode: Dark blue highlight
                btnClass = 'bg-[#000080] text-white border-[#000080] ring-2 ring-blue-400';
              } else {
                // Non-auto mode: Just show selected in dark blue (no correctness indication)
                btnClass = 'bg-[#000080] text-white border-[#000080] ring-2 ring-blue-400';
              }
            } else {
              // Other options - muted
              btnClass = 'bg-slate-100 text-slate-400 border-slate-200';
            }
          } else if (isSelected) {
            // Selected but not submitted yet (non-auto mode)
            btnClass = 'bg-sky-500 text-white border-sky-500 ring-2 ring-sky-400';
          } else {
            // Default unselected
            btnClass = 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200';
          }

          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              disabled={feedback === 'transitioning'}
              className={`w-full min-h-[2.75rem] sm:min-h-[3.5rem] flex-shrink-0 flex items-center justify-center sm:justify-start px-2 sm:px-4 rounded-xl text-center sm:text-left transition-all duration-200 relative overflow-hidden group border
                                ${btnClass}
                            `}
            >
              <span className="relative z-10 text-xs sm:text-sm md:text-base font-medium leading-tight line-clamp-3 sm:line-clamp-2 w-full">
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

Options.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedAnswer: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  feedback: PropTypes.oneOf(['idle', 'transitioning']).isRequired,
  correctName: PropTypes.string,
  autoAdvance: PropTypes.bool.isRequired,
};

export default Options;
