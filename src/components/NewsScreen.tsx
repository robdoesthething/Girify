import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Announcement, getActiveAnnouncements, markAnnouncementAsRead } from '../utils/news';
import { themeClasses } from '../utils/themeUtils';

interface NewsScreenProps {
  onClose: () => void;
  username?: string;
}

const NewsScreen: React.FC<NewsScreenProps> = ({ onClose, username }) => {
  const { theme, t } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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
    <div
      className={`fixed inset-0 z-[8000] flex flex-col pt-16 pb-6 px-4 md:px-8 overflow-hidden pointer-events-auto backdrop-blur-md ${themeClasses(theme, 'bg-neutral-950 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full mb-8 shrink-0 relative">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity z-10 font-inter"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t('back') || 'Back'}
        </button>

        <h2 className="text-xl font-black tracking-tight absolute left-1/2 transform -translate-x-1/2 font-inter">
          {t('news') || 'News'}
        </h2>

        {/* Empty div for flex spacing */}
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📰</div>
            <h2 className="text-xl font-bold mb-2 font-inter">
              {t('noNews') || 'No announcements yet'}
            </h2>
            <p className="opacity-60 font-inter">
              {t('checkBackLater') || 'Check back later for updates!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center mb-6">
              <img
                src="/mejur_jouma.png"
                alt="Mejur Jouma"
                className="w-32 h-32 object-contain hover:scale-110 transition-transform cursor-pointer"
                title="Mejur Jouma delivering the news"
              />
              <p className="text-center text-sm opacity-50 uppercase tracking-widest font-bold mt-2 font-inter">
                {t('latestUpdates') || 'Latest updates and announcements'}
              </p>
            </div>
            {announcements.map(announcement => (
              <motion.article
                key={announcement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border ${themeClasses(theme, 'bg-slate-900 border-slate-800', 'bg-white border-slate-200')} shadow-sm`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold font-inter">{announcement.title}</h2>
                  <span className="text-xs opacity-50 whitespace-nowrap ml-4 font-bold uppercase tracking-wider font-inter">
                    {formatDate(announcement.publishDate)}
                  </span>
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none opacity-80 leading-relaxed font-inter"
                  dangerouslySetInnerHTML={{ __html: announcement.body.replace(/\n/g, '<br />') }}
                />
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsScreen;
