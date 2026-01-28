import { DEBUG } from './constants';

export const debugLog = (msg: string) => {
  try {
    const logs = JSON.parse(localStorage.getItem('girify_debug_logs') || '[]');
    logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    if (logs.length > DEBUG.MAX_LOGS) {
      logs.shift();
    }
    localStorage.setItem('girify_debug_logs', JSON.stringify(logs));
  } catch (e) {
    console.error(e);
  }
};
