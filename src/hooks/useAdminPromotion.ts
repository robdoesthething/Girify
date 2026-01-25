import { useState } from 'react';

interface UseAdminPromotionOptions {
  onSuccess?: (uid: string) => void;
  onError?: (error: string) => void;
}

interface UseAdminPromotionResult {
  promoteToAdmin: (adminKey: string, username: string) => Promise<void>;
  isLoading: boolean;
}

export function useAdminPromotion(options: UseAdminPromotionOptions = {}): UseAdminPromotionResult {
  const [isLoading, setIsLoading] = useState(false);

  const promoteToAdmin = async (adminKey: string, username: string) => {
    setIsLoading(true);

    try {
      // Dynamic import to avoid loading Firebase if not needed immediately
      const { auth } = await import('../firebase');

      if (!auth.currentUser) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Get Firebase ID token
      const idToken = await auth.currentUser.getIdToken();

      // Call API endpoint
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          adminKey,
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        let errorMessage = data.error || 'Failed to promote to admin.';

        if (response.status === 429) {
          errorMessage = 'Too many attempts. Please try again later.';
        } else if (response.status === 403) {
          errorMessage = 'Access Denied.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        }

        throw new Error(errorMessage);
      }

      // Success
      if (options.onSuccess) {
        options.onSuccess(auth.currentUser.uid);
      }
    } catch (e: unknown) {
      console.error('[useAdminPromotion] Error promoting to admin:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (options.onError) {
        options.onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { promoteToAdmin, isLoading };
}
