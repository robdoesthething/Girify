# Design: Cloudflare Turnstile CAPTCHA for Feedback Forms

**Date:** 2026-02-22
**Status:** Approved

## Problem

The feedback form has two entry points with client-side-only CAPTCHA:

- `FeedbackScreen.tsx` — math sum (`a + b = ?`), trivially bypassable
- `FeedbackForm.tsx` — canvas-rendered image CAPTCHA, also client-side only

Neither provides real bot protection because validation happens in the browser, where it can be inspected and bypassed.

## Solution

Replace both CAPTCHAs with **Cloudflare Turnstile** (invisible challenge) backed by **server-side token verification** via a new Vercel API endpoint.

## Architecture

```
Client (FeedbackScreen / FeedbackForm)
  → Turnstile widget renders, returns a token on success
  → Form POST /api/feedback { username, text, turnstileToken }
  → API verifies token with Cloudflare siteverify endpoint
  → If valid, API inserts into Supabase via service_role key
  → Returns { success: true } or error
```

## Components

### Modified: `src/components/FeedbackScreen.tsx`

- Remove `captcha` state, `captchaAnswer` input field, and math validation logic
- Add `@marsidev/react-turnstile` `<Turnstile>` widget
- Track `turnstileToken` in state (string | null)
- Disable submit button until token is set
- On submit: POST to `/api/feedback` instead of calling `submitFeedback()` directly

### Modified: `src/components/FeedbackForm.tsx`

- Remove canvas CAPTCHA: `useEffect` drawing routine, `<canvas>` element, noise lines, refresh button, `CAPTCHA_*` constants, captcha state from reducer
- Add same `<Turnstile>` widget + `turnstileToken` state
- On submit: POST to `/api/feedback` instead of calling `submitFeedback()` directly

### New: `api/feedback.ts`

Vercel serverless function.

```
POST /api/feedback
Body: { username: string, text: string, turnstileToken: string }

1. Validate body fields present
2. POST https://challenges.cloudflare.com/turnstile/v0/siteverify
   with: secret=TURNSTILE_SECRET_KEY, response=turnstileToken, remoteip=req.ip
3. If success: false → return 400 { error: "CAPTCHA verification failed" }
4. Insert into Supabase feedback table using service_role key
5. Return 200 { success: true }
```

Uses the existing `api/_lib/` pattern (supabase admin client, rate limiting).

## Package

**`@marsidev/react-turnstile`** — de facto React wrapper for Cloudflare Turnstile.

- ~3KB gzipped
- ~100k weekly downloads
- No peer dependency conflicts with React 19

## Environment Variables

| Variable                  | Location                    | Purpose                                            |
| ------------------------- | --------------------------- | -------------------------------------------------- |
| `VITE_TURNSTILE_SITE_KEY` | Vercel + `.env.development` | Public key — used by widget in browser             |
| `TURNSTILE_SECRET_KEY`    | Vercel only (never client)  | Secret key — used by API endpoint to verify tokens |

`SUPABASE_SERVICE_ROLE_KEY` is assumed to already exist in Vercel for existing API routes.

## What Is Not Changed

- `src/services/db/feedback.ts` — kept as-is for admin operations (`getFeedbackList`, `approveFeedback`, etc.)
- `src/components/admin/AdminFeedback.tsx` — no changes
- Supabase RLS policies on the `feedback` table — unchanged (service_role bypasses RLS anyway)
- `FeedbackModal.tsx` — no changes (wrapper only)
