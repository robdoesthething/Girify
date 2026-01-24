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
        <label htmlFor={id} className="block text-xs uppercase font-bold opacity-50 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-3 py-2 rounded-xl border transition-all outline-none
          bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700
          focus:ring-2 focus:ring-sky-500
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
