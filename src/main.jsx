import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Debug: log to console
console.log('[main.jsx] Starting app initialization');

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('[main.jsx] App rendered successfully');
} catch (e) {
  console.error('[main.jsx] Failed to render:', e);
  document.getElementById('root').innerHTML =
    `<div style="padding: 20px; color: red;">Error: ${e.message}</div>`;
}
