import { useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';
// @ts-ignore
import { useNotification } from './useNotification'; // Assuming useNotification is exported from hooks, or context
// @ts-ignore
import { logger } from '../utils/logger';

interface AsyncOptions {
  loadingKey?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
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
      } catch (error: any) {
        logger.error(`Async operation failed [${loadingKey}]:`, error);

        if (options.errorMessage !== null) {
          // Pass null to suppress error notification
          notify(errorMessage, 'error');
        }

        if (onError) {
          onError(error);
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
