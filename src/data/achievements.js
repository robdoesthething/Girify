/**
 * Achievement Badges - Earned through gameplay milestones
 * These are separate from purchasable cosmetics
 *
 * Categories:
 * - starter: Basic gameplay milestones
 * - guiri_path: Tourist-themed comedy badges
 * - local_path: Local knowledge badges
 * - high_roller: Premium shop badges
 * - urban_survival: City life challenges
 * - gastronomy: Food & drink themed
 * - digital_nomad: Remote worker experience
 */

// Emoji mapping for badges (fallback if no image)
export const ACHIEVEMENT_BADGES = [
  // === SOCIAL ===
  {
    id: 'badge_gentrificador',
    image: '/badges/badge_gentrificador.png',
    name: 'The Gentrificador',
    description: 'You told 3 friends about the city. Now rent is going up 50%.',
    category: 'social',
    type: 'merit',
    criteria: { inviteCount: 3 },
    flavorText: 'Invite 3 friends',
  },
  {
    id: 'badge_tour_guide',
    image: '/badges/badge_tour_guide.png',
    name: 'Unofficial Guide',
    description: 'You are basically leading groups with an umbrella now.',
    category: 'social',
    type: 'merit',
    criteria: { inviteCount: 10 },
    flavorText: 'Invite 10 friends',
  },
  {
    id: 'badge_influencer',
    image: '/badges/badge_influencer.png',
    name: 'Barcelona Influencer',
    description: '"Check out this hidden gem!" (It is a Starbucks).',
    category: 'social',
    type: 'merit',
    criteria: { inviteCount: 25 },
    flavorText: 'Invite 25 friends',
  },

  // === STARTER (General Gameplay) ===
  {
    id: 'badge_first_game',
    image: '/badges/badge_first_game.png',
    name: 'Fresh Guiri',
    description: 'You just arrived. Careful with the Sangria, it is strong.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 1 },
  },
  {
    id: 'badge_explorer',
    image: '/badges/badge_explorer.png',
    name: 'Ramblas Survivor',
    description: 'You walked 5 times without buying a flying magnet. Impressive.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 5 },
  },
  {
    id: 'badge_scholar',
    image: '/badges/badge_scholar.png',
    name: 'Metro Master',
    description: 'You know that L1 is a sauna and L5 smells funny.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 10 },
  },
  {
    id: 'badge_veteran',
    image: '/badges/badge_veteran.png',
    name: 'Honorary Resident',
    description: 'You have started complaining about tourists. One of us.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 50 },
  },
  {
    id: 'badge_legend',
    image: '/badges/badge_legend.png',
    name: 'The Alcalde',
    description: 'You basically run this town. Next stop: city council.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 100 },
  },
  {
    id: 'badge_streak_3',
    image: '/badges/badge_streak_3.png',
    name: 'Calçotada Season',
    description: "Things are heating up. Don't forget the bib.",
    category: 'starter',
    type: 'merit',
    criteria: { streak: 3 },
  },
  {
    id: 'badge_streak_7',
    image: '/badges/badge_streak_7.png',
    name: 'Festa Major',
    description: 'A full week of partying (playing). Your neighbors hate you.',
    category: 'starter',
    type: 'merit',
    criteria: { streak: 7 },
  },
  {
    id: 'badge_streak_30',
    image: '/badges/badge_streak_30.png',
    name: 'Sagrada Família',
    description: 'Slow, steady, and taking forever to finish. A masterpiece.',
    category: 'starter',
    type: 'merit',
    criteria: { streak: 30 },
  },
  {
    id: 'badge_champion',
    image: '/badges/badge_champion.png',
    name: 'Tapa King',
    description: 'You ordered everything on the menu. A solid performance.',
    category: 'starter',
    type: 'merit',
    criteria: { bestScore: 1800 },
  },
  {
    id: 'badge_perfect',
    image: '/badges/badge_perfect.png',
    name: "Gaudí's Vision",
    description: 'Pure perfection. Not a single straight line in sight.',
    category: 'starter',
    type: 'merit',
    criteria: { bestScore: 2000 },
  },

  // === SPECIALS (Formerly complex categories, now Starter) ===
  {
    id: 'badge_gamba_roja',
    image: '/badges/badge_gamba_roja.png',
    name: 'The Gamba Roja',
    description: 'Forgot sunscreen? You blend in with the paella now.',
    category: 'starter',
    type: 'merit',
    criteria: { wrongStreak: 5 },
    flavorText: 'Get 5 wrong in a row',
  },
  {
    id: 'badge_night_owl',
    image: '/badges/badge_night_owl.png',
    name: 'Razzmatazz Zombie',
    description: 'Playing at 4AM? Go home, you have work tomorrow.',
    category: 'starter',
    type: 'merit',
    criteria: { nightPlay: true },
    flavorText: 'Play between 3AM and 6AM',
  },
  {
    id: 'badge_fast_loss',
    image: '/badges/badge_fast_loss.png',
    name: 'Pickpocketed',
    description: "Game over in 30 seconds. They took your phone, didn't they?",
    category: 'starter',
    type: 'merit',
    criteria: { fastLoss: true },
    flavorText: 'Lose within 30 seconds',
  },
  {
    id: 'badge_precision',
    image: '/badges/badge_precision.png',
    name: 'Human GPS',
    description: "You don't need Google Maps. You ARE Google Maps.",
    category: 'starter',
    type: 'merit',
    criteria: { precisionGuess: true },
    flavorText: 'Guess with <10m error',
  },

  // === SHOP ITEMS (Categorized as starter for now to keep them visible) ===
  {
    id: 'badge_paellador',
    name: 'Paellador Fan',
    description: 'Neon yellow rice. Deliciously fake.',
    category: 'starter',
    type: 'shop',
    cost: 50,
  },
  {
    id: 'badge_sangria_bucket',
    name: 'Sangria Bucket',
    description: '10 straws, 1 headache.',
    category: 'starter',
    type: 'shop',
    cost: 100,
  },
  {
    id: 'badge_tcasual',
    name: 'T-Casual Hoarder',
    description: 'You have 15 of these in your wallet. None work.',
    category: 'starter',
    type: 'shop',
    cost: 200,
  },
  {
    id: 'badge_pigeon',
    name: 'Plaza Cat',
    description: 'Owner of the plaza. Judge of tourists.',
    category: 'starter',
    type: 'shop',
    cost: 300,
  },
  {
    id: 'badge_scooter',
    name: 'Electric Menace',
    description: 'Sidewalks are for the weak. Speed is key.',
    category: 'starter',
    type: 'shop',
    cost: 500,
  },
  {
    id: 'badge_yacht',
    name: 'Yacht Parking',
    description: 'For when the port is too small for your ego.',
    category: 'starter',
    type: 'shop',
    cost: 1000,
  },
];

export const BADGE_CATEGORIES = {
  starter: { name: 'Merits', color: 'blue', icon: '🏆' },
  social: { name: 'Social', color: 'purple', icon: '👥' },
};

/**
 * Get all shop badges (purchasable with Giuros)
 */
export const getShopBadges = () => {
  return ACHIEVEMENT_BADGES.filter(b => b.type === 'shop');
};

/**
 * Get all merit badges (earned through gameplay)
 */
export const getMeritBadges = () => {
  return ACHIEVEMENT_BADGES.filter(b => b.type === 'merit');
};

/**
 * Check which achievements a user has unlocked based on their stats
 * @param {Object} stats - User stats including special tracking fields
 * @param {Array} purchasedBadges - Array of badge IDs user has purchased
 * @returns {Array} Array of unlocked badge objects
 */
export const getUnlockedAchievements = (stats, purchasedBadges = []) => {
  if (!stats) return [];

  const {
    gamesPlayed = 0,
    bestScore = 0,
    streak = 0,
    wrongStreak = 0,
    totalPanKm = 0,
    consecutiveDays = 0,
    gamesWithoutQuitting = 0,
    eixampleCorners = 0,
    gothicStreak = 0,
    bornGuesses = 0,
    poblenouGuesses = 0,
    nightPlay = false,
    ramblasQuickGuess = false,
    precisionGuess = false,
    foodStreetsPerfect = 0,
    fastLoss = false,
    speedModeHighScore = false,
  } = stats;

  const unlocked = [];
  const purchasedSet = new Set(purchasedBadges);

  for (const badge of ACHIEVEMENT_BADGES) {
    // Shop badges - check if purchased
    if (badge.type === 'shop') {
      if (purchasedSet.has(badge.id)) {
        unlocked.push(badge);
      }
      continue;
    }

    // Merit badges - check criteria
    const { criteria } = badge;
    let meets = true;

    if (criteria.gamesPlayed && gamesPlayed < criteria.gamesPlayed) meets = false;
    if (criteria.bestScore && bestScore < criteria.bestScore) meets = false;
    if (criteria.streak && streak < criteria.streak) meets = false;
    if (criteria.wrongStreak && wrongStreak < criteria.wrongStreak) meets = false;
    if (criteria.totalPanKm && totalPanKm < criteria.totalPanKm) meets = false;
    if (criteria.consecutiveDays && consecutiveDays < criteria.consecutiveDays) meets = false;
    if (criteria.gamesWithoutQuitting && gamesWithoutQuitting < criteria.gamesWithoutQuitting)
      meets = false;
    if (criteria.eixampleCorners && eixampleCorners < criteria.eixampleCorners) meets = false;
    if (criteria.gothicStreak && gothicStreak < criteria.gothicStreak) meets = false;
    if (criteria.bornGuesses && bornGuesses < criteria.bornGuesses) meets = false;
    if (criteria.poblenouGuesses && poblenouGuesses < criteria.poblenouGuesses) meets = false;
    if (criteria.foodStreetsPerfect && foodStreetsPerfect < criteria.foodStreetsPerfect)
      meets = false;
    if (criteria.nightPlay && !nightPlay) meets = false;
    if (criteria.ramblasQuickGuess && !ramblasQuickGuess) meets = false;
    if (criteria.precisionGuess && !precisionGuess) meets = false;
    if (criteria.fastLoss && !fastLoss) meets = false;
    if (criteria.fastLoss && !fastLoss) meets = false;
    if (criteria.speedModeHighScore && !speedModeHighScore) meets = false;
    if (criteria.inviteCount && (stats.inviteCount || 0) < criteria.inviteCount) meets = false;

    if (meets) {
      unlocked.push(badge);
    }
  }

  return unlocked;
};

/**
 * Get badges grouped by category
 */
export const getBadgesByCategory = () => {
  const grouped = {};
  for (const badge of ACHIEVEMENT_BADGES) {
    if (!grouped[badge.category]) {
      grouped[badge.category] = [];
    }
    grouped[badge.category].push(badge);
  }
  return grouped;
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
    if (badge.type === 'shop') continue; // Skip shop badges for "next achievement"

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
