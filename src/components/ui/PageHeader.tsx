import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, rightElement }) => {
  const navigate = useNavigate();
  const { t } = useTheme();

  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className="flex items-center justify-between mb-8 relative">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity z-10 font-inter"
        type="button"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('back')}
      </button>

      <h1 className="text-xl font-black tracking-tight absolute left-1/2 transform -translate-x-1/2 font-inter">
        {title}
      </h1>

      {rightElement || <div className="w-16" />}
    </div>
  );
};

export default PageHeader;
