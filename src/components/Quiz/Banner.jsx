import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, shadows } from '../../styles/tokens';

const Banner = ({ currentQuestionIndex, totalQuestions }) => {
    const { theme } = useTheme();

    return (
        <div className="absolute top-12 left-0 right-0 z-[1000] flex flex-col shadow-lg">
            <div className="bg-[#000080] text-white font-bold text-center py-3 px-3 uppercase tracking-wider text-xs sm:text-sm flex justify-between items-center">
                <span>Which street is highlighted?</span>
                <span className="opacity-80 font-mono">Question {currentQuestionIndex + 1} / {totalQuestions}</span>
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

export default Banner;
