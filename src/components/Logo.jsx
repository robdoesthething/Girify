import React from 'react';
import { useTheme } from '../context/ThemeContext';
import logoImage from '../assets/girify-logo.png';

const Logo = ({ className }) => {
    const { theme } = useTheme();

    // Dark mode: apply CSS filter to adjust colors (Gir = grey, ify = white)
    // Using brightness, contrast, and hue-rotate to achieve the desired effect
    const darkModeFilter = 'brightness(1.2) contrast(0.9) saturate(0.3)';

    return (
        <img
            src={logoImage}
            alt="Girify"
            className={`${className || ''}`}
            style={theme === 'dark' ? { filter: darkModeFilter } : {}}
        />
    );
};

export default Logo;

