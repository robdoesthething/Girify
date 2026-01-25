import { useCallback, useEffect, useState } from 'react';
import { getShopItems, GroupedShopItems } from '../../../utils/shop';
import { getEquippedCosmetics, getGiuros, getPurchasedCosmetics } from '../../../utils/shop/giuros';
import { getUserProfile } from '../../../utils/social';

export interface EquippedCosmetics {
  frameId?: string;
  badgeIds?: string[];
  titleId?: string;
  avatarId?: string;
}

export interface UserStats {
  streak?: number;
  gamesPlayed?: number;
  bestScore?: number;
}

export function useShopData(username: string) {
  const [balance, setBalance] = useState(0);
  const [purchased, setPurchased] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<EquippedCosmetics>({});
  const [shopItems, setShopItems] = useState<GroupedShopItems>({
    avatarFrames: [],
    titles: [],
    special: [],
    avatars: [],
    all: [],
  });
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [bal, owned, eq, items, profile] = await Promise.all([
        getGiuros(username),
        getPurchasedCosmetics(username),
        getEquippedCosmetics(username),
        getShopItems(),
        getUserProfile(username),
      ]);
      setBalance(bal);
      setPurchased(owned || []);
      setEquipped((eq as EquippedCosmetics) || {});
      setShopItems(items);
      setUserStats(profile as UserStats);
    } catch (e) {
      console.error('Error loading shop data:', e);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    balance,
    setBalance,
    purchased,
    setPurchased,
    equipped,
    setEquipped,
    shopItems,
    userStats,
    loading,
    refreshData: loadData,
  };
}
