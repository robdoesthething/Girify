import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Debug: log to console
// eslint-disable-next-line no-console
console.log(`[Girify] App initialized. Mode: ${import.meta.env.MODE}`);
// eslint-disable-next-line no-console
console.log('[Girify] Current user agent:', navigator.userAgent);

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  // eslint-disable-next-line no-console
  console.log('[main.jsx] App rendered successfully');
} catch (e) {
  console.error('[main.jsx] Failed to render:', e);
  document.getElementById('root').innerHTML =
    `<div style="padding: 20px; color: red;">Error: ${e.message}</div>`;
}
