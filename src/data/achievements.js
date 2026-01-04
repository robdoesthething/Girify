/**
 * Achievement Badges - Earned through gameplay milestones
 * These are separate from purchasable cosmetics
 */

export const ACHIEVEMENT_BADGES = [
  {
    id: 'badge_first_game',
    emoji: '🎮',
    name: 'First Steps',
    description: 'Play your first game',
    criteria: { gamesPlayed: 1 },
  },
  {
    id: 'badge_explorer',
    emoji: '🧭',
    name: 'Explorer',
    description: 'Play 5 games',
    criteria: { gamesPlayed: 5 },
  },
  {
    id: 'badge_scholar',
    emoji: '📚',
    name: 'Scholar',
    description: 'Play 10 games',
    criteria: { gamesPlayed: 10 },
  },
  {
    id: 'badge_veteran',
    emoji: '⭐',
    name: 'Veteran',
    description: 'Play 50 games',
    criteria: { gamesPlayed: 50 },
  },
  {
    id: 'badge_legend',
    emoji: '👑',
    name: 'Legend',
    description: 'Play 100 games',
    criteria: { gamesPlayed: 100 },
  },
  {
    id: 'badge_streak_3',
    emoji: '🔥',
    name: 'On Fire',
    description: '3-day streak',
    criteria: { streak: 3 },
  },
  {
    id: 'badge_streak_7',
    emoji: '🔥',
    name: 'Blazing',
    description: '7-day streak',
    criteria: { streak: 7 },
  },
  {
    id: 'badge_streak_30',
    emoji: '💎',
    name: 'Diamond Streak',
    description: '30-day streak',
    criteria: { streak: 30 },
  },
  {
    id: 'badge_champion',
    emoji: '🏆',
    name: 'Champion',
    description: 'Score over 1800',
    criteria: { bestScore: 1800 },
  },
  {
    id: 'badge_perfect',
    emoji: '💯',
    name: 'Perfect Score',
    description: 'Get 2000 points',
    criteria: { bestScore: 2000 },
  },
];

/**
 * Check which achievements a user has unlocked based on their stats
 * @param {Object} stats - User stats { gamesPlayed, bestScore, streak }
 * @returns {Array} Array of unlocked badge objects
 */
export const getUnlockedAchievements = stats => {
  if (!stats) return [];

  const { gamesPlayed = 0, bestScore = 0, streak = 0 } = stats;
  const unlocked = [];

  for (const badge of ACHIEVEMENT_BADGES) {
    const { criteria } = badge;
    let meets = true;

    if (criteria.gamesPlayed && gamesPlayed < criteria.gamesPlayed) {
      meets = false;
    }
    if (criteria.bestScore && bestScore < criteria.bestScore) {
      meets = false;
    }
    if (criteria.streak && streak < criteria.streak) {
      meets = false;
    }

    if (meets) {
      unlocked.push(badge);
    }
  }

  return unlocked;
};

/**
 * Get the next achievement the user is closest to unlocking
 * @param {Object} stats - User stats
 * @returns {Object|null} Next achievement with progress info
 */
export const getNextAchievement = stats => {
  if (!stats) return null;

  const { gamesPlayed = 0, bestScore = 0, streak = 0 } = stats;
  const unlocked = getUnlockedAchievements(stats);
  const unlockedIds = new Set(unlocked.map(b => b.id));

  let closest = null;
  let closestProgress = 0;

  for (const badge of ACHIEVEMENT_BADGES) {
    if (unlockedIds.has(badge.id)) continue;

    const { criteria } = badge;
    let progress = 0;

    if (criteria.gamesPlayed) {
      progress = gamesPlayed / criteria.gamesPlayed;
    } else if (criteria.bestScore) {
      progress = bestScore / criteria.bestScore;
    } else if (criteria.streak) {
      progress = streak / criteria.streak;
    }

    if (progress > closestProgress) {
      closestProgress = progress;
      closest = { ...badge, progress: Math.min(progress, 0.99) };
    }
  }

  return closest;
};
