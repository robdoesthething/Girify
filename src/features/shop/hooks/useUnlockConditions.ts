import { useCallback } from 'react';
import { checkUnlockCondition, ShopItem } from '../../../utils/shop';
import { UserStats } from './useShopData';

export const useUnlockConditions = (userStats: UserStats | null) => {
  const checkUnlock = useCallback(
    (item: ShopItem) => {
      return checkUnlockCondition(item, userStats);
    },
    [userStats]
  );

  return { checkUnlock };
};
