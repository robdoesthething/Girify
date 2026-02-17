import React from 'react';
import { Button, Input, Text } from '../../../components/ui';
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isSignUp && (
        <>
          <div className="flex gap-4">
            <div className="w-1/2">
              <Input
                type="text"
                placeholder={t('firstName')}
                value={firstName}
                onChange={e =>
                  dispatch({ type: 'SET_FIELD', field: 'firstName', value: e.target.value })
                }
              />
            </div>
            <div className="w-1/2">
              <Input
                type="text"
                placeholder={t('lastName')}
                value={lastName}
                onChange={e =>
                  dispatch({ type: 'SET_FIELD', field: 'lastName', value: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-4">
            <Text
              variant="caption"
              className={`font-bold ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
            >
              {t('chooseYourDistrict') || 'Choose Your Allegiance'}
            </Text>
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
      <Input
        type="email"
        placeholder={t('email')}
        value={email}
        onChange={e => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
      />
      <div>
        <Input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={e => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
        />
        {isSignUp && (
          <p
            className={`text-[10px] mt-1 ml-1 font-medium ${themeClasses(theme, 'text-slate-500', 'text-slate-400')}`}
          >
            {t('passwordMinLength')}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={loading}
        variant="primary"
        fullWidth
        className={`mt-2 shadow-lg ${loading ? 'cursor-wait opacity-80' : 'hover:bg-sky-600 shadow-sky-500/20'}`}
      >
        {loading ? t('pleaseWait') : isSignUp ? t('createAccount') : t('signIn')}
      </Button>
    </form>
  );
};

export default AuthFormFields;
