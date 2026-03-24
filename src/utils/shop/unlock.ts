import type { UserProfile } from '../../types/user';
import type { ShopItem } from './types';

/**
 * Check if a shop item is locked for the user
 * @param item - The shop item to check
 * @param userStats - The user's stats
 * @returns Object indicating lock status and reason if locked
 */
export const checkUnlockCondition = (
  item: ShopItem,
  userStats: Partial<UserProfile> | null
): { locked: boolean; reason?: string } => {
  if (!item.unlockCondition || !userStats) {
    return { locked: false };
  }

  const { type, value } = item.unlockCondition;

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
