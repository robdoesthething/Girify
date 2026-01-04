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
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
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
          </div>

          {/* Content Card */}
          <div
            className={`rounded-3xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
          >
            {/* Header */}
            <div
              className={`p-6 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}
            >
              <h2 className="text-2xl font-black tracking-tight">{t('aboutGirify')}</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-sm leading-relaxed opacity-90">
              <p>{t('aboutDescription')}</p>

              <h3 className="font-bold text-lg mt-4">{t('howToPlay')}</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('aboutPoint1')}</li>
                <li>{t('aboutPoint2')}</li>
                <li>{t('aboutPoint3')}</li>
                <li>{t('aboutPoint4')}</li>
                <li>{t('aboutPoint5')}</li>
              </ul>

              <h3 className="font-bold text-lg mt-4">{t('aboutCredits')}</h3>
              <p>{t('aboutFooter')}</p>

              <div className="pt-8 text-center opacity-50 text-xs">{t('rightsReserved')}</div>
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
