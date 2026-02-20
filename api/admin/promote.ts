/**
 * Admin Promotion API Endpoint
 * POST /api/admin/promote
 *
 * Securely promotes a user to admin status after verifying:
 * 1. Valid Firebase authentication token
 * 2. Rate limiting compliance
 * 3. Correct admin secret key
 * 4. Supabase admin table update
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractBearerToken, verifyFirebaseToken } from '../_lib/auth';
import { RATE_LIMIT_DEFAULTS, USERNAME_CONSTRAINTS } from '../_lib/constants';
import { handleCors } from '../_lib/cors';
import { handleError } from '../_lib/errorHandler';
import { checkRateLimit } from '../_lib/rate-limit';
import { ErrorResponses, sendSuccess } from '../_lib/response';
import { promoteUserToAdmin } from '../_lib/supabase';
import type { AdminPromoteRequest } from '../_lib/types';
import { validateRequestBody, ValidationSchema } from '../_lib/validation';

/**
 * Rate limiting configuration
 * 5 attempts per 15 minutes per user+IP combination
 */
const RATE_LIMIT_CONFIG = {
  maxAttempts: RATE_LIMIT_DEFAULTS.MAX_ATTEMPTS,
  windowMs: RATE_LIMIT_DEFAULTS.WINDOW_MS,
};

/**
 * Validation schema for promotion request
 */
const PROMOTE_SCHEMA: ValidationSchema = {
  adminKey: { type: 'string', required: true },
  username: {
    type: 'string',
    required: true,
    minLength: USERNAME_CONSTRAINTS.MIN_LENGTH,
    maxLength: USERNAME_CONSTRAINTS.MAX_LENGTH,
  },
};

/**
 * Main handler for admin promotion endpoint
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(res, req.headers.origin, req.method || 'GET')) {
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    ErrorResponses.METHOD_NOT_ALLOWED(res);
    return;
  }

  try {
    // 1. Verify Firebase authentication token
    const authResult = extractBearerToken(req.headers.authorization);
    if (!authResult.token) {
      ErrorResponses.MISSING_AUTH_HEADER(res);
      return;
    }

    let user;
    try {
      user = await verifyFirebaseToken(authResult.token);
    } catch (error) {
      console.error('[API] Token verification failed:', error);
      ErrorResponses.INVALID_TOKEN(res);
      return;
    }

    // 2. Validate request body
    const validation = validateRequestBody(req.body, PROMOTE_SCHEMA);
    if (!validation.valid) {
      ErrorResponses.BAD_REQUEST(res, validation.error || 'Invalid request');
      return;
    }

    const { adminKey, username } = req.body as AdminPromoteRequest;

    // 3. Check rate limiting (x-real-ip is set by Vercel edge, not spoofable by clients)
    const clientIp = req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `admin-promote:${user.uid}:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxAttempts.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());

    if (!rateLimit.allowed) {
      console.warn(`[API] Rate limit exceeded for user ${user.uid} from ${clientIp}`);
      ErrorResponses.RATE_LIMIT_EXCEEDED(res);
      return;
    }

    // 4. Validate admin secret key
    const serverAdminKey = process.env.ADMIN_SECRET_KEY;
    if (!serverAdminKey) {
      console.error('[API] ADMIN_SECRET_KEY not configured');
      handleError(res, new Error('Server configuration error'), 'adminKey check');
      return;
    }

    // Use HMAC-SHA256 digests (fixed 32-byte output) so comparison is
    // constant-time and length-agnostic — no key-length oracle.
    const hmac = (k: string) => createHmac('sha256', 'girify-admin-key-compare').update(k).digest();
    const keysMatch = timingSafeEqual(hmac(adminKey), hmac(serverAdminKey));

    if (!keysMatch) {
      console.warn(`[API] Invalid admin key attempt by user ${user.uid} from ${clientIp}`);
      ErrorResponses.FORBIDDEN(res, 'Invalid admin key');
      return;
    }

    // 5. Promote user to admin in Supabase
    const promotionResult = await promoteUserToAdmin(user.uid, username);

    if (!promotionResult.success) {
      throw new Error(promotionResult.error || 'Failed to promote user');
    }

    // 6. Success - log and return
    console.log(`[API] Successfully promoted user ${user.uid} to admin`);

    sendSuccess(res, { uid: user.uid });
  } catch (error) {
    handleError(res, error, 'admin promotion');
  }
}
