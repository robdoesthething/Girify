import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useTheme } from '../context/ThemeContext';
import { submitFeedback } from '../utils/social';
import PropTypes from 'prop-types';

const FeedbackModal = ({ username, onClose }) => {
  const { theme, t } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      // Save feedback to Firestore with pending status
      // Admin will review and approve to award Giuros
      await submitFeedback(username, feedback);

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Feedback error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`w-full max-w-md p-6 rounded-3xl shadow-2xl ${
          theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
        }`}
      >
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-black mb-2">
                {t('feedbackTitle') || 'We value your feedback!'}
              </h2>
              <p className="text-sm opacity-70 mb-4 leading-relaxed">
                {t('feedbackSubtitle') ||
                  'Tell us what you think about Girify. Helpful feedback helps us improve!'}
              </p>

              <form onSubmit={handleSubmit}>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder={t('feedbackPlaceholder') || 'What would you like to see improved?'}
                  className={`w-full h-32 p-4 rounded-xl resize-none outline-none border focus:ring-2 focus:ring-sky-500 transition-all mb-4 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-700 placeholder-slate-600'
                      : 'bg-slate-50 border-slate-200 placeholder-slate-400'
                  }`}
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim()}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : t('submitFeedback') || 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">Thank You!</h3>
              <p className="opacity-70 mb-4">
                {t('feedbackPending') ||
                  "Your feedback is under review. You'll be notified when approved!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

FeedbackModal.propTypes = {
  username: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FeedbackModal;
