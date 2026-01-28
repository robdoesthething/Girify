import { useCallback, useEffect, useState } from 'react';
import { GameHistory, UserProfile } from '../../../types/user';
import { DATE } from '../../../utils/constants';
import { normalizeUsername } from '../../../utils/format';
import { getShopItems, ShopItem } from '../../../utils/shop';
import { getEquippedCosmetics, getGiuros } from '../../../utils/shop/giuros';
import { getUserGameHistory, getUserProfile } from '../../../utils/social';
import { getFriendCount } from '../../../utils/social/friends';
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
  const normalizedUsername = normalizeUsername(username);
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
    if (!normalizedUsername) {
      console.warn('[Profile] No username provided');
      return;
    }

    try {
      setLoading(true);
      console.warn(`[Profile] Loading data for: ${normalizedUsername}`);
      const [count, bal, equipped, history, profile, shopItems] = await Promise.all([
        getFriendCount(normalizedUsername),
        getGiuros(normalizedUsername),
        getEquippedCosmetics(normalizedUsername),
        getUserGameHistory(normalizedUsername),
        getUserProfile(normalizedUsername),
        getShopItems(),
      ]);
      console.warn(`[Profile] Loaded history: ${history?.length || 0} games`);

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
          if (dStr.length === DATE.PARSING.YYYYMMDD_LENGTH) {
            const y = parseInt(dStr.slice(0, DATE.PARSING.YEAR_LEN), DATE.PARSING.BASE_10);
            const mStart = DATE.PARSING.YEAR_LEN;
            const mEnd = mStart + DATE.PARSING.MONTH_LEN;
            const m = parseInt(dStr.slice(mStart, mEnd), DATE.PARSING.BASE_10) - 1;
            const d = parseInt(dStr.slice(mEnd), DATE.PARSING.BASE_10);
            ts = new Date(y, m, d).getTime();
          }
        }

        return {
          date: h.date?.toString() || new Date(ts).toISOString().slice(0, 10),
          score: h.score,
          avgTime: '0s',
          timestamp: ts,
          username: normalizedUsername,
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
  }, [normalizedUsername]);

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
