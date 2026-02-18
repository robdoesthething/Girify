import React, { useCallback, useEffect, useState } from 'react';
import { GameConfig, getGameConfig, updateGameConfig } from '../../services/db/config';
import FormInput from '../FormInput';

interface AdminConfigProps {
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AdminConfig: React.FC<AdminConfigProps> = ({ onNotify }) => {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async (isInitial = false) => {
    if (!isInitial) {
      setLoading(true);
    }
    const data = await getGameConfig();
    setConfig(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchConfig(true);
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!config) {
      return;
    }

    setSaving(true);
    const result = await updateGameConfig(config);
    if (result.success) {
      onNotify('Game configuration updated successfully', 'success');
    } else {
      onNotify(`Failed to update config: ${result.error}`, 'error');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="py-12 text-center opacity-50">Loading configuration...</div>;
  }

  if (!config) {
    return (
      <div className="py-12 text-center text-red-500">
        Failed to load config.{' '}
        <button onClick={() => fetchConfig(false)} className="underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Game Configuration</h2>
          <p className="text-sm opacity-60">Control global game rules and multipliers.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded-xl font-bold text-white transition-all ${
            saving
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
          }`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ECONOMY SETTINGS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>💎</span> Economy & Scoring
          </h3>
          <div className="space-y-4">
            <div>
              <FormInput
                id="config-score-mult"
                label="Score Multiplier (Global)"
                type="number"
                value={config.scoreMultiplier}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, scoreMultiplier: Number(e.target.value) })
                }
                step="0.1"
                min="0.1"
                containerClassName="mb-1"
              />
              <p className="text-[10px] opacity-40">Default: 1.0. Set to 2.0 for Double XP.</p>
            </div>
            <div>
              <FormInput
                id="config-giuros-mult"
                label="Giuros Multiplier (Global)"
                type="number"
                step="0.1"
                min="0.1"
                value={config.giurosMultiplier}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, giurosMultiplier: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        {/* GAME LIMITS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>⏱️</span> Limits & Restrictions
          </h3>
          <div className="space-y-4">
            <div>
              <FormInput
                id="config-game-limit"
                label="Daily Game Limit (0 = Unlimited)"
                type="number"
                min="0"
                value={config.dailyGameLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, dailyGameLimit: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <input
                type="checkbox"
                id="maintenance"
                checked={config.maintenanceMode}
                onChange={e => setConfig({ ...config, maintenanceMode: e.target.checked })}
                className="w-5 h-5 accent-red-500 rounded"
              />
              <label
                htmlFor="maintenance"
                className="font-bold text-red-500 cursor-pointer select-none"
              >
                Enable Maintenance Mode
              </label>
            </div>
            <p className="text-xs text-red-500/60">
              If enabled, users will see a maintenance screen and cannot play.
            </p>
          </div>
        </div>

        {/* ANNOUNCEMENTS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📢</span> Global Notice
          </h3>
          <div>
            <FormInput
              id="config-announcement"
              label="Top Bar Announcement (Optional)"
              type="text"
              placeholder="e.g., 'Double Giuros Weekend is LIVE!'"
              value={config.announcementBar || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfig({ ...config, announcementBar: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConfig;
