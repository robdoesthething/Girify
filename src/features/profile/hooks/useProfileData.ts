import { useCallback, useEffect, useState } from 'react';
import { GameHistory, UserProfile } from '../../../types/user';
import { DATE } from '../../../utils/constants';
import { normalizeUsername } from '../../../utils/format';
import { getShopItems, GroupedShopItems, ShopItem } from '../../../utils/shop';
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
      // console.warn(`[Profile] Loading data for: ${normalizedUsername}`);

      // CRITICAL: Load only essential data immediately (300-400ms)
      // User profile, balance, and equipped cosmetics are needed for initial render
      const [profile, bal, equipped] = await Promise.all([
        getUserProfile(normalizedUsername),
        getGiuros(normalizedUsername),
        getEquippedCosmetics(normalizedUsername),
      ]);

      setGiuros(prev => (prev !== bal ? bal : prev));
      setEquippedCosmetics(prev =>
        JSON.stringify(prev) !== JSON.stringify(equipped || {}) ? equipped || {} : prev
      );

      if (profile) {
        setProfileData(profile as UserProfile);
        const newDate = parseJoinedDate((profile as UserProfile).joinedAt).toLocaleDateString();
        setJoinedDate(prev => (prev !== newDate ? newDate : prev));
      } else {
        const localDate = localStorage.getItem('girify_joined') || new Date().toLocaleDateString();
        setJoinedDate(prev => (prev !== localDate ? localDate : prev));
      }

      // End loading here so user sees profile faster
      setLoading(false);

      // NON-CRITICAL: Load in background after profile is visible
      Promise.all([
        getFriendCount(normalizedUsername),
        getUserGameHistory(normalizedUsername),
        getShopItems(),
      ])
        .then(([count, history, shopItems]: [number, any[], GroupedShopItems]) => {
          setFriendCount(prev => (prev !== count ? count : prev));

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

          setAllHistory(prev => {
            if (prev.length !== mappedHistory.length) {
              return mappedHistory;
            }
            // Simple check: compare timestamps of first item
            if (prev.length > 0 && prev[0]?.timestamp !== mappedHistory[0]?.timestamp) {
              return mappedHistory;
            }
            return prev; // Assume same if length and first item same (optimization)
          });

          // Optimize Shop Items: Use strict equality from specific fields if they are arrays
          // getShopItems returns cached object if valid, so strict equality works if unchanged
          if (shopItems) {
            setShopAvatars(prev => (prev === shopItems?.avatars ? prev : shopItems?.avatars || []));
            setShopFrames(prev =>
              prev === shopItems?.avatarFrames ? prev : shopItems?.avatarFrames || []
            );
            setShopTitles(prev => (prev === shopItems?.titles ? prev : shopItems?.titles || []));
          }
        })
        .catch(e => {
          console.error('[Profile] Error loading background data:', e);
        });
    } catch (e) {
      console.error('[Profile] Error loading profile:', e);
      setLoading(false);
    }
  }, [normalizedUsername]);

  // Initial data load on mount - this is an intentional async fetch, not cascading renders
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
