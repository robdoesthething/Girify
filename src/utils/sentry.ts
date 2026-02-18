/**
 * Lazy Sentry initialization.
 * Loads @sentry/react asynchronously after the app renders
 * to avoid blocking the critical rendering path.
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  const Sentry = await import('@sentry/react');

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

/**
 * Lazily capture an exception to Sentry (no-op if Sentry hasn't loaded).
 */
export async function captureException(
  error: Error,
  extra?: Record<string, unknown>
): Promise<void> {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.captureException(error, { extra });
  } catch {
    // Sentry not available — silently ignore
  }
}
