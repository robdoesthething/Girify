# Cloudflare Turnstile CAPTCHA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace client-side CAPTCHA in both feedback forms with Cloudflare Turnstile, verified server-side via a new Vercel API endpoint.

**Architecture:** Browser renders an invisible Turnstile widget that returns a signed token on success. The form POSTs `{ username, text, turnstileToken }` to a new `api/feedback.ts` endpoint that verifies the token with Cloudflare's siteverify API before writing to Supabase via service_role.

**Tech Stack:** `@marsidev/react-turnstile`, Vercel serverless functions (`@vercel/node`), Cloudflare Turnstile siteverify API, Supabase service_role client (already in `api/_lib/supabase.ts`).

---

### Task 1: Install package and add env vars

**Files:**

- Modify: `package.json` (via npm install)
- Modify: `.env.template`
- Modify: `.env.development` (local dev key only)

**Step 1: Install the Turnstile React wrapper**

```bash
npm install @marsidev/react-turnstile
```

Expected: package added to `dependencies` in `package.json`.

**Step 2: Add env var placeholders to `.env.template`**

Find the existing env vars block and append:

```bash
# Cloudflare Turnstile (https://dash.cloudflare.com → Turnstile)
VITE_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

**Step 3: Add Turnstile test keys to `.env.development`**

Cloudflare provides permanent test keys that always pass:

```bash
# Cloudflare Turnstile — test keys (always pass, use in local dev only)
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

These are Cloudflare's official test keys. They will always pass siteverify in dev. Do NOT use them in production.

**Step 4: Commit**

```bash
git add package.json package-lock.json .env.template
git commit -m "chore: install react-turnstile and add env var placeholders"
```

---

### Task 2: Add `insertFeedbackRecord` to `api/_lib/supabase.ts`

**Files:**

- Modify: `api/_lib/supabase.ts`

The existing file exports `promoteUserToAdmin` and `isUserAdmin` using a private `getSupabaseAdmin()`. Add a feedback insert function following the same pattern.

**Step 1: Write the failing test**

Create `api/__tests__/feedback.test.ts`:

```typescript
/**
 * Tests for feedback API endpoint
 * @vitest-environment node
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../_lib/supabase', () => ({
  insertFeedbackRecord: vi.fn(),
}));

// Mock fetch for Turnstile verification
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { insertFeedbackRecord } from '../_lib/supabase';
import handler from '../feedback';

function createMockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {
      origin: 'https://girify.vercel.app',
      'x-real-ip': '1.2.3.4',
    },
    body: {
      username: 'testuser',
      text: 'Great game!',
      turnstileToken: 'valid-token',
    },
    socket: { remoteAddress: '1.2.3.4' },
    ...overrides,
  } as unknown as VercelRequest;
}

function createMockRes(): VercelResponse {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res as unknown as VercelResponse;
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it('returns 405 for non-POST methods', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 400 when body fields are missing', async () => {
    const req = createMockReq({ body: { username: 'test' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when Turnstile verification fails', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: false }),
    });
    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(insertFeedbackRecord).not.toHaveBeenCalled();
  });

  it('returns 200 and inserts feedback when token is valid', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    vi.mocked(insertFeedbackRecord).mockResolvedValueOnce({ success: true });

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);

    expect(insertFeedbackRecord).toHaveBeenCalledWith('testuser', 'Great game!');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when Supabase insert fails', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    vi.mocked(insertFeedbackRecord).mockResolvedValueOnce({
      success: false,
      error: 'DB error',
    });

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
```

**Step 2: Run test to confirm it fails**

```bash
npm test -- api/__tests__/feedback.test.ts --run
```

Expected: FAIL — `Cannot find module '../feedback'`

**Step 3: Add `insertFeedbackRecord` to `api/_lib/supabase.ts`**

Append to the end of `api/_lib/supabase.ts`:

```typescript
/**
 * Insert a feedback record
 * @param username Normalized username (no @ prefix)
 * @param text Feedback text
 */
export async function insertFeedbackRecord(
  username: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('feedback').insert({ username, text });
    if (error) {
      console.error('[Supabase] feedback insert error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error('[Supabase] unexpected error inserting feedback:', error);
    return { success: false, error: 'Unexpected error' };
  }
}
```

**Step 4: Create `api/feedback.ts`**

```typescript
/**
 * Feedback Submission API Endpoint
 * POST /api/feedback
 *
 * Verifies a Cloudflare Turnstile token server-side, then saves
 * the feedback to Supabase via the service_role key.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib/cors';
import { handleError } from './_lib/errorHandler';
import { ErrorResponses, sendSuccess } from './_lib/response';
import { insertFeedbackRecord } from './_lib/supabase';
import { validateRequestBody, ValidationSchema } from './_lib/validation';

const FEEDBACK_SCHEMA: ValidationSchema = {
  username: { type: 'string', required: true, minLength: 1, maxLength: 50 },
  text: { type: 'string', required: true, minLength: 1, maxLength: 2000 },
  turnstileToken: { type: 'string', required: true },
};

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(res, req.headers.origin, req.method || 'GET')) return;

  if (req.method !== 'POST') {
    ErrorResponses.METHOD_NOT_ALLOWED(res);
    return;
  }

  try {
    const validation = validateRequestBody(req.body, FEEDBACK_SCHEMA);
    if (!validation.valid) {
      ErrorResponses.BAD_REQUEST(res, validation.error || 'Invalid request');
      return;
    }

    const { username, text, turnstileToken } = req.body as {
      username: string;
      text: string;
      turnstileToken: string;
    };

    // Verify Turnstile token with Cloudflare
    const ip = req.headers['x-real-ip'] || req.socket.remoteAddress || '';
    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY || '',
        response: turnstileToken,
        remoteip: String(ip),
      }),
    });
    const verifyData = (await verifyRes.json()) as { success: boolean };

    if (!verifyData.success) {
      console.warn('[API] Turnstile verification failed');
      ErrorResponses.BAD_REQUEST(res, 'CAPTCHA verification failed');
      return;
    }

    // Normalize username (strip @ prefix, lowercase)
    const normalizedUsername = username.toLowerCase().replace(/^@/, '');

    const result = await insertFeedbackRecord(normalizedUsername, text);
    if (!result.success) {
      ErrorResponses.SERVER_ERROR(res, 'Failed to save feedback');
      return;
    }

    console.log(`[API] Feedback submitted by ${normalizedUsername}`);
    sendSuccess(res);
  } catch (error) {
    handleError(res, error, 'feedback submission');
  }
}
```

**Step 5: Run tests to confirm they pass**

```bash
npm test -- api/__tests__/feedback.test.ts --run
```

Expected: all 5 tests PASS.

**Step 6: Commit**

```bash
git add api/_lib/supabase.ts api/feedback.ts api/__tests__/feedback.test.ts
git commit -m "feat(api): add feedback endpoint with cloudflare turnstile verification"
```

---

### Task 3: Update `FeedbackScreen.tsx`

**Files:**

- Modify: `src/components/FeedbackScreen.tsx`

**Step 1: Replace the component**

Remove the math captcha state, validation logic, and UI. Add the Turnstile widget and change the submit handler to POST to `/api/feedback`.

Replace the entire file content with:

```typescript
import { Turnstile } from '@marsidev/react-turnstile';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !turnstileToken) return;

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
                        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                        onSuccess={setTurnstileToken}
                        onError={() => setTurnstileToken(null)}
                        onExpire={() => setTurnstileToken(null)}
                        options={{ theme: theme === 'dark' ? 'dark' : 'light' }}
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
```

**Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/FeedbackScreen.tsx
git commit -m "feat(feedback): replace math captcha with cloudflare turnstile in FeedbackScreen"
```

---

### Task 4: Update `FeedbackForm.tsx`

**Files:**

- Modify: `src/components/FeedbackForm.tsx`

**Step 1: Replace the component**

Remove all canvas CAPTCHA logic (constants, `generateCaptcha`, canvas drawing, `useCallback`, `useEffect`, reducer captcha fields). Add Turnstile widget and POST to `/api/feedback`.

Replace the entire file content with:

```typescript
import { Turnstile } from '@marsidev/react-turnstile';
import React, { useReducer, useState } from 'react';
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

  const { feedback, isSubmitting, error } = formState;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !turnstileToken) return;

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
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
            options={{ theme: theme === 'dark' ? 'dark' : 'light', size: 'compact' }}
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
```

**Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

**Step 3: Run linter**

```bash
npm run lint
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/components/FeedbackForm.tsx
git commit -m "feat(feedback): replace canvas captcha with cloudflare turnstile in FeedbackForm"
```

---

### Task 5: Verify and add Vercel env vars

**Step 1: Build to confirm no bundler errors**

```bash
npm run build
```

Expected: build succeeds with no errors.

**Step 2: Add env vars to Vercel**

In the Vercel dashboard (or via CLI):

```bash
# Get these from https://dash.cloudflare.com → Turnstile → your site
vercel env add VITE_TURNSTILE_SITE_KEY production
vercel env add TURNSTILE_SECRET_KEY production
```

The `SUPABASE_SERVICE_ROLE_KEY` and `VITE_SUPABASE_URL` should already be set from existing API routes.

**Step 3: Manual smoke test in dev**

```bash
npm run dev
```

- Navigate to `/feedback`
- The Turnstile widget should appear (small Cloudflare badge)
- Write feedback text → submit button becomes active once widget verifies
- Submit → check Supabase Table Editor → `feedback` table should have a new row
- Check browser Network tab → POST to `/api/feedback` should return `{ success: true }`

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(feedback): address any issues found during smoke test"
```
