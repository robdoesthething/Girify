import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useTheme } from '../context/ThemeContext';
import PropTypes from 'prop-types';

/**
 * AnnouncementModal - Shows unread announcement before game starts
 */
const AnnouncementModal = ({ announcement, onDismiss }) => {
  const { theme, t } = useTheme();

  if (!announcement) return null;

  const formatDate = timestamp => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
        className={`relative z-10 w-full max-w-md p-6 rounded-3xl shadow-2xl ${
          theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📰</div>
          <h2 className="text-2xl font-black mb-1">{announcement.title}</h2>
          <p className="text-xs opacity-50">{formatDate(announcement.publishDate)}</p>
        </div>

        {/* Body */}
        <div
          className="mb-6 opacity-80 leading-relaxed text-sm max-h-60 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: announcement.body.replace(/\n/g, '<br />') }}
        />

        {/* Action */}
        <button
          onClick={onDismiss}
          className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
        >
          {t('gotIt') || 'Got it!'}
        </button>
      </motion.div>
    </div>
  );
};

AnnouncementModal.propTypes = {
  announcement: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    body: PropTypes.string,
    publishDate: PropTypes.object,
  }),
  onDismiss: PropTypes.func.isRequired,
};

export default AnnouncementModal;
