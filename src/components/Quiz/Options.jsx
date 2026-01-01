import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Options = ({ options, onSelect, selectedAnswer, feedback, correctName }) => {
    const { theme } = useTheme();

    return (
        <div className="flex-1 min-h-0 flex flex-col justify-center px-4 pb-2">
            <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 sm:gap-3 w-full max-w-lg mx-auto h-full sm:h-auto">
                {options.map((opt) => {
                    // Check if this option is the one currently selected (manually)
                    const isSelected = selectedAnswer && opt.id === selectedAnswer.id;
                    // Check if this is the correct answer (for showing after submission)
                    const isCorrectOption = opt.name === correctName;
                    // Is the answer submitted (transitioning state)?
                    const isSubmitted = feedback === 'transitioning';

                    let btnClass = '';

                    if (isSubmitted) {
                        // After submission: 
                        // - Selected answer: show in blue with ring (user's choice)
                        // - Correct answer (if different): show green checkmark indication
                        // - Others: muted
                        if (isSelected) {
                            // This is the user's final answer - ALWAYS highlight in blue
                            if (isCorrectOption) {
                                // Correct! Blue with success ring
                                btnClass = theme === 'dark'
                                    ? 'bg-sky-600 text-white border-sky-500 ring-2 ring-emerald-400'
                                    : 'bg-sky-500 text-white border-sky-600 ring-2 ring-emerald-400';
                            } else {
                                // Wrong - Blue with red ring
                                btnClass = theme === 'dark'
                                    ? 'bg-sky-600 text-white border-sky-500 ring-2 ring-red-400'
                                    : 'bg-sky-500 text-white border-sky-600 ring-2 ring-red-400';
                            }
                        } else if (isCorrectOption && !isSelected) {
                            // Show the correct answer with green styling (if user got it wrong)
                            btnClass = theme === 'dark'
                                ? 'bg-emerald-600/30 text-emerald-400 border-emerald-500'
                                : 'bg-emerald-500/20 text-emerald-700 border-emerald-500';
                        } else {
                            // Other options - muted
                            btnClass = theme === 'dark'
                                ? 'bg-slate-700/50 text-slate-500 border-slate-600'
                                : 'bg-slate-100 text-slate-400 border-slate-200';
                        }
                    } else if (isSelected) {
                        // Selected but not submitted yet (non-auto mode)
                        btnClass = theme === 'dark'
                            ? 'bg-sky-600 text-white border-sky-500 ring-2 ring-sky-400'
                            : 'bg-sky-500 text-white border-sky-600 ring-2 ring-sky-400';
                    } else {
                        // Default unselected - LIGHTER colors for dark mode
                        btnClass = theme === 'dark'
                            ? 'bg-slate-600 hover:bg-slate-500 text-white border-slate-500'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200';
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
                            <span className="relative z-10 text-xs sm:text-sm md:text-base font-medium leading-tight line-clamp-3 sm:line-clamp-2 w-full">{opt.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Options;
