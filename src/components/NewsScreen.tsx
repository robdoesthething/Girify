import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Announcement, getActiveAnnouncements, markAnnouncementAsRead } from '../utils/social/news';
import { themeClasses } from '../utils/themeUtils';
import TopBar from './TopBar';
import { PageHeader } from './ui';

interface NewsScreenProps {
  username?: string;
}

const NewsScreen: React.FC<NewsScreenProps> = ({ username }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      const news = await getActiveAnnouncements();
      setAnnouncements(news);
      setLoading(false);

      // Mark all as read in background (non-blocking)
      if (username) {
        Promise.all(news.map(a => markAnnouncementAsRead(username, a.id)));
      }
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
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <TopBar
        onOpenPage={page => navigate(page ? `/${page}` : '/')}
        onTriggerLogin={mode => navigate(`/?auth=${mode}`)}
      />

      <div className="flex-1 w-full px-4 py-8 pt-20 overflow-x-hidden overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          <PageHeader title={t('news') || 'News'} />

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
                  width={128}
                  height={128}
                  loading="lazy"
                  decoding="async"
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
                  <p className="prose prose-sm dark:prose-invert max-w-none opacity-80 leading-relaxed font-inter whitespace-pre-line">
                    {announcement.body}
                  </p>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsScreen;
