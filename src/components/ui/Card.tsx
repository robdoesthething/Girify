import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { themeClasses } from '../../utils/themeUtils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = false }) => {
  const { theme } = useTheme();

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border p-6
        ${themeClasses(
          theme,
          'bg-white border-slate-200 shadow-sm',
          'bg-slate-800 border-slate-700 shadow-lg'
        )}
        ${hover || onClick ? 'transition-transform cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
