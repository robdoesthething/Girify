const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    this.level = import.meta.env.MODE === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
  }

  debug(...args) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args) {
    if (this.level <= LOG_LEVELS.INFO) {
      // eslint-disable-next-line no-console
      console.info('[INFO]', ...args);
    }
  }

  warn(...args) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args);
    }
    // In production, send to error tracking service
    if (import.meta.env.MODE === 'production') {
      this.sendToErrorTracking(args);
    }
  }

  sendToErrorTracking(_args) {
    // Integrate with Sentry, LogRocket, etc.
    // Sentry.captureException(args[0]);
  }
}

export const logger = new Logger();
