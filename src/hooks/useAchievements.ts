import { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { getUserProfile } from '../utils/social';
import { getUnlockedAchievements, Achievement } from '../data/achievements';

/**
 * Hook for managing achievement tracking and unlock notifications
 * @param {string} username - Current user's username
 * @param {string} gameState - Current game state ('playing', 'summary', etc.)
 * @param {string} pathname - Current route pathname
 * @returns {Object} { newlyUnlockedBadge, dismissAchievement }
 */
export const useAchievements = (username: string | null, gameState: string, pathname: string) => {
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Achievement | null>(null);
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkAchievements = async () => {
      if (!username) return;

      try {
        const profile = await getUserProfile(username);
        const unlocked = getUnlockedAchievements(profile);

        // Initialize ref on first load
        if (prevUnlockedRef.current.size === 0) {
          unlocked.forEach(b => prevUnlockedRef.current.add(b.id));
          return;
        }

        // Check for new badges
        for (const badge of unlocked) {
          if (!prevUnlockedRef.current.has(badge.id)) {
            setNewlyUnlockedBadge(badge);
            prevUnlockedRef.current.add(badge.id);
            break; // Show one at a time
          }
        }
      } catch (err) {
        console.warn('Achievement check failed:', err);
      }
    };

    // Check when game ends or viewing profile
    if (gameState === 'summary' || pathname === '/profile') {
      checkAchievements();
    }
  }, [username, gameState, pathname]);

  const dismissAchievement = () => {
    setNewlyUnlockedBadge(null);
  };

  return { newlyUnlockedBadge, dismissAchievement };
};

export default useAchievements;
