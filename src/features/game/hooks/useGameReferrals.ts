import { useCallback } from 'react';
import { awardReferralBonus } from '../../../utils/shop/giuros';
import { getReferrer } from '../../../utils/social';

export const useGameReferrals = () => {
  const processReferrals = useCallback(async (username: string) => {
    if (!username) {
      return;
    }

    try {
      const referrer = await getReferrer(username);
      if (referrer) {
        await awardReferralBonus(referrer);
      }
    } catch (error) {
      console.error('Error processing referrals:', error);
    }
  }, []);

  return { processReferrals };
};
