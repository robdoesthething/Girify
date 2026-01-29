import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  containerClassName?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  fullWidth = true,
  className = '',
  containerClassName = '',
  id,
  ...props
}) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold opacity-80 mb-2 ml-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-4 py-3 rounded-xl border transition-all outline-none font-medium
          bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700
          text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
          focus:ring-2 focus:ring-sky-500 focus:border-sky-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1 font-bold">{error}</p>}
    </div>
  );
};

export default FormInput;
