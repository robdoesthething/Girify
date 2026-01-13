import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { submitFeedback } from '../utils/social';
import PropTypes from 'prop-types';

const FeedbackModal = ({ username, onClose, inline = false }) => {
  const { theme, t } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captcha] = useState(() => ({
    a: Math.floor(Math.random() * 10) + 1,
    b: Math.floor(Math.random() * 10) + 1,
  }));
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!feedback.trim()) return;

    // Verify Captcha
    if (parseInt(captchaAnswer) !== captcha.a + captcha.b) {
      // eslint-disable-next-line no-alert
      alert('Incorrect math answer. Please try again.');
      return;
    }

    setIsSubmitting(true);
    await submitFeedback(username, feedback);
    setIsSubmitting(false);
    setSubmitted(true);
    // Auto-close after short delay if inline to move to next screen
    if (inline) {
      setTimeout(() => {
        onClose();
      }, 2000); // Give time to read "Thank you"
    } else {
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const containerClasses = inline
    ? `w-full max-w-md p-6 rounded-[2.5rem] shadow-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`
    : `w-full max-w-md p-6 rounded-3xl shadow-2xl ${
        theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
      }`;

  const wrapperClasses = inline
    ? ''
    : 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm';

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
              <div className="flex flex-col items-center text-center mb-4">
                <h2 className="text-xs font-black mb-1 text-sky-500 uppercase tracking-[0.3em]">
                  {t('shapeTheFuture') || 'SHAPE THE FUTURE'}
                </h2>
                <h3 className="text-2xl font-black mb-2 text-slate-800 dark:text-white">
                  {t('whatFeaturesTitle') || 'What features do you want?'}
                </h3>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-200 dark:border-yellow-700/50">
                  <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                    <img src="/giuro.png" className="w-4 h-4" alt="G" />
                    {t('earnForFeedback') || 'Payout depends on quality'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder={t('feedbackPlaceholderFeatures') || 'I wish the game had...'}
                  className={`w-full h-32 p-4 rounded-xl resize-none outline-none border focus:ring-2 focus:ring-sky-500 transition-all mb-4 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-700 placeholder-slate-600'
                      : 'bg-slate-50 border-slate-200 placeholder-slate-400'
                  }`}
                />

                {/* Math Captcha */}
                <div className="flex items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-md font-bold text-slate-700 dark:text-slate-200 select-none">
                    {captcha.a} + {captcha.b} = ?
                  </div>
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={e => setCaptchaAnswer(e.target.value)}
                    placeholder="?"
                    className="w-16 p-2 rounded-md border text-center font-bold outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  />
                  <span className="text-xs opacity-50 ml-auto">Prove you are human</span>
                </div>

                <div className="flex gap-3">
                  {/* For inline, we just show Submit. The skip/close button is handled by parent or secondary action */}
                  {!inline && (
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
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim() || !captchaAnswer}
                    className={`w-full py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
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
              <p className="opacity-70 mb-4 text-sm">
                {t('feedbackPending') ||
                  "Your feedback is under review. You'll specify your reward soon!"}
              </p>
              <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg inline-block">
                Reward pending quality check
              </div>
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
  inline: PropTypes.bool,
};

export default FeedbackModal;
