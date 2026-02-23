import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import DistrictSelector from '../features/auth/components/DistrictSelector';
import SelectedDistrictPreview from '../features/auth/components/SelectedDistrictPreview';
import { supabase } from '../services/supabase';
import { ensureUserProfile } from '../utils/social';
import { themeClasses } from '../utils/themeUtils';

interface DistrictSelectionModalProps {
  username: string;
  onComplete: () => void;
  onDismiss?: () => void;
}

function DistrictSelectionModal({ username, onComplete, onDismiss }: DistrictSelectionModalProps) {
  const { theme, t } = useTheme();
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!onDismiss) {
      return undefined;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);

  const handleSubmit = async () => {
    if (!district) {
      setError(t('selectDistrict') || 'Please select a district');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user;
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
        className={`relative w-full max-w-md p-8 rounded-3xl shadow-2xl border ${themeClasses(theme, 'bg-slate-900 border-slate-700 text-white', 'bg-white border-slate-200 text-slate-900')}`}
      >
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold transition-colors ${themeClasses(theme, 'text-slate-400 hover:text-white hover:bg-slate-700', 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')}`}
            aria-label="Skip for now"
          >
            ×
          </button>
        )}
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
}

export default DistrictSelectionModal;
