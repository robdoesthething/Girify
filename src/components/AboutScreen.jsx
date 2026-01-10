import React from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import TopBar from './TopBar';
import PropTypes from 'prop-types';

const AboutScreen = ({ onClose: _onClose }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
           ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}
      `}
    >
      <TopBar onOpenPage={page => navigate(page ? `/${page}` : '/')} />

      <div className="flex-1 overflow-y-auto w-full px-4 py-6 pt-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('back')}
            </button>

            <h2 className="text-xl font-black tracking-tight absolute left-1/2 transform -translate-x-1/2">
              {t('aboutGirify')}
            </h2>
          </div>

          {/* Content */}
          <div className="space-y-6 text-sm leading-relaxed opacity-90 px-2">
            <p className="text-base">{t('aboutDescription')}</p>

            <h3 className="font-bold text-lg mt-6 text-sky-500">{t('howToPlay')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                <span>{t('aboutPoint1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                <span>{t('aboutPoint2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                <span>{t('aboutPoint3')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                <span>{t('aboutPoint4')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                <span>{t('aboutPoint5')}</span>
              </li>
            </ul>

            <h3 className="font-bold text-lg mt-6 text-sky-500">{t('aboutCredits')}</h3>
            <p className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {t('aboutFooter')}
            </p>

            <div className="pt-10 pb-6 text-center opacity-40 text-xs font-mono">
              <p>{t('rightsReserved')}</p>
              <p className="mt-2">Vibe Coded by Roberto using React, Tailwind, and Firebase.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AboutScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default AboutScreen;
