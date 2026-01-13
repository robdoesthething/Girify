import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { submitFeedback } from '../utils/social';

interface FeedbackModalProps {
  username: string;
  onClose: () => void;
  inline?: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ username, onClose, inline = false }) => {
  const { theme, t } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captcha] = useState(() => ({
    a: Math.floor(Math.random() * 10) + 1,
    b: Math.floor(Math.random() * 10) + 1,
  }));
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      return;
    }

    // Verify Captcha
    if (parseInt(captchaAnswer, 10) !== captcha.a + captcha.b) {
      setError('Incorrect math answer. Please try again.');
      return;
    }
    setError(null);

    setIsSubmitting(true);
    await (submitFeedback as any)(username, feedback);
    setIsSubmitting(false);
    setSubmitted(true);

    setTimeout(() => {
      onClose();
    }, 2000);
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
                <h2 className="text-xs font-black mb-1 text-sky-500 uppercase tracking-[0.3em] font-inter">
                  {t('shapeTheFuture') || 'SHAPE THE FUTURE'}
                </h2>
                <h3 className="text-2xl font-black mb-2 text-slate-800 dark:text-white font-inter">
                  {t('whatFeaturesTitle') || 'What features do you want?'}
                </h3>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-200 dark:border-yellow-700/50">
                  <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1 font-inter">
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
                  className={`w-full h-32 p-4 rounded-xl resize-none outline-none border focus:ring-2 focus:ring-sky-500 transition-all mb-4 font-inter ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-700 placeholder-slate-600'
                      : 'bg-slate-50 border-slate-200 placeholder-slate-400'
                  }`}
                />

                {/* Math Captcha */}
                <div className="flex items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-md font-bold text-slate-700 dark:text-slate-200 select-none font-inter">
                    {captcha.a} + {captcha.b} = ?
                  </div>
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={e => setCaptchaAnswer(e.target.value)}
                    placeholder="?"
                    className="w-16 p-2 rounded-md border text-center font-bold outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white font-inter"
                  />
                  <span className="text-xs opacity-50 ml-auto font-inter">Prove you are human</span>
                </div>

                {error && (
                  <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 text-center animate-shake font-inter">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  {!inline && (
                    <button
                      type="button"
                      onClick={onClose}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors font-inter ${
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
                    className={`w-full py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-inter`}
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
              <h3 className="text-xl font-bold mb-2 font-inter">Thank You!</h3>
              <p className="opacity-70 mb-4 text-sm font-inter">
                {t('feedbackPending') ||
                  "Your feedback is under review. You'll specify your reward soon!"}
              </p>
              <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg inline-block font-inter">
                Reward pending quality check
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;
