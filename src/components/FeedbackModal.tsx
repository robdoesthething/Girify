import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { submitFeedback } from '../utils/social';
import { themeClasses, themeValue } from '../utils/themeUtils';

// Constants
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CAPTCHA_LENGTH = 6;
const CAPTCHA_NOISE_COUNT = 5;
const CAPTCHA_WIDTH = 120;
const CAPTCHA_HEIGHT = 40;
const CAPTCHA_FONT = 'bold 24px monospace';
const CAPTCHA_X_START = 20;
const CAPTCHA_X_STEP = 16;
const CAPTCHA_Y_RANGE = 10;
const CAPTCHA_Y_OFFSET = 5;
const CAPTCHA_Y_BASE = 20;
const CAPTCHA_ANGLE_FACTOR = 0.4;
const CAPTCHA_ANGLE_OFFSET = 0.2;
const CAPTCHA_LINE_WIDTH = 1;
const CAPTCHA_REFRESH_DELAY = 100;
const SUBMIT_DELAY = 2000;

interface FeedbackModalProps {
  username: string;
  onClose: () => void;
  isInline?: boolean;
}

interface FeedbackFormProps {
  username: string;
  onSuccess: () => void;
  onClose: () => void;
  isInline: boolean;
}

const generateCaptcha = (canvas: HTMLCanvasElement, theme: string): string => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = themeValue(theme as 'light' | 'dark', '#1e293b', '#f1f5f9');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Generate random string
  let str = '';
  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    str += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
  }

  // Draw text
  ctx.font = CAPTCHA_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add noise and random positioning
  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    const char = str[i];
    ctx.save();
    // Random position offsets
    const x = CAPTCHA_X_START + i * CAPTCHA_X_STEP;
    const y = CAPTCHA_Y_BASE + (Math.random() * CAPTCHA_Y_RANGE - CAPTCHA_Y_OFFSET);
    const angle = Math.random() * CAPTCHA_ANGLE_FACTOR - CAPTCHA_ANGLE_OFFSET;

    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = themeValue(theme as 'light' | 'dark', '#38bdf8', '#0284c7');
    ctx.fillText(char || '', 0, 0);
    ctx.restore();
  }

  // Add lines/dots for noise
  for (let i = 0; i < CAPTCHA_NOISE_COUNT; i++) {
    ctx.beginPath();
    ctx.strokeStyle = themeValue(theme as 'light' | 'dark', '#ffffff20', '#00000010');
    ctx.lineWidth = CAPTCHA_LINE_WIDTH;
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  return str;
};

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

interface FormState {
  feedback: string;
  isSubmitting: boolean;
  captchaString: string;
  captchaAnswer: string;
  error: string | null;
}

type FormAction =
  | { type: 'SET_FEEDBACK'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_CAPTCHA_STRING'; payload: string }
  | { type: 'SET_CAPTCHA_ANSWER'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_CAPTCHA_STRING':
      return { ...state, captchaString: action.payload };
    case 'SET_CAPTCHA_ANSWER':
      return { ...state, captchaAnswer: action.payload };
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
    captchaString: '',
    captchaAnswer: '',
    error: null,
  });

  const { feedback, isSubmitting, captchaString, captchaAnswer, error } = formState;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDrawCaptcha = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const str = generateCaptcha(canvas, theme);
      dispatch({ type: 'SET_CAPTCHA_STRING', payload: str });
    }
  }, [theme]);

  useEffect(() => {
    // Initial draw
    const timer = setTimeout(handleDrawCaptcha, CAPTCHA_REFRESH_DELAY);
    return () => clearTimeout(timer);
  }, [handleDrawCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      return;
    }

    if (captchaAnswer.toUpperCase() !== captchaString) {
      dispatch({ type: 'SET_ERROR', payload: 'Incorrect code. Please try again.' });
      handleDrawCaptcha();
      dispatch({ type: 'SET_CAPTCHA_ANSWER', payload: '' });
      return;
    }
    dispatch({ type: 'SET_ERROR', payload: null });

    dispatch({ type: 'SET_SUBMITTING', payload: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (submitFeedback as any)(username, feedback || '');
    dispatch({ type: 'SET_SUBMITTING', payload: false });
    onSuccess();
  };

  return (
    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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

        {/* Canvas Captcha */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <canvas
              ref={canvasRef}
              width={CAPTCHA_WIDTH}
              height={CAPTCHA_HEIGHT}
              className="rounded-md cursor-pointer bg-white dark:bg-slate-800 shadow-inner"
              onClick={handleDrawCaptcha}
              title="Click to refresh"
            />
            <button
              type="button"
              onClick={handleDrawCaptcha}
              className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
              title="Refresh Captcha"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <input
              type="text"
              value={captchaAnswer}
              onChange={e => dispatch({ type: 'SET_CAPTCHA_ANSWER', payload: e.target.value })}
              placeholder="Type Code"
              className="flex-1 p-2 rounded-md border outline-none focus:ring-2 focus:ring-sky-500 uppercase tracking-widest text-center font-bold dark:bg-slate-800 dark:border-slate-600 dark:text-white font-inter"
              maxLength={CAPTCHA_LENGTH}
            />
          </div>
          <p className="text-[10px] text-center opacity-40 font-inter">
            {t('captchaHint') || 'Click image to refresh if unreadable'}
          </p>
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
            disabled={isSubmitting || !feedback.trim() || !captchaAnswer}
            className={`w-full py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-inter`}
          >
            {isSubmitting ? 'Sending...' : t('submitFeedback') || 'Submit Feedback'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

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
            <FeedbackForm
              username={username}
              onSuccess={handleSuccess}
              onClose={onClose}
              isInline={isInline}
            />
          ) : (
            <FeedbackSuccess t={t} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;
