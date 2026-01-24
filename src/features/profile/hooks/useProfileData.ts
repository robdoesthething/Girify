import { useCallback, useEffect, useState } from 'react';
import { GameHistory, UserProfile } from '../../../types/user';
import { getFriendCount } from '../../../utils/friends';
import { getEquippedCosmetics, getGiuros } from '../../../utils/giuros';
import { getShopItems, ShopItem } from '../../../utils/shop';
import { getUserGameHistory, getUserProfile } from '../../../utils/social';
import { parseJoinedDate } from '../utils/profileHelpers';

export interface UseProfileDataResult {
  profileData: UserProfile | null;
  allHistory: GameHistory[];
  friendCount: number;
  giuros: number;
  equippedCosmetics: Record<string, string>;
  joinedDate: string;
  loading: boolean;
  shopAvatars: ShopItem[];
  shopFrames: ShopItem[];
  shopTitles: ShopItem[];
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching profile data, game history, friend count, giuros, and shop items
 */
export const useProfileData = (username: string): UseProfileDataResult => {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [allHistory, setAllHistory] = useState<GameHistory[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [giuros, setGiuros] = useState(0);
  const [equippedCosmetics, setEquippedCosmetics] = useState<Record<string, string>>({});
  const [joinedDate, setJoinedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [shopAvatars, setShopAvatars] = useState<ShopItem[]>([]);
  const [shopFrames, setShopFrames] = useState<ShopItem[]>([]);
  const [shopTitles, setShopTitles] = useState<ShopItem[]>([]);

  const loadProfile = useCallback(async () => {
    if (!username) {
      return;
    }

    try {
      setLoading(true);
      const [count, bal, equipped, history, profile, shopItems] = await Promise.all([
        getFriendCount(username),
        getGiuros(username),
        getEquippedCosmetics(username),
        getUserGameHistory(username),
        getUserProfile(username),
        getShopItems(),
      ]);

      setFriendCount(count);
      setGiuros(bal);
      setEquippedCosmetics(equipped || {});

      // Map GameData to GameHistory
      const mappedHistory: GameHistory[] = (history || []).map(h => {
        let ts = 0;
        if (h.timestamp && typeof (h.timestamp as any).toDate === 'function') {
          ts = (h.timestamp as any).toDate().getTime();
        } else if ((h.timestamp as any)?.seconds) {
          ts = (h.timestamp as any).seconds * 1000;
        } else if (typeof h.timestamp === 'number') {
          ts = h.timestamp;
        } else {
          // Fallback to date number if timestamp missing
          const dStr = h.date?.toString() || '';
          if (dStr.length === 8) {
            const y = parseInt(dStr.slice(0, 4), 10);
            const m = parseInt(dStr.slice(4, 6), 10) - 1;
            const d = parseInt(dStr.slice(6, 8), 10);
            ts = new Date(y, m, d).getTime();
          }
        }

        return {
          date: h.date?.toString() || new Date(ts).toISOString().slice(0, 10),
          score: h.score,
          avgTime: '0s',
          timestamp: ts,
          username: username,
        };
      });

      setAllHistory(mappedHistory);
      setShopAvatars(shopItems.avatars || []);
      setShopFrames(shopItems.avatarFrames || []);
      setShopTitles(shopItems.titles || []);

      if (profile) {
        const userProfile = profile as UserProfile;
        setProfileData(userProfile);
        setJoinedDate(parseJoinedDate(userProfile.joinedAt).toLocaleDateString());
      } else {
        // Default joined date
        setJoinedDate(localStorage.getItem('girify_joined') || new Date().toLocaleDateString());
      }
    } catch (e) {
      console.error('[Profile] Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profileData,
    allHistory,
    friendCount,
    giuros,
    equippedCosmetics,
    joinedDate,
    loading,
    shopAvatars,
    shopFrames,
    shopTitles,
    refetch: loadProfile,
  };
};
