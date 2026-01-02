import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import PropTypes from 'prop-types';

const QuizInterface = ({
    questionIndex,
    totalQuestions,
    score,
    options,
    onSelectOption,
    onNext,
    feedback, // 'idle', 'correct', 'wrong'
    correctName,
    hintStreets = [],
    onHintReveal,
}) => {
    const { theme, deviceMode } = useTheme();
    const [hintsRevealed, setHintsRevealed] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState(null);

    // Reset when question changes
    useEffect(() => {
        setHintsRevealed(0);
        setSelectedOptionId(null);
    }, [questionIndex]);

    const handleSelect = (option) => {
        if (feedback !== 'idle') return;
        setSelectedOptionId(option.id);
        onSelectOption(option);
    };

    const handleRevealHint = () => {
        if (hintsRevealed < 3 && hintsRevealed < hintStreets.length) {
            setHintsRevealed(prev => prev + 1);
            onHintReveal();
        }
    };

    const getPrefix = (name) => {
        if (!name) return '';
        const match = name.match(/^(Carrer|Avinguda|Plaça|Passeig|Passatge|Ronda|Via|Camí)(\s+d(e|els|es)?)?\s+/i);
        return match ? match[0].trim() : '';
    };

    const getBaseName = (name) => {
        const prefix = getPrefix(name);
        return prefix ? name.replace(prefix, '').trim() : name;
    };

    const canRevealHint = hintsRevealed < 3 && hintsRevealed < hintStreets.length;

    const prefix = getPrefix(correctName);
    const targetNameOnly = getBaseName(correctName);

    return (
        <div className="w-full h-full flex flex-col pointer-events-auto overflow-hidden">
            {/* Animated Container */}
            <motion.div
                key={questionIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex flex-col overflow-hidden"
            >

                {/* Content - Force Fit (No Scroll) */}
                <div className="flex-1 flex flex-col justify-evenly p-2 pt-4 w-full overflow-hidden relative z-10">
                    {/* Fixed Height for Options to prevent squash */}
                    <div className="flex-1 min-h-0 flex flex-col justify-center px-4 pb-2">
                        <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 sm:gap-3 w-full max-w-lg mx-auto h-full sm:h-auto">
                            {options.map((opt) => {
                                const isSelected = selectedOptionId === opt.id;
                                const isCorrect = opt.name === correctName;


                                let btnClass = '';
                                if (isSelected) {
                                    // Always show selected color (e.g. Blue/Neutral) regardless of correctness
                                    btnClass = theme === 'dark'
                                        ? 'bg-sky-600 text-white border-sky-500' // Dark mode selected
                                        : 'bg-sky-500 text-white border-sky-600'; // Light mode selected
                                } else {
                                    // Default Unselected
                                    btnClass = theme === 'dark'
                                        ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200';
                                }

                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSelect(opt)}
                                        disabled={feedback !== 'idle'}
                                        className={`w-full min-h-[2.75rem] sm:min-h-[3.5rem] flex-shrink-0 flex items-center justify-center sm:justify-start px-2 sm:px-4 rounded-xl text-center sm:text-left transition-all duration-200 relative overflow-hidden group border
                                        ${btnClass}
                                        ${isSelected && feedback === 'idle' ? 'ring-2 ring-sky-500' : ''}
                                    `}
                                    >
                                        <span className="relative z-10 text-xs sm:text-sm md:text-base font-medium leading-tight line-clamp-3 sm:line-clamp-2 w-full">{opt.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Hints Section */}
                <div className={`p-2 md:p-4 border-t ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
                    {feedback === 'idle' && hintStreets.length > 0 && (
                        <div className="flex flex-col gap-1.5 md:gap-3">
                            <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider">
                                <span>Hints</span>
                                {hintsRevealed < hintStreets.length && hintsRevealed < 3 && (
                                    <button
                                        onClick={handleRevealHint}
                                        className="text-sky-500 hover:text-sky-600 transition-colors text-[10px] md:text-xs"
                                    >
                                        Reveal Hint
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-1 md:gap-2">
                                {hintStreets.slice(0, hintsRevealed).map((street, i) => (
                                    <div key={street.id} className={`text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 rounded-lg border flex items-center gap-2 animate-fadeIn
                                            ${theme === 'dark'
                                            ? 'bg-slate-700 border-slate-600 text-slate-200'
                                            : 'bg-white border-slate-200 text-slate-600'}
                                        `}>
                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-sky-500"></div>
                                        <span>Near: {street.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Next Button (Only shows when done, replaces submit) */}
                {feedback !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 md:mt-4 flex justify-center pb-4 relative z-50"
                    >
                        <button
                            onClick={onNext}
                            className={`w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 text-sm md:text-base rounded-full font-semibold shadow-lg transition-all active:scale-95
                                    ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}
                                `}
                        >
                            {questionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'}
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

QuizInterface.propTypes = {
    questionIndex: PropTypes.number.isRequired,
    totalQuestions: PropTypes.number.isRequired,
    score: PropTypes.number.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired
        })
    ).isRequired,
    onSelectOption: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    feedback: PropTypes.oneOf(['idle', 'correct', 'wrong', 'transitioning']).isRequired,
    correctName: PropTypes.string.isRequired,
    hintStreets: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired
        })
    ),
    onHintReveal: PropTypes.func.isRequired
};

QuizInterface.defaultProps = {
    hintStreets: []
};

export default QuizInterface;
