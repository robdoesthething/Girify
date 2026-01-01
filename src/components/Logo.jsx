import React from 'react';
import { useTheme } from '../context/ThemeContext';
import lizardIcon from '../assets/lizard_icon.png';

const Logo = ({ className }) => {
    const { theme } = useTheme();

    return (
        <div className={`flex items-center gap-2 ${className || ''}`}>
            <img src={lizardIcon} alt="Girify Logo" className="h-8 md:h-10 w-auto object-contain" />
            <div className="font-brand font-black text-2xl md:text-3xl tracking-tight leading-none flex items-center">
                <span className={theme === 'dark' ? 'text-neutral-200' : 'text-[#000080]'}>Gir</span>
                <span className={theme === 'dark' ? 'text-white' : 'text-sky-500'}>ify</span>
            </div>
        </div>
    );
};

export default Logo;
