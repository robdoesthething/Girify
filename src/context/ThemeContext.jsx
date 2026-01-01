import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Theme: 'light' | 'dark'
    const [theme, setTheme] = useState('light');

    // Zoom State
    const [zoom, setZoom] = useState(1);

    // Auto-detect device mode based on viewport width
    const getDeviceMode = () => {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    };

    const [deviceMode, setDeviceMode] = useState(getDeviceMode());

    // Listen for window resize to update device mode
    useEffect(() => {
        const handleResize = () => {
            setDeviceMode(getDeviceMode());
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        // Apply theme data-attribute to html or body for Tailwind dark mode if configured
        document.documentElement.setAttribute('class', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, deviceMode, zoom, setZoom }}>
            {children}
        </ThemeContext.Provider>
    );
};
