/**
 * PendingGoogleUserView Component
 *
 * District selection step for new Google users without a district.
 */

import { motion } from 'framer-motion';
import React from 'react';
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
}

const PendingGoogleUserView: React.FC<PendingGoogleUserViewProps> = ({
  theme,
  pendingGoogleUser,
  district,
  loading,
  dispatch,
  onComplete,
}) => {
  return (
    <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 backdrop-blur-xl pointer-events-auto overflow-hidden overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-sm p-8 rounded-3xl shadow-2xl border my-auto ${themeClasses(theme, 'bg-slate-900/90 border-slate-700 text-white', 'bg-white/90 border-slate-200 text-slate-900')}`}
      >
        <h2 className="text-2xl font-black mb-2 tracking-tight text-center">One Last Step!</h2>
        <p
          className={`text-sm text-center mb-6 font-medium ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
        >
          Welcome, <span className="font-bold text-sky-500">{pendingGoogleUser.handle}</span>!
          <br />
          Please choose your district to complete your registration.
        </p>

        <div className="space-y-4 mb-6">
          <DistrictSelector
            theme={theme}
            selectedDistrict={district}
            onSelect={value => dispatch({ type: 'SET_FIELD', field: 'district', value })}
            maxHeight="max-h-60"
          />
        </div>

        <button
          onClick={onComplete}
          disabled={!district || loading}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 text-white
              ${!district || loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'}
          `}
        >
          {loading ? 'Finalizing...' : 'Complete Registration'}
        </button>
      </motion.div>
    </div>
  );
};

PendingGoogleUserView.displayName = 'PendingGoogleUserView';

export default PendingGoogleUserView;
