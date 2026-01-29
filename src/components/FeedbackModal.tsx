import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { themeClasses } from '../utils/themeUtils';
import FeedbackForm from './FeedbackForm';

const SUBMIT_DELAY = 2000;

interface FeedbackModalProps {
  username: string;
  onClose: () => void;
  isInline?: boolean;
}

const FeedbackSuccess: React.FC<{ t: (key: string) => string }> = ({ t }) => (
  <motion.div
    key="success"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-6"
  >
    <div className="text-5xl mb-4">🎉</div>
    <h3 className="text-xl font-bold mb-2 font-inter">Thank You!</h3>
    <p className="opacity-70 mb-4 text-sm font-inter">
      {t('feedbackPending') || "Your feedback is under review. You'll specify your reward soon!"}
    </p>
    <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg inline-block font-inter">
      Reward pending quality check
    </div>
  </motion.div>
);

const FeedbackModal: React.FC<FeedbackModalProps> = ({ username, onClose, isInline = false }) => {
  const { theme, t } = useTheme();
  const [submitted, setSubmitted] = useState(false);

  const handleSuccess = useCallback(() => {
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, SUBMIT_DELAY);
  }, [onClose]);

  const containerClasses = isInline
    ? `w-full max-w-md p-6 rounded-[2.5rem] shadow-xl border ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-200')}`
    : `w-full max-w-md p-6 rounded-3xl shadow-2xl ${themeClasses(theme, 'bg-slate-800 text-white', 'bg-white text-slate-900')}`;

  const wrapperClasses = isInline
    ? ''
    : 'fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';

  return (
    <div className={wrapperClasses}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={containerClasses}
      >
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FeedbackForm
                username={username}
                onSuccess={handleSuccess}
                onClose={onClose}
                isInline={isInline}
              />
            </motion.div>
          ) : (
            <FeedbackSuccess t={t} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;
