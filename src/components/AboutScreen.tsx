import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { themeClasses } from '../utils/themeUtils';
import TopBar from './TopBar';
import { PageHeader } from './ui';

const AboutScreen: React.FC = () => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
           ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}
      `}
    >
      <TopBar
        onOpenPage={page => navigate(page ? `/${page}` : '/')}
        onTriggerLogin={mode => navigate(`/?auth=${mode}`)}
      />

      <div className="flex-1 overflow-y-auto w-full px-4 py-6 pt-16">
        <div className="max-w-2xl mx-auto">
          <PageHeader title={t('aboutGirify')} />

          <div className="space-y-6 text-sm leading-relaxed opacity-90 px-2 pb-24">
            <p className="text-base font-medium">{t('aboutDescription')}</p>

            <h3 className="font-bold text-lg mt-8 text-sky-500">Tech Stack</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold mb-1">React 19</div>
                <div className="text-xs opacity-60">Vite 7, Hooks, Context</div>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold mb-1">Supabase</div>
                <div className="text-xs opacity-60">PostgreSQL, Auth, Realtime</div>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold mb-1">TailwindCSS</div>
                <div className="text-xs opacity-60">Utility-first styling</div>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold mb-1">Leaflet</div>
                <div className="text-xs opacity-60">Interactive Maps</div>
              </div>
            </div>

            <h3 className="font-bold text-lg mt-8 text-sky-500">About the Author</h3>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-xl shrink-0">
                👨‍💻
              </div>
              <div>
                <p className="mb-2">
                  Built with love (and too much caffeine) by a local developer who got tired of
                  getting lost in Eixample.
                </p>
                <p className="text-xs opacity-60">Anonymous Developer</p>
              </div>
            </div>

            <h3 className="font-bold text-lg mt-6 text-sky-500">{t('howToPlay')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span>{t('aboutPoint1')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span>{t('aboutPoint2')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span>{t('aboutPoint3')}</span>
              </li>
            </ul>

            <div className="pt-10 text-center opacity-40 text-xs font-mono">
              <p>{t('rightsReserved')}</p>
              <div className="flex justify-center gap-4 mt-2">
                <a href="/privacy" className="hover:underline">
                  Privacy
                </a>
                <span>•</span>
                <a href="/terms" className="hover:underline">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;
