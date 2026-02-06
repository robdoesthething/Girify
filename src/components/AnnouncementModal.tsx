import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { sanitizeHtml } from '../utils/security';
import { themeClasses } from '../utils/themeUtils';

interface Announcement {
  id: string;
  title: string;
  body: string;
  publishDate: Date | { seconds: number; toDate?: () => Date };
}

interface AnnouncementModalProps {
  announcement: Announcement | null;
  onDismiss: () => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ announcement, onDismiss }) => {
  const { theme, t } = useTheme();

  if (!announcement) {
    return null;
  }

  const formatDate = (timestamp: Date | { seconds: number; toDate?: () => Date }) => {
    if (!timestamp) {
      return '';
    }

    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date((timestamp as { seconds: number }).seconds * 1000);
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`relative z-10 w-full max-w-md p-6 rounded-3xl shadow-2xl ${themeClasses(
          theme,
          'bg-slate-800 text-white',
          'bg-white text-slate-900'
        )}`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📰</div>
          <h2 className="text-2xl font-black mb-1 font-inter">{announcement.title}</h2>
          <p className="text-xs opacity-50 font-inter">{formatDate(announcement.publishDate)}</p>
        </div>

        {/* Body */}
        <div
          className="mb-6 opacity-80 leading-relaxed text-sm max-h-60 overflow-y-auto font-inter"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.body) }}
        />

        {/* Action */}
        <button
          onClick={onDismiss}
          className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-sky-500/20 active:scale-95 transition-all font-inter"
          type="button"
        >
          {t('gotIt') || 'Got it!'}
        </button>
      </motion.div>
    </div>
  );
};

export default AnnouncementModal;
