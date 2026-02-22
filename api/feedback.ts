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
