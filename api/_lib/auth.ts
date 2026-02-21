/**
 * Supabase JWT authentication utilities for server-side verification
 */

import { createHmac } from 'crypto';
import { BEARER_PREFIX, BEARER_PREFIX_LENGTH } from './constants';
import type { FirebaseUser } from './types';

export interface AuthExtractionResult {
  token?: string;
  error?: string;
}

/**
 * Extract Bearer token from authorization header
 * @param authHeader Authorization header value
 * @returns Extracted token or error
 */
export function extractBearerToken(authHeader?: string): AuthExtractionResult {
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return { error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(BEARER_PREFIX_LENGTH);
  if (!token) {
    return { error: 'Empty token' };
  }

  return { token };
}

/**
 * Base64url-decode a string
 */
function base64urlDecode(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

/**
 * Verify a Supabase JWT using the SUPABASE_JWT_SECRET.
 * Returns the decoded user info (uid from `sub` claim, email).
 *
 * This replaces Firebase Admin SDK verification — no external dependency needed.
 */
export async function verifySupabaseToken(token: string): Promise<FirebaseUser> {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('[Auth] SUPABASE_JWT_SECRET environment variable not set');
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

    // Verify signature (HS256)
    const expectedSignature = createHmac('sha256', jwtSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (expectedSignature !== signatureB64) {
      throw new Error('Invalid JWT signature');
    }

    // Decode payload
    const payload = JSON.parse(base64urlDecode(payloadB64));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    // Check role
    if (payload.role !== 'authenticated') {
      throw new Error('Invalid token role');
    }

    return {
      uid: payload.sub,
      email: payload.email,
      displayName: payload.user_metadata?.full_name || payload.user_metadata?.name,
    };
  } catch (error) {
    console.error('[Auth] Error verifying Supabase token:', error);
    throw new Error('Invalid or expired authentication token');
  }
}

/**
 * @deprecated Use verifySupabaseToken instead. Kept as alias for backwards compatibility.
 */
export const verifyFirebaseToken = verifySupabaseToken;
