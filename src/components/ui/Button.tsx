import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { themeClasses } from '../../utils/themeUtils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const { theme } = useTheme();

  // Size classes
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3.5 text-base rounded-xl',
  };

  // Variant classes
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 active:scale-95',
    secondary: themeClasses(
      theme,
      'bg-slate-700 hover:bg-slate-600 text-white',
      'bg-slate-200 hover:bg-slate-300 text-slate-900'
    ),
    outline: themeClasses(
      theme,
      'border-2 border-slate-600 hover:bg-slate-800 text-white',
      'border-2 border-slate-300 hover:bg-slate-100 text-slate-900'
    ),
    ghost: themeClasses(
      theme,
      'hover:bg-slate-800 text-slate-300',
      'hover:bg-slate-100 text-slate-600'
    ),
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-95',
  };

  // Disabled styles
  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

  // Loading spinner
  const spinner = (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-bold transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? disabledClasses : ''}
        ${className}
      `.trim()}
      disabled={isDisabled}
      {...props}
    >
      {loading ? spinner : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
};

export default Button;
