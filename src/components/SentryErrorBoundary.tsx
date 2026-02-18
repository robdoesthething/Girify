import React, { Component, ReactNode } from 'react';
import { captureException } from '../utils/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary that lazily reports to Sentry.
 * Does not import @sentry/react synchronously.
 */
export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureException(error, { componentStack: errorInfo.componentStack });
    console.error('Uncaught error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
          <h1 className="text-2xl font-bold mb-4 text-rose-600">Something went wrong</h1>
          We&apos;ve been notified and are working to fix this.
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
