import React from 'react';
import { useTheme } from '../context/ThemeContext';
import logoImage from '../assets/girify-logo.png';
import logoDark from '../assets/girify-logo-dark.png';

const Logo = ({ className }) => {
    const { theme } = useTheme();

    return (
        <img
            src={theme === 'dark' ? logoDark : logoImage}
            alt="Girify"
            className={`${className || ''}`}
        />
    );
};

export default Logo;
