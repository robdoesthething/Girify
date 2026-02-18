import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SentryErrorBoundary } from './components/SentryErrorBoundary';
import './index.css';
import { assertEnvValid } from './utils/envValidation';
import { logger } from './utils/logger';
import { initSentry } from './utils/sentry';
import { reportWebVitals } from './utils/webVitals';

// Validate environment variables on startup
try {
  assertEnvValid();
} catch (e) {
  logger.error('[Girify] Environment validation failed:', e);
}

// Debug: log to console
logger.info(`[Girify] App initialized. Mode: ${import.meta.env.MODE}`);
logger.info('[Girify] Current user agent:', navigator.userAgent);

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <SentryErrorBoundary>
          <App />
        </SentryErrorBoundary>
      </StrictMode>
    );
    logger.info('[main.tsx] App rendered successfully');

    // Initialize Sentry after render (non-blocking)
    initSentry();

    // Report Core Web Vitals
    reportWebVitals();
  } catch (e: unknown) {
    logger.error('[main.tsx] Failed to render:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 20px; color: red;';
    errorDiv.textContent = `Error: ${errorMessage}`;
    rootElement.replaceChildren(errorDiv);
  }
} else {
  logger.error('[main.tsx] Root element not found');
}
