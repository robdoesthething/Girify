import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { themeClasses } from '../utils/themeUtils';

/**
 * 404 screen for unknown routes. Keeps the user oriented with
 * clear ways back into the app instead of a blank page.
 */
const NotFoundScreen: React.FC = () => {
  const { theme, t } = useTheme();

  return (
    <main
      className={`min-h-full flex flex-col items-center justify-center text-center px-6 py-24 ${themeClasses(theme, 'text-white', 'text-slate-900')}`}
    >
      <img
        src="/mejur_jouma.png"
        alt=""
        aria-hidden="true"
        width="128"
        height="128"
        className="w-28 h-28 object-contain mb-6 opacity-90"
      />
      <p className="text-xs font-black uppercase tracking-widest text-sky-500 mb-2 font-inter">
        404
      </p>
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
        {t('notFoundTitle') || 'This street does not exist'}
      </h1>
      <p className="max-w-md text-sm md:text-base opacity-60 mb-8 leading-relaxed">
        {t('notFoundMessage') ||
          'Even the locals get lost sometimes. The page you were looking for has moved or never existed.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="px-6 py-3 rounded-2xl font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 transition-colors"
        >
          🏠 {t('backToHome') || 'Back to the game'}
        </Link>
        <Link
          to="/leaderboard"
          className={`px-6 py-3 rounded-2xl font-bold border transition-colors ${themeClasses(theme, 'border-slate-600 hover:bg-slate-800', 'border-slate-200 hover:bg-slate-100')}`}
        >
          🏆 {t('leaderboard') || 'Leaderboard'}
        </Link>
      </div>
    </main>
  );
};

export default NotFoundScreen;
