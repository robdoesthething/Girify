import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const AboutScreen = ({ onClose }) => {
    const { theme } = useTheme();

    return (
        <div className="absolute inset-0 z-[2005] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 overflow-hidden">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden
                    ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                `}
            >
                {/* Header */}
                <div className={`p-6 border-b shrink-0 flex justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h2 className="text-2xl font-black tracking-tight">About Girify</h2>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed opacity-90">
                    <p>
                        <strong>Girify</strong> is a fun, interactive way to learn the streets of Barcelona.
                        Whether you are a local trying to master your neighborhood or a visitor exploring the city,
                        our quiz helps you build a mental map of the city.
                    </p>

                    <h3 className="font-bold text-lg mt-4">How to Play</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>A street is highlighted in blue on the map.</li>
                        <li>You have 4 options to choose from.</li>
                        <li>The faster you answer, the more points you get!</li>
                        <li>Use hints if you get stuck (but try not to!).</li>
                        <li>Get a perfect score to unlock special city curiosities.</li>
                    </ul>

                    <h3 className="font-bold text-lg mt-4">Credits</h3>
                    <p>
                        Designed and built with ❤️ for Barcelona.
                        <br />
                        Map data provided by <strong>OpenStreetMap</strong> contributors.
                    </p>

                    <div className="pt-8 text-center opacity-50 text-xs">
                        &copy; 2025 Girify. All rights reserved.
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AboutScreen;
