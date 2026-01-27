const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export class Logger {
  private level: number;
  private context?: string;

  constructor(context?: string) {
    this.level = import.meta.env.MODE === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    this.context = context;
  }

  private formatMessage(args: unknown[]) {
    if (this.context) {
      return [`[${this.context}]`, ...args];
    }
    return args;
  }

  debug(...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG]', ...this.formatMessage(args));
    }
  }

  info(...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.INFO) {
      // eslint-disable-next-line no-console
      console.info('[INFO]', ...this.formatMessage(args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...this.formatMessage(args));
    }
  }

  error(...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...this.formatMessage(args));
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
export const createLogger = (context: string) => new Logger(context);
