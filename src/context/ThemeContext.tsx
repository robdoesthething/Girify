import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UI } from '../config/constants';
import { getTranslation, LANGUAGES } from '../i18n/translations';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: string;
  changeTheme: (mode: 'light' | 'dark' | 'auto') => void;
  toggleTheme: () => void;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  language: string;
  changeLanguage: (lang: string) => void;
  languages: typeof LANGUAGES;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light',
      themeMode: 'auto',
      changeTheme: () => {},
      language: 'en',
      changeLanguage: () => {},
      toggleTheme: () => {},
      languages: LANGUAGES,
      t: key => key,
      deviceMode: 'desktop',
      zoom: 1,
      setZoom: () => {},
    };
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>(() => {
    return (localStorage.getItem('girify_theme_mode') as 'light' | 'dark' | 'auto') || 'auto';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const resolveTheme = (): 'light' | 'dark' => {
      if (themeMode === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return themeMode;
    };

    const newTheme = resolveTheme();
    if (newTheme !== theme) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => setTheme(newTheme));
    }
    document.documentElement.setAttribute('class', newTheme);
    localStorage.setItem('girify_theme_mode', themeMode);
  }, [themeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (themeMode !== 'auto') {
      return () => {};
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('class', newTheme);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('girify_language');
    if (saved) {
      return saved;
    }
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && ['es', 'ca'].includes(browserLang)) {
      return browserLang;
    }
    return 'en';
  });

  const [zoom, setZoom] = useState(1);

  const getInitialDeviceMode = (): 'mobile' | 'tablet' | 'desktop' => {
    const width = window.innerWidth;
    if (width < UI.BREAKPOINTS.MOBILE) {
      return 'mobile';
    }
    if (width < UI.BREAKPOINTS.TABLET) {
      return 'tablet';
    }
    return 'desktop';
  };

  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>(
    getInitialDeviceMode()
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < UI.BREAKPOINTS.MOBILE) {
        setDeviceMode('mobile');
      } else if (width < UI.BREAKPOINTS.TABLET) {
        setDeviceMode('tablet');
      } else {
        setDeviceMode('desktop');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const changeTheme = useCallback((mode: 'light' | 'dark' | 'auto') => {
    setThemeMode(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const changeLanguage = useCallback((lang: string) => {
    setLanguage(lang);
    localStorage.setItem('girify_language', lang);
  }, []);

  const t = useCallback((key: string) => getTranslation(language, key), [language]);

  useEffect(() => {
    document.documentElement.setAttribute('class', theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      changeTheme,
      toggleTheme,
      deviceMode,
      zoom,
      setZoom,
      language,
      changeLanguage,
      languages: LANGUAGES,
      t,
    }),
    [
      theme,
      themeMode,
      changeTheme,
      toggleTheme,
      deviceMode,
      zoom,
      setZoom,
      language,
      changeLanguage,
      t,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
