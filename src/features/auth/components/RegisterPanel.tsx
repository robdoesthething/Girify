import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

import { createAuthHandlers } from '../hooks/useAuthHandlers';
import { useRegisterForm } from '../hooks/useRegisterForm';
import DistrictSelector from './DistrictSelector';
import GoogleLoginButton from './GoogleLoginButton';
import PendingGoogleUserView from './PendingGoogleUserView';
import SelectedDistrictPreview from './SelectedDistrictPreview';

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

  const inputClass = `w-full px-4 py-3 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-sky-500 transition-all ${themeClasses(theme, 'bg-slate-800 border-slate-700 text-white placeholder-slate-600', 'bg-white border-slate-200 text-slate-900 placeholder-slate-400')}`;

  return (
    <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 backdrop-blur-xl pointer-events-auto overflow-hidden overflow-y-auto">
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

        <GoogleLoginButton onClick={handleGoogleLogin} disabled={loading} />

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
              Or with email
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder={t('firstName') || 'First Name'}
                  value={firstName}
                  onChange={e =>
                    dispatch({ type: 'SET_FIELD', field: 'firstName', value: e.target.value })
                  }
                  className={`w-1/2 ${inputClass.replace('w-full', '')}`}
                />
                <input
                  type="text"
                  placeholder={t('lastName') || 'Last Name'}
                  value={lastName}
                  onChange={e =>
                    dispatch({ type: 'SET_FIELD', field: 'lastName', value: e.target.value })
                  }
                  className={`w-1/2 ${inputClass.replace('w-full', '')}`}
                />
              </div>
              <div className="space-y-4">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
                >
                  {t('chooseYourDistrict') || 'Choose Your Allegiance'}
                </label>
                <DistrictSelector
                  theme={theme as 'light' | 'dark'}
                  selectedDistrict={district}
                  onSelect={value => dispatch({ type: 'SET_FIELD', field: 'district', value })}
                  showTeamName
                />
              </div>
              {district && <SelectedDistrictPreview districtId={district} t={t} />}
            </>
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e =>
              dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })
            }
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-2 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 text-white
              ${loading ? 'bg-slate-400 cursor-wait' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'}
            `}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

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
