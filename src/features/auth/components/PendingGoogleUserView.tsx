/**
 * PendingGoogleUserView Component
 *
 * District selection step for new Google users without a district.
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Button, Card, Heading, Text } from '../../../components/ui';
import { themeClasses } from '../../../utils/themeUtils';
import type { FormAction, PendingGoogleUser } from '../hooks/useRegisterForm';
import DistrictSelector from './DistrictSelector';

interface PendingGoogleUserViewProps {
  theme: 'light' | 'dark';
  pendingGoogleUser: PendingGoogleUser;
  district: string;
  loading: boolean;
  dispatch: React.Dispatch<FormAction>;
  onComplete: () => Promise<void>;
  onCancel?: () => void;
  t: (key: string) => string;
}

const PendingGoogleUserView: React.FC<PendingGoogleUserViewProps> = ({
  theme,
  pendingGoogleUser,
  district,
  loading,
  dispatch,
  onComplete,
  onCancel,
  t,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-xl pointer-events-auto overflow-hidden overflow-y-auto">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card
          className={`w-full max-w-sm p-8 shadow-2xl border my-auto ${themeClasses(theme, '!bg-slate-900/90 !border-slate-700', '!bg-white/90 !border-slate-200')}`}
        >
          <Heading variant="h2" align="center" className="mb-2 tracking-tight">
            {t('oneLastStep')}
          </Heading>
          <Text variant="caption" align="center" className="mb-6 font-medium" muted>
            {t('welcomeBack')},{' '}
            <span className="font-bold text-sky-500">{pendingGoogleUser.handle}</span>!
            <br />
            {t('chooseDistrictToComplete')}
          </Text>

          <div className="space-y-4 mb-6">
            <DistrictSelector
              theme={theme}
              selectedDistrict={district}
              onSelect={value => dispatch({ type: 'SET_FIELD', field: 'district', value })}
              maxHeight="max-h-60"
            />
          </div>

          <Button
            onClick={onComplete}
            disabled={!district || loading}
            fullWidth
            className={`shadow-lg ${!district || loading ? 'cursor-not-allowed' : 'hover:bg-sky-600 shadow-sky-500/20'}`}
          >
            {loading ? t('finalizing') : t('completeRegistration')}
          </Button>

          {onCancel && (
            <Button variant="ghost" onClick={onCancel} fullWidth className="mt-3">
              {t('cancel')}
            </Button>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

PendingGoogleUserView.displayName = 'PendingGoogleUserView';

export default PendingGoogleUserView;
