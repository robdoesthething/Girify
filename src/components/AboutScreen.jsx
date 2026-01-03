import React from 'react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import PropTypes from 'prop-types';

const AboutScreen = ({ onClose }) => {
  const { theme, t } = useTheme();

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden
                    ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                `}
      >
        {/* Header */}
        <div
          className={`p-6 border-b shrink-0 flex justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}
        >
          <h2 className="text-2xl font-black tracking-tight">{t('aboutGirify')}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed opacity-90">
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
      </motion.div>
    </div>
  );
};

AboutScreen.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default AboutScreen;
