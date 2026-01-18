import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { DISTRICTS } from '../data/districts';
import { ensureUserProfile } from '../utils/social';

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

      // Update user profile with selected district
      // ensureUserProfile handles the team name logic automatically
      await ensureUserProfile(username, null, { district });

      setLoading(false);
      onComplete();
    } catch (err) {
      console.error('Error updating district:', err);
      setError('Failed to update district. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-sm p-8 rounded-3xl shadow-2xl border ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">🏆</span>
          <h2 className="text-2xl font-black mb-2 tracking-tight">
            {t('joinATeam') || 'Join a Team!'}
          </h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('teamRequiredDetails') ||
              'Pick your Barcelona district and compete with your team in the global leaderboard!'}
          </p>
        </div>

        <div className="space-y-4">
          <select
            value={district}
            onChange={e => setDistrict(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-sky-500 transition-all appearance-none cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          >
            <option value="" disabled>
              {t('chooseATeam') || '🏆 Choose a team...'}
            </option>
            {DISTRICTS.map(d => (
              <option key={d.id} value={d.id}>
                {d.teamName}
              </option>
            ))}
          </select>

          {district && (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-4 animate-fadeIn">
              {(() => {
                const d = DISTRICTS.find(dist => dist.id === district);
                if (!d) {
                  return null;
                }
                return (
                  <>
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${d.color} p-0.5 shadow-lg flex-shrink-0`}
                    >
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-white/20">
                        <img src={d.logo} alt={d.teamName} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                        {t('youAreJoining') || 'You are joining'}
                      </p>
                      <h3
                        className={`text-lg font-black bg-gradient-to-r ${d.color} bg-clip-text text-transparent leading-tight`}
                      >
                        {d.teamName}
                      </h3>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

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
            {loading ? 'Joining...' : 'Confirm & Join Team'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DistrictSelectionModal;
