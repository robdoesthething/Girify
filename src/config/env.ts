/**
 * Central typed access to Vite environment variables.
 * Read import.meta.env here only — everywhere else imports from this module.
 */

export const env = {
  siteUrl: import.meta.env.VITE_SITE_URL as string | undefined,
  // Required — validated at startup by utils/envValidation (typed string for ergonomics)
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  // NOTE: Upstash Redis is server-only (api/_lib/rate-limit.ts uses
  // non-prefixed UPSTASH_* vars). Never add VITE_UPSTASH_* vars here —
  // Vite inlines VITE_ vars into the client bundle, exposing the token.
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
} as const;
