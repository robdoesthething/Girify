import React from 'react';
import logoDark from '../assets/girify-logo-dark.png';
import logoImage from '../assets/girify-logo.png';
import { useTheme } from '../context/ThemeContext';
import { themeValue } from '../utils/themeUtils';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  const { theme } = useTheme();

  return (
    <img
      src={themeValue(theme, logoDark, logoImage)}
      alt="Girify"
      className={`${className || ''}`}
    />
  );
};

export default Logo;
