import React from 'react';
import { TOAST_SHORT_MS } from '../../config/appConstants';
import { STORAGE_KEYS } from '../../config/constants';
import { useTheme } from '../../context/ThemeContext';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { storage } from '../../utils/storage';
import { themeClasses } from '../../utils/themeUtils';
import { ConfirmDialog } from '../ConfirmDialog';

interface AccountSettingsProps {
  onLogout: () => void;
  isAdmin: boolean;
  onAdminAccess: () => void; // Passed from parent or handled here?
  // Admin logic uses window.prompt which is simple, maybe keep it or pass it.
  // Parent handled handleAdminAccess which was complex.
  // Let's passed it from parent for now to avoid moving all that logic or duplicate it.
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ onLogout, isAdmin, onAdminAccess }) => {
  const { theme, t } = useTheme();
  const { confirm, confirmConfig, handleClose } = useConfirm();
  const { toast, success: showSuccess } = useToast();

  const handleClearHistory = async () => {
    if (
      await confirm(
        t('clearHistoryConfirm') ||
          'Are you sure you want to clear your game history? This cannot be undone.',
        'Clear History',
        true
      )
    ) {
      storage.remove(STORAGE_KEYS.HISTORY);
      showSuccess(t('historyCleared') || 'Game history cleared.');
      setTimeout(() => window.location.reload(), TOAST_SHORT_MS);
    }
  };

  const handleSignOut = async () => {
    if (await confirm('Are you sure you want to sign out?', 'Sign Out')) {
      onLogout();
    }
  };

  return (
    <div className="space-y-4">
      {/* Local Toast UI for History/Logout feedback */}
      {toast && (
        <div
          className={`mb-4 p-3 rounded-xl text-center font-bold text-sm font-inter ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/20 text-red-600 dark:text-red-400'
          }`}
        >
          {toast.text}
        </div>
      )}

      <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 font-inter">
        Data & Account
      </h3>
      <button
        onClick={handleClearHistory}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors font-medium dark:bg-rose-900/20 dark:border-rose-900/50 dark:text-rose-400 font-inter"
        type="button"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Clear Game History
      </button>

      <button
        onClick={handleSignOut}
        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors font-medium font-inter ${themeClasses(theme, 'border-slate-700 hover:bg-slate-800', 'border-slate-200 hover:bg-slate-50')}`}
        type="button"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        {t('logout')}
      </button>

      {/* Admin Link Section */}
      <div className="pt-2">
        {isAdmin ? (
          <a
            href="/admin"
            className="block w-full text-center p-3 rounded-xl bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 transition-colors font-inter"
          >
            Open Admin Panel
          </a>
        ) : (
          <div className="mt-8 text-center pb-4">
            <button
              type="button"
              onClick={onAdminAccess}
              className="text-xs text-slate-300 dark:text-slate-700 select-none cursor-default font-mono hover:text-slate-500 dark:hover:text-slate-500 transition-colors bg-transparent border-0"
              aria-label="Version Info"
            >
              v0.1.0
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmConfig}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        isDangerous={confirmConfig?.isDangerous}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </div>
  );
};

export default AccountSettings;
