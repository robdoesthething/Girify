/**
 * ViewUserModal Component
 *
 * Modal for viewing user profile in admin panel.
 */

import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import ProfileScreen from '../../features/profile/components/ProfileScreen';
import { UserProfile } from '../../types/user';
import { themeClasses } from '../../utils/themeUtils';

interface ViewUserModalProps {
  user: UserProfile;
  onClose: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ user, onClose }) => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-4xl h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${themeClasses(theme, 'bg-slate-900', 'bg-slate-50')}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="p-8">
          <div className="bg-orange-500 text-white text-center py-2 px-4 rounded-xl font-bold mb-6">
            ⚠️ ADMIN VIEW: Viewing profile of {user.username}
          </div>
          <ProfileScreen username={user.username} />
        </div>
      </motion.div>
    </div>
  );
};

ViewUserModal.displayName = 'ViewUserModal';

export default ViewUserModal;
