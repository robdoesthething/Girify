import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import React, { useReducer, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { themeClasses } from '../utils/themeUtils';

interface FeedbackFormProps {
  username: string;
  onSuccess: () => void;
  onClose: () => void;
  isInline: boolean;
}

interface FormState {
  feedback: string;
  isSubmitting: boolean;
  error: string | null;
}

type FormAction =
  | { type: 'SET_FEEDBACK'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ username, onSuccess, onClose, isInline }) => {
  const { theme, t } = useTheme();
  const [formState, dispatch] = useReducer(formReducer, {
    feedback: '',
    isSubmitting: false,
    error: null,
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  const { feedback, isSubmitting, error } = formState;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !turnstileToken) {
      return;
    }

    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

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

      onSuccess();
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
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
          onChange={e => dispatch({ type: 'SET_FEEDBACK', payload: e.target.value })}
          placeholder={t('feedbackPlaceholderFeatures') || 'I wish the game had...'}
          className={`w-full h-32 p-4 rounded-xl resize-none outline-none border focus:ring-2 focus:ring-sky-500 transition-all mb-4 font-inter ${themeClasses(theme, 'bg-slate-900 border-slate-700 placeholder-slate-600', 'bg-slate-50 border-slate-200 placeholder-slate-400')}`}
        />

        <div className="flex justify-center mb-4">
          <Turnstile
            ref={turnstileRef}
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''}
            onSuccess={setTurnstileToken}
            onError={() => {
              setTurnstileToken(null);
              turnstileRef.current?.reset();
            }}
            onExpire={() => setTurnstileToken(null)}
            options={{ theme, size: 'compact' }}
          />
        </div>

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
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors font-inter ${themeClasses(theme, 'bg-slate-700 hover:bg-slate-600', 'bg-slate-100 hover:bg-slate-200')}`}
            >
              {t('cancel')}
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !feedback.trim() || !turnstileToken}
            className="w-full py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            {isSubmitting ? 'Sending...' : t('submitFeedback') || 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
