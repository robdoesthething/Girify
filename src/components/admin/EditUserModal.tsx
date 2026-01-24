/**
 * EditUserModal Component
 *
 * Modal for editing user details in admin panel.
 */

import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile } from '../../types/user';
import { themeClasses } from '../../utils/themeUtils';

interface EditUserModalProps {
  user: UserProfile;
  setUser: (user: UserProfile | null) => void;
  onSave: (user: UserProfile) => Promise<boolean>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, setUser, onSave }) => {
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSave(user);
    if (success) {
      setUser(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl ${themeClasses(theme, 'bg-slate-800', 'bg-white')}`}
      >
        <h3 className="text-2xl font-black mb-6">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-username"
                className="text-xs uppercase font-bold opacity-50 block mb-1"
              >
                Username
              </label>
              <input
                id="edit-username"
                value={user.username}
                onChange={e => setUser({ ...user, username: e.target.value.toLowerCase() })}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
            <div>
              <label
                htmlFor="edit-email"
                className="text-xs uppercase font-bold opacity-50 block mb-1"
              >
                Email
              </label>
              <input
                id="edit-email"
                disabled
                value={user.email || ''}
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-900 opacity-50 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-giuros"
              className="text-xs uppercase font-bold opacity-50 block mb-1"
            >
              Giuros Balance
            </label>
            <input
              id="edit-giuros"
              type="number"
              value={user.giuros}
              onChange={e => setUser({ ...user, giuros: Number(e.target.value) })}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setUser(null)}
              className="flex-1 py-3 font-bold opacity-60 hover:opacity-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

EditUserModal.displayName = 'EditUserModal';

export default EditUserModal;
