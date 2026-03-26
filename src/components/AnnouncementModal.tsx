import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Announcement } from '../utils/social/news';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface AnnouncementModalProps {
  announcement: Announcement | null;
  onDismiss: () => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ announcement, onDismiss }) => {
  const { t } = useTheme();

  const formatDate = (timestamp: Date | string) => {
    if (!timestamp) {
      return '';
    }
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const footer = (
    <Button variant="primary" size="lg" fullWidth onClick={onDismiss} type="button">
      {t('gotIt') || 'Got it!'}
    </Button>
  );

  return (
    <Modal
      isOpen={announcement !== null}
      onClose={onDismiss}
      title={announcement?.title ?? ''}
      size="md"
      showCloseButton={false}
      closeOnBackdrop={true}
      footer={footer}
    >
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📰</div>
        <p className="text-xs opacity-50 font-inter">
          {announcement ? formatDate(announcement.publishDate) : ''}
        </p>
      </div>
      <p className="mb-2 opacity-80 leading-relaxed text-sm max-h-60 overflow-y-auto whitespace-pre-line font-inter">
        {announcement?.body}
      </p>
    </Modal>
  );
};

export default AnnouncementModal;
