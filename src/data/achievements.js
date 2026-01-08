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
const BADGE_EMOJIS = {
  gamba_roja: '🦐',
  paellador: '🥘',
  socks_sandals: '🧦',
  sangria_bucket: '🍷',
  ramblas_roadblock: '📸',
  xamfra_lord: '📐',
  tcasual_hoarder: '🎫',
  gothic_maze: '🏛️',
  construction_manager: '🏗️',
  pigeon_whisperer: '🐦',
  pickpocket_proof: '💼',
  scooter_menace: '🛴',
  yacht_parking: '🛥️',
  sauna_l1: '🔴',
  red_station: '🚉',
  balcony_grandma: '👵',
  cobblestone_ankle: '🦶',
  water_gun: '🔫',
  sexy_beer: '🍺',
  inflation_breakfast: '🥐',
  bravas_critic: '🥔',
  vermut_sunday: '🍸',
  botellon_rookie: '🍾',
  coworking_king: '💻',
  nie_nightmare: '📋',
  rooftop_yoga: '🧘',
  flat_white: '☕',
  ryanair_tetris: '✈️',
};

export const ACHIEVEMENT_BADGES = [
  // === STARTER BADGES (Original) ===
  {
    id: 'badge_first_game',
    emoji: '🎮',
    name: 'First Steps',
    description: 'Play your first game',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 1 },
  },
  {
    id: 'badge_explorer',
    emoji: '🧭',
    name: 'Explorer',
    description: 'Play 5 games',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 5 },
  },
  {
    id: 'badge_scholar',
    emoji: '📚',
    name: 'Scholar',
    description: 'Play 10 games',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 10 },
  },
  {
    id: 'badge_veteran',
    emoji: '⭐',
    name: 'Veteran',
    description: 'Play 50 games',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 50 },
  },
  {
    id: 'badge_legend',
    emoji: '👑',
    name: 'Legend',
    description: 'Play 100 games',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 100 },
  },
  {
    id: 'badge_streak_3',
    emoji: '🔥',
    name: 'On Fire',
    description: '3-day streak',
    category: 'starter',
    type: 'merit',
    criteria: { streak: 3 },
  },
  {
    id: 'badge_streak_7',
    emoji: '🔥',
    name: 'Blazing',
    description: '7-day streak',
    category: 'starter',
    type: 'merit',
    criteria: { streak: 7 },
  },
  {
    id: 'badge_streak_30',
    emoji: '💎',
    name: 'Diamond Streak',
    description: '30-day streak',
    category: 'starter',
    type: 'merit',
    criteria: { streak: 30 },
  },
  {
    id: 'badge_champion',
    emoji: '🏆',
    name: 'Champion',
    description: 'Score over 1800',
    category: 'starter',
    type: 'merit',
    criteria: { bestScore: 1800 },
  },
  {
    id: 'badge_perfect',
    emoji: '💯',
    name: 'Perfect Score',
    description: 'Get 2000 points',
    category: 'starter',
    type: 'merit',
    criteria: { bestScore: 2000 },
  },

  // === GUIRI PATH (Tourist Comedy) ===
  {
    id: 'badge_gamba_roja',
    emoji: BADGE_EMOJIS.gamba_roja,
    name: 'The Gamba Roja',
    description: 'You forgot the sunscreen. You blend in perfectly with the boiled seafood.',
    category: 'guiri_path',
    type: 'merit',
    criteria: { wrongStreak: 5 }, // 5 wrong in a row
    flavorText: 'Get 5 locations wrong in a row',
  },
  {
    id: 'badge_paellador',
    emoji: BADGE_EMOJIS.paellador,
    name: 'Paellador Connoisseur',
    description:
      'Authentic cultural experience! Best served with neon yellow rice and frozen peas.',
    category: 'guiri_path',
    type: 'shop',
    cost: 50,
  },
  {
    id: 'badge_socks_sandals',
    emoji: BADGE_EMOJIS.socks_sandals,
    name: 'Socks & Sandals',
    description: 'Maximum comfort, minimum style. You are ready to block the sidewalk.',
    category: 'guiri_path',
    type: 'merit',
    criteria: { totalPanKm: 50 }, // 50km panned/walked in-game
    flavorText: 'Walk/Pan 50km total in-game',
  },
  {
    id: 'badge_sangria_bucket',
    emoji: BADGE_EMOJIS.sangria_bucket,
    name: 'Sangria Bucket',
    description:
      '1 liter of sugar and cheap wine. A sophisticated choice for a sophisticated traveler.',
    category: 'guiri_path',
    type: 'shop',
    cost: 100,
  },
  {
    id: 'badge_ramblas_roadblock',
    emoji: BADGE_EMOJIS.ramblas_roadblock,
    name: 'The Ramblas Roadblock',
    description: 'Move! I need to take a photo of this living statue!',
    category: 'guiri_path',
    type: 'merit',
    criteria: { ramblasQuickGuess: true }, // Ramblas in < 3s
    flavorText: 'Correct guess on Ramblas in < 3s',
  },

  // === LOCAL PATH ===
  {
    id: 'badge_xamfra_lord',
    emoji: BADGE_EMOJIS.xamfra_lord,
    name: 'Lord of the Xamfrà',
    description: 'You know that corners are cut for visibility (and parking trucks).',
    category: 'local_path',
    type: 'merit',
    criteria: { eixampleCorners: 10 }, // 10 Eixample corners correct
    flavorText: 'Correctly guess 10 Eixample corners',
  },
  {
    id: 'badge_tcasual_hoarder',
    emoji: BADGE_EMOJIS.tcasual_hoarder,
    name: 'T-Casual Hoarder',
    description: 'You know the struggle of the magnetic strip failing at the turnstile.',
    category: 'local_path',
    type: 'shop',
    cost: 200,
  },
  {
    id: 'badge_gothic_maze',
    emoji: BADGE_EMOJIS.gothic_maze,
    name: 'Gothic Maze Runner',
    description: 'You found your way out without buying a magnet! A true miracle.',
    category: 'local_path',
    type: 'merit',
    criteria: { gothicStreak: 5 }, // 5 streak in Gothic Quarter
    flavorText: '5 streak in Gothic Quarter',
  },
  {
    id: 'badge_construction_manager',
    emoji: BADGE_EMOJIS.construction_manager,
    name: 'The Construction Manager',
    description: 'Like the Sagrada Familia, your training is never truly finished.',
    category: 'local_path',
    type: 'merit',
    criteria: { consecutiveDays: 7 }, // 7 days in a row
    flavorText: 'Play 7 days in a row',
  },
  {
    id: 'badge_pigeon_whisperer',
    emoji: BADGE_EMOJIS.pigeon_whisperer,
    name: 'Pigeon Whisperer',
    description: 'They are the true owners of the city. You have earned their respect.',
    category: 'local_path',
    type: 'shop',
    cost: 300,
  },

  // === HIGH ROLLER ===
  {
    id: 'badge_pickpocket_proof',
    emoji: BADGE_EMOJIS.pickpocket_proof,
    name: 'Pickpocket Proof',
    description: 'Your wallet is safe. Your dignity? Debatable.',
    category: 'high_roller',
    type: 'shop',
    cost: 1000,
  },
  {
    id: 'badge_scooter_menace',
    emoji: BADGE_EMOJIS.scooter_menace,
    name: 'Electric Scooter Menace',
    description: 'Sidewalks, roads, bike lanes... the world is your highway.',
    category: 'high_roller',
    type: 'shop',
    cost: 2500,
  },
  {
    id: 'badge_yacht_parking',
    emoji: BADGE_EMOJIS.yacht_parking,
    name: 'Yacht Parking Only',
    description: "You don't guess streets anymore; you buy them.",
    category: 'high_roller',
    type: 'shop',
    cost: 10000,
  },

  // === URBAN SURVIVAL ===
  {
    id: 'badge_sauna_l1',
    emoji: BADGE_EMOJIS.sauna_l1,
    name: 'Sauna L1 Survivor',
    description: 'You survived the Red Line in August without fainting. You are heatproof.',
    category: 'urban_survival',
    type: 'merit',
    criteria: { gamesWithoutQuitting: 10 }, // 10 games without quitting
    flavorText: 'Play 10 games without quitting',
  },
  {
    id: 'badge_red_station',
    emoji: BADGE_EMOJIS.red_station,
    name: 'The Red Station',
    description: 'You arrived, but there are no slots left. The story of your life.',
    category: 'urban_survival',
    type: 'merit',
    criteria: { precisionGuess: true }, // Guess within 5 meters (placeholder)
    flavorText: 'Guess within 5 meters',
  },
  {
    id: 'badge_balcony_grandma',
    emoji: BADGE_EMOJIS.balcony_grandma,
    name: 'The Balcony Grandma',
    description: 'She sees everything. She judges everything. The ultimate security camera.',
    category: 'urban_survival',
    type: 'shop',
    cost: 150,
  },
  {
    id: 'badge_cobblestone_ankle',
    emoji: BADGE_EMOJIS.cobblestone_ankle,
    name: 'Cobblestone Ankle',
    description: 'Beauty is pain. Especially on medieval streets in flat shoes.',
    category: 'urban_survival',
    type: 'merit',
    criteria: { bornGuesses: 20 }, // 20 locations in El Born
    flavorText: 'Guess 20 locations in El Born',
  },
  {
    id: 'badge_water_gun',
    emoji: BADGE_EMOJIS.water_gun,
    name: 'The Water Gun Avenger',
    description: 'For when the terrace noise gets too loud. A playful weapon of distraction.',
    category: 'urban_survival',
    type: 'shop',
    cost: 500,
  },

  // === GASTRONOMY ===
  {
    id: 'badge_sexy_beer',
    emoji: BADGE_EMOJIS.sexy_beer,
    name: 'Sexy Beer Cold Water',
    description: '1 euro! 1 euro! The siren song of the beach at night.',
    category: 'gastronomy',
    type: 'merit',
    criteria: { nightPlay: true }, // Play between 2:00 AM and 5:00 AM
    flavorText: 'Play between 2:00 AM and 5:00 AM',
  },
  {
    id: 'badge_inflation_breakfast',
    emoji: BADGE_EMOJIS.inflation_breakfast,
    name: 'The Inflation Breakfast',
    description: 'It costs 25 Euros, but the sourdough is artisan. You hipster.',
    category: 'gastronomy',
    type: 'shop',
    cost: 800,
  },
  {
    id: 'badge_bravas_critic',
    emoji: BADGE_EMOJIS.bravas_critic,
    name: 'Patatas Bravas Critic',
    description: 'You know the difference between real salsa brava and ketchup with Tabasco.',
    category: 'gastronomy',
    type: 'merit',
    criteria: { foodStreetsPerfect: 3 }, // Perfect score on 3 food streets
    flavorText: 'Perfect score on 3 food streets',
  },
  {
    id: 'badge_vermut_sunday',
    emoji: BADGE_EMOJIS.vermut_sunday,
    name: 'Vermut Sunday',
    description: 'The sacred ritual. Must be consumed standing up in a crowded doorway.',
    category: 'gastronomy',
    type: 'shop',
    cost: 300,
  },
  {
    id: 'badge_botellon_rookie',
    emoji: BADGE_EMOJIS.botellon_rookie,
    name: 'Botellón Rookie',
    description: 'We all start somewhere. Usually on a park bench.',
    category: 'gastronomy',
    type: 'merit',
    criteria: { fastLoss: true }, // Lose all lives in under 1 minute
    flavorText: 'Lose all lives in under 1 minute',
  },

  // === DIGITAL NOMAD ===
  {
    id: 'badge_coworking_king',
    emoji: BADGE_EMOJIS.coworking_king,
    name: 'Coworking King',
    description: "You work in 'Tech'. You have calls at 10. You need fast WiFi.",
    category: 'digital_nomad',
    type: 'shop',
    cost: 1200,
  },
  {
    id: 'badge_nie_nightmare',
    emoji: BADGE_EMOJIS.nie_nightmare,
    name: 'The NIE Nightmare',
    description: "The hardest game isn't guessing streets; it's getting paperwork done.",
    category: 'digital_nomad',
    type: 'merit',
    criteria: { consecutiveDays: 30 }, // 30 consecutive days
    flavorText: 'Play 30 days consecutively',
  },
  {
    id: 'badge_rooftop_yoga',
    emoji: BADGE_EMOJIS.rooftop_yoga,
    name: 'Rooftop Yoga',
    description: 'Namaste on the terrace. Please ignore the construction noise next door.',
    category: 'digital_nomad',
    type: 'shop',
    cost: 400,
  },
  {
    id: 'badge_flat_white',
    emoji: BADGE_EMOJIS.flat_white,
    name: 'Flat White Addict',
    description: "You don't drink 'Café con leche' anymore. You have evolved.",
    category: 'digital_nomad',
    type: 'merit',
    criteria: { poblenouGuesses: 5 }, // 5 locations in Poblenou
    flavorText: 'Guess 5 locations in Poblenou',
  },
  {
    id: 'badge_ryanair_tetris',
    emoji: BADGE_EMOJIS.ryanair_tetris,
    name: 'Ryanair Tetris',
    description: 'If it fits, it sits. Avoiding the 50 euro fee is a lifestyle.',
    category: 'digital_nomad',
    type: 'merit',
    criteria: { speedModeHighScore: true }, // High score in Speed Mode (placeholder)
    flavorText: 'High score in Speed Mode',
  },
];

// Category display names and colors
export const BADGE_CATEGORIES = {
  starter: { name: 'Starter', color: 'gray', icon: '🎯' },
  guiri_path: { name: 'Guiri Path', color: 'red', icon: '🦐' },
  local_path: { name: 'Local Path', color: 'green', icon: '🏠' },
  high_roller: { name: 'High Roller', color: 'yellow', icon: '💰' },
  urban_survival: { name: 'Urban Survival', color: 'orange', icon: '🏙️' },
  gastronomy: { name: 'Gastronomy', color: 'purple', icon: '🍽️' },
  digital_nomad: { name: 'Digital Nomad', color: 'blue', icon: '💻' },
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
    if (criteria.speedModeHighScore && !speedModeHighScore) meets = false;

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
