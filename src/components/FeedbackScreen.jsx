import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { submitFeedback } from '../utils/social';
import PropTypes from 'prop-types';

const FeedbackScreen = ({ username, onClose }) => {
  const { theme, t } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    await submitFeedback(username, feedback);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div
      className={`fixed inset-0 z-[8000] flex flex-col pt-16 pb-6 px-4 md:px-8 overflow-hidden pointer-events-auto backdrop-blur-md ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full mb-8 shrink-0 relative">
        <button
          onClick={onClose}
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
          {t('back') || 'Back'}
        </button>

        <h2 className="text-xl font-black tracking-tight absolute left-1/2 transform -translate-x-1/2">
          {t('feedback') || 'Feedback'}
        </h2>

        {/* Empty div for flex spacing */}
        <div className="w-16"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full pb-8">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-xs font-black mb-1 text-sky-500 uppercase tracking-[0.3em]">
                  {t('shapeTheFuture') || 'SHAPE THE FUTURE'}
                </h2>
                <h3 className="text-2xl font-black mb-3 text-slate-800 dark:text-white">
                  {t('whatFeaturesTitle') || 'What features do you want?'}
                </h3>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-700/50 inline-flex items-center gap-2 transform hover:scale-105 transition-transform">
                  <img src="/giuro.png" className="w-5 h-5" alt="G" />
                  <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                    {t('earnForFeedback') || 'Earn up to 50 Giuros (subject to evaluation)'}
                  </p>
                </div>
              </div>

              <div
                className={`p-6 rounded-3xl border shadow-sm ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <form onSubmit={handleSubmit}>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder={t('feedbackPlaceholderFeatures') || 'I wish the game had...'}
                    className={`w-full h-48 p-4 rounded-xl resize-none outline-none border focus:ring-2 focus:ring-sky-500 transition-all mb-4 text-lg ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 placeholder-slate-600 text-white'
                        : 'bg-slate-50 border-slate-200 placeholder-slate-400 text-slate-900'
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim()}
                    className={`w-full py-4 rounded-xl font-bold text-lg bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95`}
                  >
                    {isSubmitting ? 'Sending...' : t('submitFeedback') || 'Submit Feedback'}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="text-6xl mb-6 animate-bounce">🎉</div>
              <h3 className="text-2xl font-black mb-3">Thank You!</h3>
              <p className="opacity-70 mb-8 max-w-sm mx-auto leading-relaxed">
                {t('feedbackPending') ||
                  "Your feedback is under review. You'll be notified when approved!"}
              </p>
              <div
                className={`px-6 py-3 rounded-xl font-bold border ${
                  theme === 'dark'
                    ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700/50'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                } flex items-center gap-2`}
              >
                <img src="/giuro.png" className="w-5 h-5" alt="Giuros" />
                <span>+50 Giuros (Pending Approval)</span>
              </div>

              <button
                onClick={onClose}
                className="mt-12 px-8 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors"
              >
                {t('close') || 'Close'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

FeedbackScreen.propTypes = {
  username: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FeedbackScreen;
