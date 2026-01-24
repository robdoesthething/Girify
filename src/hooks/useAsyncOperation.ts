import { useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';
import { logger } from '../utils/logger';
import { useNotification } from './useNotification';

interface AsyncOptions<T = unknown> {
  loadingKey?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to wrap async operations with loading state and error handling
 */
export const useAsyncOperation = () => {
  const { startLoading, stopLoading } = useLoading();
  const { notify } = useNotification();

  const execute = useCallback(
    async <T>(operation: () => Promise<T>, options: AsyncOptions = {}): Promise<T | undefined> => {
      const {
        loadingKey = 'global',
        successMessage,
        errorMessage = 'An error occurred',
        onSuccess,
        onError,
      } = options;

      startLoading(loadingKey);

      try {
        const result = await operation();

        if (successMessage) {
          notify(successMessage, 'success');
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`Async operation failed [${loadingKey}]:`, err);

        if (options.errorMessage !== null) {
          // Pass null to suppress error notification
          notify(errorMessage, 'error');
        }

        if (onError) {
          onError(err);
        }
        return undefined; // Explicitly return undefined in case of error
      } finally {
        stopLoading(loadingKey);
      }
    },
    [startLoading, stopLoading, notify]
  );

  return { execute };
};

export default useAsyncOperation;
