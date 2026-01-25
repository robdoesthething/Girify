import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SentryErrorBoundary } from '../SentryErrorBoundary';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
}));

const ThrowError = () => {
  throw new Error('Test Error');
};

describe('SentryErrorBoundary', () => {
  // Console error suppression to keep test output clean
  const consoleError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = consoleError;
    vi.clearAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <SentryErrorBoundary>
        <div>Safe Content</div>
      </SentryErrorBoundary>
    );
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('renders error UI when an error occurs', () => {
    render(
      <SentryErrorBoundary>
        <ThrowError />
      </SentryErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
