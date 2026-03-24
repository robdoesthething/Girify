import { useCallback } from 'react';
import { supabase } from '../../../services/supabase';

export const useGameReferrals = () => {
  const processReferrals = useCallback(async (username: string) => {
    if (!username) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return;
      }

      await fetch('/api/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ referredUsername: username }),
      });
    } catch (error) {
      console.error('Error processing referrals:', error);
    }
  }, []);

  return { processReferrals };
};
