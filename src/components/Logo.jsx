import React from 'react';
import { useTheme } from '../context/ThemeContext';
import logoImage from '../assets/girify-logo.png';
import lizardIcon from '../assets/lizard_icon.png';

const Logo = ({ className }) => {
    const { theme } = useTheme();

    if (theme === 'light') {
        // Light mode: use the actual logo image
        return <img src={logoImage} alt="Girify" className={`${className || ''}`} />;
    }

    // Dark mode: render text with split colors
    return (
        <div className={`flex items-center gap-2 ${className || ''}`}>
            <img src={lizardIcon} alt="Girify Logo" className="h-8 md:h-10 w-auto object-contain" />
            <div className="font-brand font-black text-2xl md:text-3xl tracking-tight leading-none flex items-center">
                <span className="text-neutral-400">Gir</span>
                <span className="text-white">ify</span>
            </div>
        </div>
    );
};

export default Logo;
