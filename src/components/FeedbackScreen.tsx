import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { submitFeedback } from '../utils/social';

interface FeedbackScreenProps {
  username: string;
  onClose: () => void;
}

const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ username, onClose }) => {
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
  };

  return (
    <div
      className={`fixed inset-0 z-[8000] flex flex-col pt-16 pb-6 px-4 md:px-8 overflow-hidden pointer-events-auto backdrop-blur-md ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full mb-8 shrink-0 relative">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity z-10 font-inter"
          type="button"
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

        <h2 className="text-xl font-black tracking-tight absolute left-1/2 transform -translate-x-1/2 font-inter">
          {t('feedback') || 'Feedback'}
        </h2>

        {/* Empty div for flex spacing */}
        <div className="w-16" />
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
                <h2 className="text-xs font-black mb-1 text-sky-500 uppercase tracking-[0.3em] font-inter">
                  {t('shapeTheFuture') || 'SHAPE THE FUTURE'}
                </h2>
                <h3 className="text-2xl font-black mb-3 text-slate-800 dark:text-white font-inter">
                  {t('whatFeaturesTitle') || 'What features do you want?'}
                </h3>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-700/50 inline-flex items-center gap-2 transform hover:scale-105 transition-transform">
                  <img src="/giuro.png" className="w-5 h-5" alt="G" />
                  <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 font-inter">
                    {t('earnForFeedback') || 'Earn Giuros (I personally review every feedback)'}
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
                    aria-label="Your Feedback"
                    className={`w-full h-48 p-4 rounded-xl resize-none outline-none border focus:ring-2 focus:ring-sky-500 transition-all mb-4 text-lg font-inter ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 placeholder-slate-600 text-white'
                        : 'bg-slate-50 border-slate-200 placeholder-slate-400 text-slate-900'
                    }`}
                  />

                  {/* Math Captcha */}
                  <div className="flex items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-200 select-none font-inter">
                      {captcha.a} + {captcha.b} = ?
                    </div>
                    <input
                      type="number"
                      value={captchaAnswer}
                      onChange={e => setCaptchaAnswer(e.target.value)}
                      placeholder="?"
                      aria-label="Captcha Answer"
                      className="w-20 p-2 rounded-lg border text-center font-bold outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white font-inter"
                    />
                    <span className="text-xs opacity-50 ml-auto font-inter">
                      Prove you are human
                    </span>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 text-center animate-shake font-inter">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim() || !captchaAnswer}
                    className="w-full py-4 rounded-xl font-bold text-lg bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 font-inter"
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
              <h3 className="text-2xl font-black mb-3 font-inter">Thank You!</h3>
              <p className="opacity-70 mb-8 max-w-sm mx-auto leading-relaxed font-inter">
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
                <span className="font-inter">Reward Pending</span>
              </div>

              <button
                onClick={onClose}
                className="mt-12 px-8 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors font-inter"
                type="button"
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

export default FeedbackScreen;
