import { motion } from 'framer-motion';
import React from 'react'; // React import needed for FC
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

import { Button, Card, Heading, Text } from '../../../components/ui';
import { createAuthHandlers } from '../hooks/useAuthHandlers';
import { useRegisterForm } from '../hooks/useRegisterForm';
import AuthFormFields from './AuthFormFields';
import GoogleAuthSection from './GoogleAuthSection';
import PendingGoogleUserView from './PendingGoogleUserView';

interface RegisterPanelProps {
  theme?: 'dark' | 'light';
  onRegister?: (handle: string) => void;
  onClose?: () => void;
  initialMode?: 'signin' | 'signup';
}

const RegisterPanel: React.FC<RegisterPanelProps> = ({
  theme: themeProp,
  onRegister,
  onClose,
  initialMode = 'signin',
}) => {
  const { theme: contextTheme, t } = useTheme();
  const theme = themeProp || contextTheme;

  const { state: formState, dispatch } = useRegisterForm({ initialMode });
  const {
    isSignUp,
    firstName,
    lastName,
    email,
    password,
    district,
    error,
    loading,
    pendingGoogleUser,
  } = formState;

  const { handleGoogleLogin, handleEmailAuth, completeGoogleSignup } = createAuthHandlers(
    { dispatch, onRegister, t },
    { isSignUp, firstName, lastName, email, password, district, pendingGoogleUser }
  );

  // District selection step for Google signup
  if (pendingGoogleUser) {
    return (
      <PendingGoogleUserView
        theme={theme as 'light' | 'dark'}
        pendingGoogleUser={pendingGoogleUser}
        district={district}
        loading={loading}
        dispatch={dispatch}
        onComplete={completeGoogleSignup}
        onCancel={() => dispatch({ type: 'SET_PENDING_GOOGLE_USER', payload: null })}
        t={t}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl pointer-events-auto overflow-hidden overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm my-auto relative"
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className={`absolute -top-2 -right-2 z-10 p-2 rounded-full transition-colors ${themeClasses(theme, 'bg-slate-700 hover:bg-slate-600 text-white', 'bg-slate-200 hover:bg-slate-300 text-slate-700')}`}
            aria-label={t('close') || 'Close'}
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <Card
          className={`p-8 shadow-2xl border ${themeClasses(theme, '!bg-slate-900/90 !border-slate-700', '!bg-white/90 !border-slate-200')}`}
        >
          <Heading variant="h2" align="center" className="mb-2 tracking-tight">
            {isSignUp ? t('joinGirify') : t('welcomeBack')}
          </Heading>

          <Text variant="caption" align="center" className="mb-6 font-bold" muted>
            {isSignUp ? t('createAccountToTrack') : t('signInToContinue')}
          </Text>

          <GoogleAuthSection
            theme={theme as 'light' | 'dark'}
            loading={loading}
            onGoogleLogin={handleGoogleLogin}
            t={t}
          />

          {error && (
            <div
              className={`p-3 mb-4 text-xs text-rose-500 rounded-lg text-center font-medium ${themeClasses(theme, 'bg-rose-900/20', 'bg-rose-50')}`}
            >
              {error}
            </div>
          )}

          <AuthFormFields
            isSignUp={isSignUp}
            loading={loading}
            theme={theme as 'light' | 'dark'}
            t={t}
            formState={formState}
            dispatch={dispatch}
            onSubmit={handleEmailAuth}
          />

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: 'SET_MODE', payload: !isSignUp })}
              className={`text-xs hover:underline ${themeClasses(theme, 'text-slate-400 hover:text-white', 'text-slate-500 hover:text-slate-900')}`}
            >
              {isSignUp ? t('alreadyHaveAccount') : t('noAccount')}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPanel;
