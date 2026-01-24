import { useMemo } from 'react';
import {
  Achievement,
  getNextAchievement,
  getUnlockedAchievements,
} from '../../../data/achievements';
import { GameHistory, UserProfile } from '../../../types/user';
import { calculateStreak } from '../../../utils/stats';

export interface ProfileStats {
  totalGames: number;
  bestScore: number;
  totalScore: number;
  dailyStreak: number;
  unlockedBadges: Achievement[];
  nextBadge: Achievement | null;
}

/**
 * Hook for calculating derived profile statistics
 */
export const useProfileStats = (
  allHistory: GameHistory[],
  profileData: UserProfile | null
): ProfileStats => {
  const uniqueHistory = useMemo(() => {
    const seenDates = new Set();
    const uniqueList: GameHistory[] = [];
    allHistory.forEach(game => {
      if (!seenDates.has(game.date)) {
        seenDates.add(game.date);
        uniqueList.push(game);
      }
    });
    return uniqueList;
  }, [allHistory]);

  const streakHistory = useMemo(() => {
    return uniqueHistory.map(h => ({
      date: parseInt(h.date.replace(/-/g, ''), 10),
    }));
  }, [uniqueHistory]);

  const totalGames = useMemo(() => {
    return allHistory.length > 0 ? allHistory.length : profileData?.gamesPlayed || 0;
  }, [allHistory, profileData]);

  const bestScore = useMemo(() => {
    const calculatedBest =
      allHistory.length > 0 ? Math.max(...allHistory.map(h => (h && h.score) || 0)) : 0;
    return Math.max(calculatedBest, profileData?.bestScore || 0);
  }, [allHistory, profileData]);

  const totalScore = useMemo(() => {
    return allHistory.length > 0
      ? allHistory.reduce((acc, curr) => acc + ((curr && curr.score) || 0), 0)
      : profileData?.totalScore || 0;
  }, [allHistory, profileData]);

  const dailyStreak = useMemo(() => {
    return allHistory.length > 0 ? calculateStreak(streakHistory) : profileData?.streak || 0;
  }, [allHistory, profileData, streakHistory]);

  const userStats = useMemo(
    () => ({ gamesPlayed: totalGames, bestScore, streak: dailyStreak }),
    [totalGames, bestScore, dailyStreak]
  );

  const unlockedBadges = useMemo(() => getUnlockedAchievements(userStats), [userStats]);

  const nextBadge = useMemo(() => getNextAchievement(userStats), [userStats]);

  return {
    totalGames,
    bestScore,
    totalScore,
    dailyStreak,
    unlockedBadges,
    nextBadge,
  };
};
