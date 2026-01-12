import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { logger } from './utils/logger';

// Debug: log to console
logger.info(`[Girify] App initialized. Mode: ${import.meta.env.MODE}`);
logger.info('[Girify] Current user agent:', navigator.userAgent);

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  logger.info('[main.jsx] App rendered successfully');
} catch (e) {
  logger.error('[main.jsx] Failed to render:', e);
  document.getElementById('root').innerHTML =
    `<div style="padding: 20px; color: red;">Error: ${e.message}</div>`;
}
