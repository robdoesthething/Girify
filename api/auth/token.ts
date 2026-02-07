/**
 * Custom JWT Token Minting Endpoint
 * POST /api/auth/token
 *
 * Verifies a Firebase ID token and mints a Supabase-compatible JWT
 * so that RLS policies can use `(current_setting('request.jwt.claims')::json ->> 'sub')`
 * to enforce ownership checks with the Firebase UID.
 */

import { createHmac } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractBearerToken, verifyFirebaseToken } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import { handleError } from '../_lib/errorHandler';
import { checkRateLimit } from '../_lib/rate-limit';
import { ErrorResponses, sendSuccess } from '../_lib/response';

/** Rate limit: 10 requests per minute per UID+IP */
const RATE_LIMIT_CONFIG = {
  maxAttempts: 10,
  windowMs: 60 * 1000,
};

/** JWT lifetime: 1 hour */
const JWT_EXPIRY_SECONDS = 3600;

/**
 * Base64url-encode a buffer or string
 */
function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Sign a Supabase-compatible HS256 JWT
 */
function signSupabaseJWT(
  firebaseUid: string,
  secret: string
): { token: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + JWT_EXPIRY_SECONDS;

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      sub: firebaseUid,
      role: 'authenticated',
      aud: 'authenticated',
      iat: now,
      exp: expiresAt,
    })
  );

  const signature = base64url(createHmac('sha256', secret).update(`${header}.${payload}`).digest());

  return { token: `${header}.${payload}.${signature}`, expiresAt };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(res, req.headers.origin, req.method || 'GET')) {
    return;
  }

  if (req.method !== 'POST') {
    ErrorResponses.METHOD_NOT_ALLOWED(res);
    return;
  }

  try {
    // 1. Extract and verify Firebase token
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

    // 2. Rate limit (x-real-ip is set by Vercel edge, not spoofable by clients)
    const clientIp = req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `auth-token:${user.uid}:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG);

    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxAttempts.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());

    if (!rateLimit.allowed) {
      console.warn(`[API] Rate limit exceeded for auth-token: ${user.uid} from ${clientIp}`);
      ErrorResponses.RATE_LIMIT_EXCEEDED(res);
      return;
    }

    // 3. Mint Supabase JWT
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('[API] SUPABASE_JWT_SECRET not configured');
      handleError(res, new Error('Server configuration error'), 'jwt-secret check');
      return;
    }

    const { token, expiresAt } = signSupabaseJWT(user.uid, jwtSecret);

    console.log(`[API] Minted Supabase JWT for user ${user.uid}`);
    sendSuccess(res, { token, expiresAt });
  } catch (error) {
    handleError(res, error, 'auth token minting');
  }
}
