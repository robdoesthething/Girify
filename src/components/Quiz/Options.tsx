import React from 'react';

interface Option {
  id: string;
  name: string;
}

interface OptionsProps {
  options: Option[];
  onSelect: (option: Option) => void;
  selectedAnswer: Option | null;
  feedback: 'idle' | 'selected' | 'transitioning';
  autoAdvance: boolean;
  disabled?: boolean;
}

const Options: React.FC<OptionsProps> = ({
  options,
  onSelect,
  selectedAnswer,
  feedback,
  autoAdvance,
  disabled,
}) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col justify-center px-4 pb-2">
      <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 sm:gap-3 w-full max-w-lg mx-auto h-full sm:h-auto">
        {options.map(opt => {
          const isSelected = selectedAnswer && opt.id === selectedAnswer.id;
          const isSubmitted = feedback !== 'idle' && feedback !== 'selected';

          let btnClass = '';

          if (isSubmitted) {
            if (isSelected) {
              // User's answer
              if (autoAdvance) {
                // Auto-mode: Dark blue highlight
                btnClass =
                  'bg-[#000080] text-white border-[#000080] ring-2 ring-[#000080] ring-opacity-100 shadow-none';
              } else {
                // Non-auto mode: Just show selected in dark blue (no correctness indication)
                btnClass =
                  'bg-[#000080] text-white border-[#000080] ring-4 ring-[#000080] ring-opacity-100 shadow-none';
              }
            } else {
              // Other options - muted
              btnClass = 'bg-slate-100 text-slate-400 border-slate-200';
            }
          } else if (isSelected) {
            // Selected but not submitted yet (non-auto mode)
            btnClass =
              'bg-sky-500 text-white border-[#000080] ring-4 ring-[#000080] ring-opacity-100 shadow-none';
          } else {
            // Default unselected
            btnClass = 'bg-white active:bg-slate-50 text-slate-800 border-slate-200';
          }

          return (
            <button
              key={opt.id}
              onClick={e => {
                const target = e.currentTarget as HTMLButtonElement;
                target.blur();
                onSelect(opt);
              }}
              disabled={disabled || feedback === 'transitioning'}
              className={`w-full min-h-[2.25rem] sm:min-h-[3.5rem] flex-shrink-0 flex items-center justify-center sm:justify-start px-2 sm:px-4 rounded-xl text-center sm:text-left transition-all duration-200 relative overflow-hidden group border focus:outline-none focus:ring-0
                                ${btnClass}
                            `}
              type="button"
            >
              <span className="relative z-10 text-xs sm:text-sm md:text-base font-medium leading-tight line-clamp-3 sm:line-clamp-2 w-full font-inter">
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Options;
