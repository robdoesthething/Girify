import { useCallback, useRef, useState } from 'react';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { env } from '../config/env';

// Cloudflare real keys start with "0x". Test keys (1x/2x/3x) auto-resolve
// and show a "testing only" banner — skip Turnstile when a test key is in use.
export const turnstileSiteKey = env.turnstileSiteKey?.startsWith('0x')
  ? env.turnstileSiteKey
  : undefined;

interface UseFeedbackSubmitOptions {
  onSuccess?: () => void;
}

interface UseFeedbackSubmitResult {
  submitFeedback: (username: string, feedback: string) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
  turnstileToken: string | null;
  setTurnstileToken: (token: string | null) => void;
  turnstileRef: React.MutableRefObject<TurnstileInstance | undefined>;
}

export function useFeedbackSubmit({
  onSuccess,
}: UseFeedbackSubmitOptions = {}): UseFeedbackSubmitResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  const submitFeedback = useCallback(
    async (username: string, feedback: string): Promise<boolean> => {
      if (!feedback.trim() || (turnstileSiteKey && !turnstileToken)) {
        return false;
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

        onSuccess?.();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        setTurnstileToken(null);
        turnstileRef.current?.reset();
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSuccess, turnstileToken]
  );

  return { submitFeedback, isSubmitting, error, turnstileToken, setTurnstileToken, turnstileRef };
}
