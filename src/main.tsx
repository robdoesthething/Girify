import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { logger } from './utils/logger';

// Debug: log to console
logger.info(`[Girify] App initialized. Mode: ${import.meta.env.MODE}`);
logger.info('[Girify] Current user agent:', navigator.userAgent);

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    logger.info('[main.tsx] App rendered successfully');
  } catch (e: any) {
    logger.error('[main.tsx] Failed to render:', e);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error: ${e.message}</div>`;
  }
} else {
  logger.error('[main.tsx] Root element not found');
}
