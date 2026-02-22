import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTopBarNav } from '../hooks/useTopBarNav';
import { STORAGE_KEYS } from '../config/constants';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../utils/storage';
import { themeClasses } from '../utils/themeUtils';
import TopBar from './TopBar';
import { PageHeader } from './ui';

interface FeedbackScreenProps {
  username: string;
}

const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ username }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();
  const topBarNav = useTopBarNav();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !turnstileToken) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, text: feedback, turnstileToken }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || 'Failed to submit feedback');
      }

      storage.set(STORAGE_KEYS.LAST_FEEDBACK, Date.now().toString());
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <TopBar onOpenPage={topBarNav.onOpenPage} onTriggerLogin={topBarNav.onTriggerLogin} />

      <div className="flex-1 w-full px-4 py-8 pt-20 overflow-x-hidden overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          <PageHeader title={t('feedback') || 'Feedback'} />

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
                  className={`p-6 rounded-3xl border shadow-sm ${themeClasses(theme, 'bg-slate-900 border-slate-800', 'bg-white border-slate-200')}`}
                >
                  <form onSubmit={handleSubmit}>
                    <textarea
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder={t('feedbackPlaceholderFeatures') || 'I wish the game had...'}
                      aria-label="Your Feedback"
                      className={`w-full h-48 p-4 rounded-xl resize-none outline-none border focus:ring-2 focus:ring-sky-500 transition-all mb-4 text-lg font-inter ${themeClasses(theme, 'bg-slate-800 border-slate-700 placeholder-slate-600 text-white', 'bg-slate-50 border-slate-200 placeholder-slate-400 text-slate-900')}`}
                    />

                    <div className="flex justify-center mb-4">
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                        onSuccess={setTurnstileToken}
                        onError={() => setTurnstileToken(null)}
                        onExpire={() => setTurnstileToken(null)}
                        options={{ theme: theme === 'light' ? 'light' : 'dark' }}
                      />
                    </div>

                    {error && (
                      <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 text-center animate-shake font-inter">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !feedback.trim() || !turnstileToken}
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
                  className={`px-6 py-3 rounded-xl font-bold border ${themeClasses(theme, 'bg-yellow-900/20 text-yellow-400 border-yellow-700/50', 'bg-yellow-50 text-yellow-700 border-yellow-200')} flex items-center gap-2`}
                >
                  <img src="/giuro.png" className="w-5 h-5" alt="Giuros" />
                  <span className="font-inter">Reward Pending</span>
                </div>

                <button
                  onClick={() => navigate(-1)}
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
    </div>
  );
};

export default FeedbackScreen;
