import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

import { createAuthHandlers } from '../hooks/useAuthHandlers';
import { useRegisterForm } from '../hooks/useRegisterForm';
import AuthFormFields from './AuthFormFields';
import GoogleAuthSection from './GoogleAuthSection';
import PendingGoogleUserView from './PendingGoogleUserView';

interface RegisterPanelProps {
  theme?: 'dark' | 'light';
  onRegister?: (handle: string) => void;
  initialMode?: 'signin' | 'signup';
}

const RegisterPanel: React.FC<RegisterPanelProps> = ({
  theme: themeProp,
  onRegister,
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
      />
    );
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-xl pointer-events-auto overflow-hidden overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-sm p-8 rounded-3xl shadow-2xl border my-auto ${themeClasses(theme, 'bg-slate-900/90 border-slate-700 text-white', 'bg-white/90 border-slate-200 text-slate-900')}`}
      >
        <h2 className="text-3xl font-black mb-2 tracking-tight text-center">
          {isSignUp ? 'Join Girify' : 'Welcome Back'}
        </h2>
        <p
          className={`text-xs text-center mb-6 uppercase tracking-wider font-bold ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
        >
          {isSignUp ? 'Create an account to track stats' : 'Sign in to continue'}
        </p>

        <GoogleAuthSection
          theme={theme as 'light' | 'dark'}
          loading={loading}
          onGoogleLogin={handleGoogleLogin}
        />

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-center">
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
          <button
            onClick={() => dispatch({ type: 'SET_MODE', payload: !isSignUp })}
            className={`text-xs font-semibold hover:underline ${themeClasses(theme, 'text-slate-400 hover:text-white', 'text-slate-500 hover:text-slate-900')}`}
            type="button"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPanel;
