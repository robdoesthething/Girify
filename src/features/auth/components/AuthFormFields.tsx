import React from 'react';
import { themeClasses } from '../../../utils/themeUtils';
import {
  FormAction as RegisterAction,
  FormState as RegisterFormState,
} from '../hooks/useRegisterForm';
import DistrictSelector from './DistrictSelector';
import SelectedDistrictPreview from './SelectedDistrictPreview';

interface AuthFormFieldsProps {
  isSignUp: boolean;
  loading: boolean;
  theme: 'light' | 'dark';

  t: (key: string) => string;
  formState: RegisterFormState;
  dispatch: React.Dispatch<RegisterAction>;
  onSubmit: (e: React.FormEvent) => void;
}

const AuthFormFields: React.FC<AuthFormFieldsProps> = ({
  isSignUp,
  loading,
  theme,
  t,
  formState,
  dispatch,
  onSubmit,
}) => {
  const { firstName, lastName, email, password, district } = formState;

  const inputClass = `w-full px-4 py-3 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-sky-500 transition-all ${themeClasses(theme, 'bg-slate-800 border-slate-700 text-white placeholder-slate-600', 'bg-white border-slate-200 text-slate-900 placeholder-slate-400')}`;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
              theme={theme}
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
        onChange={e => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
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
  );
};

export default AuthFormFields;
