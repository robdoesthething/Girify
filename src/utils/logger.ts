const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

class Logger {
  private level: number;

  constructor() {
    this.level = import.meta.env.MODE === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
  }

  debug(...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.INFO) {
      // eslint-disable-next-line no-console
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args);
    }
    // In production, send to error tracking service
    if (import.meta.env.MODE === 'production') {
      this.sendToErrorTracking(args);
    }
  }

  private sendToErrorTracking(_args: unknown[]): void {
    // Integrate with Sentry, LogRocket, etc.
    // Sentry.captureException(args[0]);
  }
}

export const logger = new Logger();
