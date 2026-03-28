/**
 * Lazy Sentry initialization.
 * Loads @sentry/react asynchronously after the app renders
 * to avoid blocking the critical rendering path.
 * Uses named imports to enable tree-shaking of unused Sentry modules.
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  const { init, browserTracingIntegration } = await import('@sentry/react');

  init({
    dsn,
    integrations: [browserTracingIntegration()],
    tracesSampleRate: 1.0,
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
    const { captureException: sentryCaptureException } = await import('@sentry/react');
    sentryCaptureException(error, { extra });
  } catch {
    // Sentry not available — silently ignore
  }
}
