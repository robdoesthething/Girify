import { sendEmailVerification } from 'firebase/auth';
import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { auth } from '../../../firebase';
import { themeClasses } from '../../../utils/themeUtils';

interface VerifyEmailScreenProps {
  theme: 'light' | 'dark';
}

const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ theme }) => {
  const { t } = useTheme();
  const [sent, setSent] = React.useState(false);

  const handleResend = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${themeClasses(theme, 'bg-slate-950 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <div className="max-w-md w-full glass-panel p-8">
        <div className="text-6xl mb-6">📧</div>
        <h1 className="text-3xl font-black mb-4">{t('verifyEmail') || 'Verify Your Email'}</h1>
        <p className="text-lg opacity-80 mb-8">
          {t('verifyEmailMessage') ||
            "We've sent a verification link to your email address. Please click it to unlock the full game!"}
        </p>

        <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl mb-8 font-mono text-sm opacity-70">
          {auth.currentUser?.email}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg transition-all"
            type="button"
          >
            {t('iHaveVerified') || "I've Verified It!"}
          </button>

          <button
            onClick={handleResend}
            disabled={sent}
            className="w-full py-3 bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white rounded-xl font-bold transition-all"
            type="button"
          >
            {sent ? 'Sent!' : t('resendEmail') || 'Resend Email'}
          </button>

          <button
            onClick={() => auth.signOut()}
            className="text-sm opacity-50 hover:opacity-100 underline mt-4"
            type="button"
          >
            {t('logout') || 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailScreen;
