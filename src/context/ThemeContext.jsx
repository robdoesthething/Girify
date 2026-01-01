import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation, LANGUAGES } from '../i18n/translations';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Theme: 'light' | 'dark'
    const [theme, setTheme] = useState('light');

    // Language: 'en' | 'es' | 'ca'
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('girify_language');
        if (saved) return saved;
        // Auto-detect from browser
        const browserLang = navigator.language?.split('-')[0];
        if (['es', 'ca'].includes(browserLang)) return browserLang;
        return 'en';
    });

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

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('girify_language', lang);
    };

    // Translation helper
    const t = (key) => getTranslation(language, key);

    useEffect(() => {
        // Apply theme data-attribute to html or body for Tailwind dark mode if configured
        document.documentElement.setAttribute('class', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            deviceMode,
            zoom,
            setZoom,
            language,
            changeLanguage,
            languages: LANGUAGES,
            t
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
