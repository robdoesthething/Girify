import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabase';
import DistrictSelector from '../features/auth/components/DistrictSelector';
import SelectedDistrictPreview from '../features/auth/components/SelectedDistrictPreview';
import { ensureUserProfile } from '../utils/social';
import { themeClasses } from '../utils/themeUtils';

interface DistrictSelectionModalProps {
  username: string;
  onComplete: () => void;
}

const DistrictSelectionModal: React.FC<DistrictSelectionModalProps> = ({
  username,
  onComplete,
}) => {
  const { theme, t } = useTheme();
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!district) {
      setError(t('selectDistrict') || 'Please select a district');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      await ensureUserProfile(username, currentUser.id, {
        district,
        email: currentUser.email || undefined,
      });

      setLoading(false);
      onComplete();
    } catch (err) {
      console.error('Error updating district:', err);
      setError(t('districtUpdateError') || 'Failed to update district. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border ${themeClasses(theme, 'bg-slate-900 border-slate-700 text-white', 'bg-white border-slate-200 text-slate-900')}`}
      >
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">🏆</span>
          <h2 className="text-2xl font-black mb-2 tracking-tight">
            {t('joinATeam') || 'Join a Team!'}
          </h2>
          <p className={`text-sm ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}>
            {t('teamRequiredDetails') ||
              'Pick your Barcelona district and compete with your team in the global leaderboard!'}
          </p>
        </div>

        <div className="space-y-4">
          <DistrictSelector
            theme={theme as 'light' | 'dark'}
            selectedDistrict={district}
            onSelect={setDistrict}
            showTeamName
            maxHeight="max-h-56"
          />

          {district && <SelectedDistrictPreview districtId={district} t={t} />}

          {error && (
            <div className="p-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-center font-bold">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !district}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 text-white
              ${
                loading || !district
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'
              }
            `}
          >
            {loading ? t('joining') || 'Joining...' : t('confirmJoinTeam') || 'Confirm & Join Team'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DistrictSelectionModal;
