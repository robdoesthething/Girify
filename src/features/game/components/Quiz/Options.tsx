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
  disabled?: boolean;
}

const Options: React.FC<OptionsProps> = ({
  options,
  onSelect,
  selectedAnswer,
  feedback,
  disabled,
}) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col justify-center px-4 pb-4">
      <div className="grid grid-cols-2 sm:flex sm:flex-col gap-4 w-full max-w-lg mx-auto h-full sm:h-auto">
        {options.map(opt => {
          const isSelected = selectedAnswer && opt.id === selectedAnswer.id;
          const isSubmitted = feedback !== 'idle' && feedback !== 'selected';

          let btnClass = '';
          let accentClass = '';

          if (isSubmitted) {
            if (isSelected) {
              // User's answer - Navy blue with glow
              btnClass =
                'bg-gradient-to-br from-navy to-navy-dark text-white border-navy ring-4 ring-navy/30 shadow-lg transform scale-[0.98]';
              accentClass = 'bg-sky-400';
            } else {
              // Other options - muted
              btnClass =
                'bg-slate-100/50 dark:bg-slate-800/30 text-slate-400 border-slate-200 dark:border-slate-700/50';
              accentClass = 'bg-slate-300 dark:bg-slate-700';
            }
          } else if (isSelected) {
            // Selected but not submitted yet
            btnClass =
              'bg-gradient-to-br from-sky-500 to-sky-600 text-white border-sky-500 ring-4 ring-sky-500/30 shadow-lg shadow-sky-500/20 transform scale-[1.02]';
            accentClass = 'bg-sky-300';
          } else {
            // Default unselected - improved hover state
            btnClass =
              'bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700 text-slate-800 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md';
            accentClass = 'bg-transparent group-hover:bg-sky-400/50';
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
              className={`
                w-full min-h-[2.5rem] sm:min-h-[4rem] flex-shrink-0
                flex items-center justify-center sm:justify-start
                px-3 sm:px-5 rounded-2xl
                text-center sm:text-left
                transition-all duration-200
                relative overflow-hidden group
                focus:outline-none focus:ring-0
                ${btnClass}
              `}
              type="button"
            >
              {/* Left accent bar - more prominent */}
              <div
                className={`
                  absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl
                  transition-all duration-200
                  ${accentClass}
                `}
              />

              {/* Shine effect on hover for unselected */}
              {!isSelected && !isSubmitted && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" />
              )}

              {/* Text content with better typography */}
              <span className="relative z-10 text-sm sm:text-base font-semibold leading-tight line-clamp-3 sm:line-clamp-2 w-full font-inter pl-2 sm:pl-3">
                {opt.name}
              </span>

              {/* Checkmark for selected state */}
              {isSelected && isSubmitted && (
                <svg
                  className="absolute right-3 sm:right-4 w-5 h-5 sm:w-6 sm:h-6 text-white animate-scale-in"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Options;
