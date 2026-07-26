import React, { Suspense, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { turnstileSiteKey, useFeedbackSubmit } from '../hooks/useFeedbackSubmit';
import { themeClasses } from '../utils/themeUtils';
import { LazyTurnstile } from './LazyTurnstile';

interface FeedbackFormProps {
  username: string;
  onSuccess: () => void;
  onClose: () => void;
  isInline: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ username, onSuccess, onClose, isInline }) => {
  const { theme, t } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [turnstileErrored, setTurnstileErrored] = useState(false);
  const { submitFeedback, isSubmitting, error, turnstileToken, setTurnstileToken, turnstileRef } =
    useFeedbackSubmit({ onSuccess });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitFeedback(username, feedback);
  };

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-4">
        <h2 className="text-xs font-black mb-1 text-sky-500 uppercase tracking-[0.3em] font-inter">
          {t('shapeTheFuture') || 'SHAPE THE FUTURE'}
        </h2>
        <h3 className="text-2xl font-black mb-2 text-slate-800 dark:text-white font-inter">
          {t('whatFeaturesTitle') || 'What features do you want?'}
        </h3>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-200 dark:border-yellow-700/50">
          <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 font-inter">
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
          className={`w-full h-32 p-4 rounded-xl resize-none outline-none border focus:ring-2 focus:ring-sky-500 transition-all mb-4 font-inter ${themeClasses(theme, 'bg-slate-900 border-slate-700 placeholder-slate-600', 'bg-slate-50 border-slate-200 placeholder-slate-400')}`}
        />

        {turnstileSiteKey && feedback.trim() && (
          <div className="flex flex-col items-center mb-4 gap-2">
            {!turnstileErrored && (
              <Suspense fallback={null}>
                <LazyTurnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={token => {
                    setTurnstileToken(token);
                    setTurnstileErrored(false);
                  }}
                  onError={() => {
                    setTurnstileToken(null);
                    setTurnstileErrored(true);
                  }}
                  onExpire={() => {
                    setTurnstileToken(null);
                    setTurnstileErrored(false);
                  }}
                  options={{ theme, size: 'compact' }}
                />
              </Suspense>
            )}
            {turnstileErrored && (
              <div className="flex flex-col items-center gap-1 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg w-full text-center">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 font-inter">
                  Verification failed. Please try again.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTurnstileErrored(false);
                    setTurnstileToken(null);
                  }}
                  className="text-xs font-bold text-red-600 dark:text-red-400 underline underline-offset-2 font-inter"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 text-center animate-shake font-inter">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          {!isInline && (
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 font-inter ${themeClasses(theme, 'bg-slate-700 hover:bg-slate-600', 'bg-slate-100 hover:bg-slate-200')}`}
            >
              {t('cancel')}
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !feedback.trim() || (!!turnstileSiteKey && !turnstileToken)}
            className="w-full py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-600 active:scale-95 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-inter"
          >
            {isSubmitting ? 'Sending...' : t('submitFeedback') || 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
