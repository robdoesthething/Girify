/**
 * useToast Hook
 *
 * Centralized toast/message notifications with auto-dismiss.
 * Replaces the repeated setMessage + setTimeout pattern.
 */

import { useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  type: ToastType;
  text: string;
}

export interface UseToastOptions {
  /** Default timeout in ms (default: 3000) */
  defaultTimeout?: number;
}

const DEFAULT_TIMEOUT_MS = 3000;

export function useToast(options: UseToastOptions = {}) {
  const { defaultTimeout = DEFAULT_TIMEOUT_MS } = options;
  const [toast, setToast] = useState<Toast | null>(null);

  /**
   * Show a toast message that auto-dismisses
   */
  const showToast = useCallback(
    (type: ToastType, text: string, timeout?: number) => {
      setToast({ type, text });
      setTimeout(() => setToast(null), timeout ?? defaultTimeout);
    },
    [defaultTimeout]
  );

  /**
   * Convenience methods for common toast types
   */
  const success = useCallback(
    (text: string, timeout?: number) => showToast('success', text, timeout),
    [showToast]
  );

  const error = useCallback(
    (text: string, timeout?: number) => showToast('error', text, timeout),
    [showToast]
  );

  const info = useCallback(
    (text: string, timeout?: number) => showToast('info', text, timeout),
    [showToast]
  );

  const warning = useCallback(
    (text: string, timeout?: number) => showToast('warning', text, timeout),
    [showToast]
  );

  /**
   * Manually dismiss the toast
   */
  const dismiss = useCallback(() => setToast(null), []);

  return {
    toast,
    showToast,
    success,
    error,
    info,
    warning,
    dismiss,
  };
}

export default useToast;
