/**
 * Central typed access to Vite environment variables.
 * Read import.meta.env here only — everywhere else imports from this module.
 */

export const env = {
  siteUrl: import.meta.env.VITE_SITE_URL as string | undefined,
  // Required — validated at startup by utils/envValidation (typed string for ergonomics)
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  upstashRedisRestUrl: import.meta.env.VITE_UPSTASH_REDIS_REST_URL as string,
  upstashRedisRestToken: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN as string,
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
} as const;
