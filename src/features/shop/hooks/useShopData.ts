import { useCallback, useEffect, useState } from 'react';
import { getUserPurchasedBadges, getUserShopData } from '../../../services/database';
import { getShopItems, GroupedShopItems } from '../../../utils/shop';

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
    frames: [],
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
      // Single user fetch + shop items + badges in parallel (was 5 queries, now 3)
      const [userData, items, badges] = await Promise.all([
        getUserShopData(username),
        getShopItems(),
        getUserPurchasedBadges(username),
      ]);

      // Derive all user-specific data from the single fetch
      setBalance(userData?.giuros ?? 10);
      const cosmetics = userData?.purchased_cosmetics || [];
      setPurchased([...cosmetics, ...badges]);
      setEquipped((userData?.equipped_cosmetics as EquippedCosmetics) || {});
      setShopItems(items);
      setUserStats(
        userData
          ? {
              streak: userData.streak ?? undefined,
              gamesPlayed: userData.games_played ?? undefined,
              bestScore: userData.best_score ?? undefined,
            }
          : null
      );
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
