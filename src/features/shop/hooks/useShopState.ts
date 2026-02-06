/**
 * useShopState Hook
 *
 * Manages shop state: balance, purchases, equipped items, and shop items.
 */

import { useEffect, useState } from 'react';
import { TOAST_SHORT_MS, TOAST_TIMEOUT_MS } from '../../../config/appConstants';
import { Toast, useToast } from '../../../hooks/useToast';
import { getShopItems, GroupedShopItems, ShopItem } from '../../../utils/shop';
import {
  getEquippedCosmetics,
  getGiuros,
  getPurchasedCosmetics,
  setEquippedCosmetics,
  spendGiuros,
} from '../../../utils/shop/giuros';

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

export type ShopTab = 'avatars' | 'frames' | 'titles' | 'special';

export interface UseShopStateReturn {
  balance: number;
  purchased: string[];
  equipped: EquippedCosmetics;
  shopItems: GroupedShopItems;
  userStats: UserStats | null;
  loading: boolean;
  message: Toast | null;
  handlePurchase: (item: ShopItem, t: (key: string) => string) => Promise<void>;
  handleEquip: (item: ShopItem, category: string, t: (key: string) => string) => Promise<void>;
  isOwned: (itemId: string) => boolean;
  isEquipped: (itemId: string, tab: ShopTab) => boolean;
  checkUnlockCondition: (item: ShopItem) => { locked: boolean; reason?: string };
}

export function useShopState(username: string): UseShopStateReturn {
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

  // Use the centralized toast hook instead of manual message + setTimeout
  const { toast: message, showToast } = useToast({ defaultTimeout: TOAST_SHORT_MS });

  useEffect(() => {
    const loadData = async () => {
      if (!username) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { getUserProfile } = await import('../../../utils/social');

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
        setUserStats(profile);
      } catch (e) {
        console.error('Error loading shop data:', e);
      }
      setLoading(false);
    };
    loadData();
  }, [username]);

  const checkUnlockCondition = (item: ShopItem): { locked: boolean; reason?: string } => {
    if (!item.unlockCondition || !userStats) {
      return { locked: false };
    }

    const { type, value } = item.unlockCondition as { type: string; value: number };

    if (type === 'streak') {
      const currentStreak = userStats.streak || 0;
      if (currentStreak < value) {
        return { locked: true, reason: `Need ${value} day streak (Current: ${currentStreak})` };
      }
    }

    if (type === 'gamesPlayed') {
      const games = userStats.gamesPlayed || 0;
      if (games < value) {
        return { locked: true, reason: `Play ${value} games (Current: ${games})` };
      }
    }

    if (type === 'bestScore') {
      const best = userStats.bestScore || 0;
      if (best < value) {
        return { locked: true, reason: `Score > ${value} in one game (Best: ${best})` };
      }
    }

    return { locked: false };
  };

  const isOwned = (itemId: string) =>
    purchased.includes(itemId) ||
    (shopItems.avatars && shopItems.avatars.find(a => a.id === itemId)?.cost === 0);

  const isEquipped = (itemId: string, tab: ShopTab) => {
    if (tab === 'frames') {
      return equipped.frameId === itemId;
    }
    if (tab === 'titles') {
      return equipped.titleId === itemId;
    }
    if (tab === 'avatars') {
      return equipped.avatarId === itemId;
    }
    return false;
  };

  const handlePurchase = async (item: ShopItem, t: (key: string) => string) => {
    if (purchased.includes(item.id)) {
      showToast('error', t('alreadyOwned'));
      return;
    }

    const { locked, reason } = checkUnlockCondition(item);
    if (locked) {
      showToast('error', `Locked! ${reason}`, TOAST_TIMEOUT_MS);
      return;
    }

    const cost = item.cost || item.price || 0;
    if (balance < cost) {
      showToast('error', t('notEnoughGiuros'));
      return;
    }

    const result = await spendGiuros(username, cost, item.id);
    if (result.success) {
      setBalance(result.newBalance ?? balance);
      setPurchased(prev => [...prev, item.id]);
      showToast('success', `${t('purchased') || 'Purchased'} ${item.name}!`);
    } else {
      showToast('error', result.error || t('purchaseFailed') || 'Purchase failed');
    }
  };

  const handleEquip = async (item: ShopItem, category: string, t: (key: string) => string) => {
    const newEquipped = { ...equipped };

    if (category === 'frames') {
      newEquipped.frameId = item.id;
    } else if (category === 'titles') {
      newEquipped.titleId = item.id;
    } else if (category === 'avatars') {
      newEquipped.avatarId = item.id;
    }

    await setEquippedCosmetics(username, newEquipped);
    setEquipped(newEquipped);
    showToast('success', `${t('equipped')} ${item.name}!`);
  };

  return {
    balance,
    purchased,
    equipped,
    shopItems,
    userStats,
    loading,
    message,
    handlePurchase,
    handleEquip,
    isOwned,
    isEquipped,
    checkUnlockCondition,
  };
}

export default useShopState;
