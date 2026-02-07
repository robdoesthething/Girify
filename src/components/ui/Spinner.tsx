import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div role="status" aria-label="Loading">
      <div
        className={`
          animate-spin rounded-full
          border-current border-t-transparent
          text-sky-500
          ${sizeClasses[size]}
          ${className}
        `}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
