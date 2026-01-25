import { Timestamp } from 'firebase/firestore';
import { UserProfile } from '../../../types/user';
import { ShopItem } from '../../../utils/shop';

/**
 * Parse joined date from various formats (Timestamp, object with seconds, or string)
 */
export const parseJoinedDate = (joinedAt: any): Date => {
  if (!joinedAt) {
    return new Date();
  }
  if (joinedAt instanceof Timestamp) {
    return joinedAt.toDate();
  }
  if (typeof joinedAt === 'object' && 'seconds' in joinedAt) {
    return new Date(joinedAt.seconds * 1000);
  }
  return new Date(joinedAt as string);
};

/**
 * Get CSS classes for achievement badge based on selection state and theme
 */
export const getBadgeClass = (isSelected: boolean, theme: string): string => {
  if (isSelected) {
    return 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/20 scale-105 shadow-md';
  }
  return theme === 'dark'
    ? 'bg-slate-800 border-transparent hover:bg-slate-700'
    : 'bg-white border-transparent shadow-sm hover:shadow-md';
};

/**
 * Get CSS classes for recent activity cards based on daily status and theme
 */
export const getActivityClasses = (isDaily: boolean, theme: string) => {
  if (isDaily) {
    return {
      container:
        theme === 'dark'
          ? 'bg-emerald-900/10 border-emerald-500/20'
          : 'bg-emerald-50 border-emerald-100',
      score: 'text-emerald-600 dark:text-emerald-400 scale-110 inline-block font-inter',
    };
  }
  return {
    container: theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100',
    score: 'text-slate-400 font-medium font-inter',
  };
};

/**
 * Calculate owned cosmetics from profile data and shop items
 */
export const calculateOwnedCosmetics = (
  profileData: UserProfile | null,
  shopItems: ShopItem[]
): ShopItem[] => {
  const ownedIds = new Set(profileData?.purchasedCosmetics || []);
  // Always include free items (cost 0)
  shopItems.forEach(item => {
    if (item.cost === 0) {
      ownedIds.add(item.id);
    }
  });
  return shopItems.filter(item => ownedIds.has(item.id));
};
