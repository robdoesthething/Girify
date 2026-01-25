import type { VercelResponse } from '@vercel/node';
import { CORS_MAX_AGE_SECONDS } from './constants';

const ALLOWED_ORIGINS = [
  'https://girify.vercel.app',
  'http://localhost:5173', // Development
  'http://localhost:3000', // Vercel dev
];

export function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0]!,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': String(CORS_MAX_AGE_SECONDS),
  };
}

export function handleCors(
  res: VercelResponse,
  origin: string | undefined,
  method: string
): boolean {
  const headers = getCorsHeaders(origin);

  // Set headers
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight
  if (method === 'OPTIONS') {
    res.status(200).end();
    return true; // handled
  }

  return false; // not handled (proceed)
}
