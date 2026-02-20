// Redis is server-side only. Client code must not use this directly.
// All Redis operations are handled via Vercel API functions in api/_lib/rate-limit.ts
// which use process.env.UPSTASH_REDIS_REST_URL (no VITE_ prefix, never bundled).
export const redis = null;
