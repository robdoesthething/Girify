import { useEffect, useRef, useState } from 'react';
import { Achievement, getUnlockedAchievements } from '../data/achievements';
import { getAllAchievements } from '../utils/achievements';
import { getUserProfile } from '../utils/social';

export const useAchievements = (username: string | null, gameState: string, pathname: string) => {
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Achievement | null>(null);
  const [achievementRules, setAchievementRules] = useState<Achievement[]>([]);
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  // Fetch rules on mount
  useEffect(() => {
    const fetchRules = async () => {
      const rules = await getAllAchievements();
      setAchievementRules(rules);
    };
    fetchRules();
  }, []);

  useEffect(() => {
    const checkAchievements = async () => {
      if (!username || achievementRules.length === 0) {
        return;
      }

      try {
        const profile = await getUserProfile(username);
        if (!profile) {
          return;
        }
        // Pass dynamic rules here
        const unlocked = getUnlockedAchievements(profile, [], achievementRules);

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
  }, [username, gameState, pathname, achievementRules]);

  const dismissAchievement = () => {
    setNewlyUnlockedBadge(null);
  };

  return { newlyUnlockedBadge, dismissAchievement };
};

export default useAchievements;
