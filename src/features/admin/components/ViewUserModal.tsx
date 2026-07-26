/**
 * ViewUserModal Component
 *
 * Modal for viewing user profile in admin panel.
 */

import React from 'react';
import Modal from '../../../components/ui/Modal';
import ProfileScreen from '../../../features/profile/components/ProfileScreen';
import { UserProfile } from '../../../utils/social';

interface ViewUserModalProps {
  user: UserProfile;
  onClose: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ user, onClose }) => {
  return (
    <Modal
      isOpen
      onClose={onClose}
      size="xxl"
      showCloseButton={false}
      contentClassName="h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-slate-50 dark:bg-slate-900"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        type="button"
        aria-label="Close modal"
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
    </Modal>
  );
};

ViewUserModal.displayName = 'ViewUserModal';

export default ViewUserModal;
