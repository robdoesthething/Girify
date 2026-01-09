import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useTheme } from '../context/ThemeContext';
import { getActiveAnnouncements, markAnnouncementAsRead } from '../utils/news';
import PropTypes from 'prop-types';

/**
 * NewsScreen - Displays all past announcements
 */
const NewsScreen = ({ onClose, username }) => {
  const { theme, t } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      const news = await getActiveAnnouncements();
      setAnnouncements(news);

      // Mark all as read when viewing
      if (username) {
        for (const a of news) {
          await markAnnouncementAsRead(username, a.id);
        }
      }
      setLoading(false);
    };

    fetchAnnouncements();
  }, [username]);

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed inset-0 z-[5000] pt-12 overflow-y-auto ${
        theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">{t('news') || 'News'}</h1>
            <p className="text-sm opacity-60">
              {t('latestUpdates') || 'Latest updates and announcements'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl ${
              theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            } transition-colors`}
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
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📰</div>
            <h2 className="text-xl font-bold mb-2">{t('noNews') || 'No announcements yet'}</h2>
            <p className="opacity-60">{t('checkBackLater') || 'Check back later for updates!'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map(announcement => (
              <motion.article
                key={announcement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } shadow-sm`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold">{announcement.title}</h2>
                  <span className="text-xs opacity-50 whitespace-nowrap ml-4">
                    {formatDate(announcement.publishDate)}
                  </span>
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none opacity-80"
                  dangerouslySetInnerHTML={{ __html: announcement.body.replace(/\n/g, '<br />') }}
                />
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

NewsScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
  username: PropTypes.string,
};

export default NewsScreen;
