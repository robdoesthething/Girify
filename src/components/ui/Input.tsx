import React, { forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { themeClasses } from '../../utils/themeUtils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, fullWidth = true, leftIcon, rightIcon, className = '', disabled, ...props },
    ref
  ) => {
    const { theme } = useTheme();

    const baseInputRequest = `
      w-full px-4 py-3 rounded-xl border text-base transition-all duration-200 outline-none
      disabled:opacity-50 disabled:cursor-not-allowed
      ${leftIcon ? 'pl-11' : ''}
      ${rightIcon ? 'pr-11' : ''}
    `;

    const themeStyles = themeClasses(
      theme,
      // Light mode
      `bg-white border-slate-200 text-slate-900 placeholder:text-slate-400
       focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10`,
      // Dark mode
      `bg-slate-800 border-slate-700 text-white placeholder:text-slate-500
       focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10`
    );

    const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : '';

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && <label className="block text-sm font-bold mb-2 ml-1 opacity-80">{label}</label>}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={`${baseInputRequest} ${themeStyles} ${errorStyles}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 ml-1 text-xs font-bold text-red-500 animate-fadeIn">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
