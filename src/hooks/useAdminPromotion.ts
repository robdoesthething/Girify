import { useState } from 'react';
import { supabase } from '../services/supabase';
import { HTTP } from '../utils/constants';

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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Call API endpoint with Supabase JWT
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          adminKey,
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        let errorMessage = data.error || 'Failed to promote to admin.';

        if (response.status === HTTP.STATUS.TOO_MANY_REQUESTS) {
          errorMessage = 'Too many attempts. Please try again later.';
        } else if (response.status === HTTP.STATUS.FORBIDDEN) {
          errorMessage = 'Access Denied.';
        } else if (response.status === HTTP.STATUS.UNAUTHORIZED) {
          errorMessage = 'Authentication failed. Please log in again.';
        }

        throw new Error(errorMessage);
      }

      // Success
      if (options.onSuccess) {
        options.onSuccess(session.user.id);
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
