import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { themeClasses } from '../../utils/themeUtils';

export type HeadingVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type TextVariant = 'body' | 'small' | 'caption';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: HeadingVariant;
  align?: 'left' | 'center' | 'right';
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
  align?: 'left' | 'center' | 'right';
  muted?: boolean;
}

export const Heading: React.FC<HeadingProps> = ({
  variant = 'h2',
  align = 'left',
  className = '',
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const baseStyles = 'font-bold tracking-tight';

  const variantStyles: Record<HeadingVariant, string> = {
    h1: 'text-4xl md:text-5xl font-black mb-6',
    h2: 'text-3xl font-black mb-4',
    h3: 'text-2xl font-bold mb-3',
    h4: 'text-xl font-bold mb-2',
    h5: 'text-lg font-bold mb-2',
    h6: 'text-base font-bold mb-1 uppercase tracking-wider opacity-80',
  };

  const alignStyles: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const Component = variant;

  return (
    <Component
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${alignStyles[align]}
        ${themeClasses(theme, 'text-white', 'text-slate-900')}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  align = 'left',
  muted = false,
  className = '',
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const variantStyles: Record<TextVariant, string> = {
    body: 'text-base leading-relaxed mb-4',
    small: 'text-sm leading-relaxed mb-2',
    caption: 'text-xs font-medium uppercase tracking-wider opacity-60',
  };

  const alignStyles: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const colorStyle = muted
    ? themeClasses(theme, 'text-slate-400', 'text-slate-500')
    : themeClasses(theme, 'text-slate-200', 'text-slate-700');

  return (
    <p
      className={`
        ${variantStyles[variant]}
        ${alignStyles[align]}
        ${colorStyle}
        ${className}
      `}
      {...props}
    >
      {children}
    </p>
  );
};
