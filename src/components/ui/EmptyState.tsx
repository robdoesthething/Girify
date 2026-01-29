import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { themeClasses } from '../../utils/themeUtils';
import Button from './Button';
import { Heading, Text } from './Typography';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const { theme } = useTheme();

  return (
    <div
      className={`
        flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed
        ${themeClasses(theme, 'border-slate-700 bg-slate-800/20', 'border-slate-200 bg-slate-50/50')}
        ${className}
      `}
    >
      {(icon || emoji) && <div className="mb-4 text-4xl opacity-80">{icon || emoji}</div>}

      <Heading variant="h4" align="center" className="mb-2">
        {title}
      </Heading>

      <Text align="center" muted className="max-w-md mx-auto mb-6">
        {description}
      </Text>

      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
