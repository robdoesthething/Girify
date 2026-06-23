/**
 * Feedback Submission API Endpoint
 * POST /api/feedback
 *
 * Verifies a Cloudflare Turnstile token server-side, then saves
 * the feedback to Supabase via the service_role key.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractBearerToken, verifySupabaseToken } from './_lib/auth';
import { handleCors } from './_lib/cors';
import { handleError } from './_lib/errorHandler';
import { checkRateLimit } from './_lib/rate-limit';
import { ErrorResponses, sendSuccess } from './_lib/response';
import { getUsernameByUid, insertFeedbackRecord } from './_lib/supabase';
import { validateRequestBody, ValidationSchema } from './_lib/validation';

const FEEDBACK_SCHEMA: ValidationSchema = {
  username: { type: 'string', required: false, minLength: 1, maxLength: 50 },
  text: { type: 'string', required: true, minLength: 1, maxLength: 2000 },
  turnstileToken: { type: 'string', required: true },
};

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const FEEDBACK_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
};

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

    const {
      username: bodyUsername,
      text,
      turnstileToken,
    } = req.body as {
      username?: string;
      text: string;
      turnstileToken: string;
    };

    // Prefer username derived from verified auth token; fall back to body value
    let resolvedUsername = bodyUsername ?? 'anonymous';
    const { token: authToken } = extractBearerToken(req.headers.authorization);
    if (authToken) {
      try {
        const verified = await verifySupabaseToken(authToken);
        const dbUsername = await getUsernameByUid(verified.uid);
        if (dbUsername) {
          resolvedUsername = dbUsername;
        }
      } catch {
        // Token invalid or expired — proceed with body username
      }
    }

    const clientIp = String(req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown');
    const rateLimitKey = `feedback:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitKey, FEEDBACK_RATE_LIMIT);

    res.setHeader('X-RateLimit-Limit', FEEDBACK_RATE_LIMIT.maxAttempts.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());

    if (!rateLimit.allowed) {
      console.warn(`[API] Feedback rate limit exceeded from ${clientIp}`);
      ErrorResponses.RATE_LIMIT_EXCEEDED(res);
      return;
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('[API] TURNSTILE_SECRET_KEY is not configured');
      ErrorResponses.SERVER_ERROR(res, 'Server configuration error');
      return;
    }

    // Verify Turnstile token with Cloudflare
    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: turnstileToken,
        remoteip: clientIp,
      }),
    });
    const verifyData = (await verifyRes.json()) as { success: boolean };

    if (!verifyData.success) {
      console.warn('[API] Turnstile verification failed');
      ErrorResponses.BAD_REQUEST(res, 'CAPTCHA verification failed');
      return;
    }

    // Normalize username (strip @ prefix, lowercase)
    const normalizedUsername = resolvedUsername.toLowerCase().replace(/^@/, '');

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
