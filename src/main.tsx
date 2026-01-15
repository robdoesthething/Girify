import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { assertEnvValid } from './utils/envValidation';
import { logger } from './utils/logger';

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
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
    logger.info('[main.tsx] App rendered successfully');
  } catch (e: unknown) {
    logger.error('[main.tsx] Failed to render:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error: ${errorMessage}</div>`;
  }
} else {
  logger.error('[main.tsx] Root element not found');
}
