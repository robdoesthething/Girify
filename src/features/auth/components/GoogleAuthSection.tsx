import React from 'react';
import { themeClasses } from '../../../utils/themeUtils';
import GoogleLoginButton from './GoogleLoginButton';

interface GoogleAuthSectionProps {
  theme: 'light' | 'dark';
  loading: boolean;
  onGoogleLogin: () => void;
  t: (key: string) => string;
}

const GoogleAuthSection: React.FC<GoogleAuthSectionProps> = ({
  theme,
  loading,
  onGoogleLogin,
  t,
}) => {
  return (
    <>
      <GoogleLoginButton
        onClick={onGoogleLogin}
        disabled={loading}
        label={t('continueWithGoogle')}
      />

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div
            className={`w-full border-t ${themeClasses(theme, 'border-slate-700', 'border-slate-200')}`}
          />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span
            className={`px-2 ${themeClasses(theme, 'bg-slate-900 text-slate-500', 'bg-white text-slate-400')}`}
          >
            {t('orWithEmail')}
          </span>
        </div>
      </div>
    </>
  );
};

export default GoogleAuthSection;
