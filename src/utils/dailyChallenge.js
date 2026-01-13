import { GAME_LOGIC, PRNG } from '../config/constants';

// Daily Challenge Utility
// Generates consistent street selection based on date

/**
 * Seeded random number generator
 * @param {number} seed - The seed value
 * @returns {number} - Random number between 0 and 1
 */
export function seededRandom(seed) {
  const x = Math.sin(seed++) * PRNG.SEED_SCALE;
  return x - Math.floor(x);
}

/**
 * Get today's date as a seed (YYYYMMDD format)
 * @returns {number} - Date seed
 */
export function getTodaySeed() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`, 10);
}

/**
 * Shuffle array using seeded random
 * @param {Array} array - Array to shuffle
 * @param {number} seed - Seed for random
 * @returns {Array} - Shuffled array
 */
function seededShuffle(array, seed) {
  const shuffled = [...array];
  let currentSeed = seed;

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(currentSeed) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    currentSeed++;
  }

  return shuffled;
}

/**
 * Select daily streets based on date seed
 * @param {Array} validStreets - All valid streets
 * @param {number} seed - Date seed
 * @returns {Array} - Selected 10 streets for the day
 */
/**
 * Get seed for a specific date object
 * @param {Date} date - Date object
 * @returns {number} - Seed
 */
function getSeedForDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const mod =
    year * GAME_LOGIC.DAILY_CHALLENGE.SEED_MULTIPLIER +
    parseInt(month, 10) * 100 +
    parseInt(day, 10);
  return mod;
}

/**
 * Deterministically get an index for a street from a list based on date and question number.
 * This is used for selecting the daily street for a specific question slot.
 * @param {Array} validStreets - All valid streets
 * @param {number} dateSeed - Date seed
 * @param {number} questionIndex - The index of the question (0-9)
 * @returns {number} - The index of the selected street in validStreets
 */
export const getDailyStreetIndex = (validStreets, dateSeed, questionIndex) => {
  if (!validStreets || validStreets.length === 0) {
    return 0;
  }

  // Create a pseudo-random index based on date and question number
  // Using primes to avoid patterns
  const index =
    (dateSeed + questionIndex * PRNG.PRIME_1 + (dateSeed % PRNG.PRIME_2)) % validStreets.length;
  return index;
};

/**
 * Select daily streets based on date seed
 * @param {Array} validStreets - All valid streets
 * @param {number} seed - Date seed
 * @returns {Array} - Selected 10 streets for the day
 */
export function selectDailyStreets(validStreets, seed) {
  // 1. Identify excluded streets (from last 7 days)
  const excludedIds = new Set();

  // Parse seed back to date to iterate backwards
  const seedStr = String(seed);
  const year = parseInt(seedStr.substring(0, 4), 10);
  const month = parseInt(seedStr.substring(4, 6), 10) - 1;
  const day = parseInt(seedStr.substring(6, 8), 10);
  const currentDate = new Date(year, month, day);

  // We need a pure function to select streets for a given seed WITHOUT exclusion recursion
  // to avoid infinite loops. We'll use a local helper for the raw selection.
  const getRawSelection = (pool, s) => {
    const shuffled = seededShuffle(pool, s);
    const t1 = shuffled.filter(str => str.tier === 1).slice(0, 3);
    const t2 = shuffled.filter(str => str.tier === 2).slice(0, 3);
    const t3 = shuffled.filter(str => str.tier === 3).slice(0, 2);
    const t4 = shuffled.filter(str => str.tier === 4).slice(0, 2);
    let sel = [...t1, ...t2, ...t3, ...t4];
    if (sel.length < 10) {
      sel = shuffled.slice(0, 10);
    }
    return sel;
  };

  for (let i = 1; i <= 7; i++) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - i);
    const pastSeed = getSeedForDate(d);

    // For past days, we assume they were selected from the FULL pool (approximation)
    // This is "good enough" for exclusion. Exact simulation would require
    // re-simulating the entire history of the world, which is impossible.
    // By using the full pool for past days, we might flag a street as used
    // even if it was theoretically excluded that day, but that's a safe fail-over.
    const pastStreets = getRawSelection(validStreets, pastSeed);
    pastStreets.forEach(s => excludedIds.add(s.id));
  }

  // 2. Filter available streets
  const availableStreets = validStreets.filter(s => !excludedIds.has(s.id));

  // Fallback: If pool is too small (unlikely), use full pool
  const pool = availableStreets.length >= 10 ? availableStreets : validStreets;

  // 3. Select today's streets from available pool
  const selected = getRawSelection(pool, seed);

  // Shuffle again with different seed offset for presentation order
  return seededShuffle(selected, seed + 1000);
}

/**
 * Check if user has played today
 * @returns {boolean}
 */
export function hasPlayedToday() {
  const today = getTodaySeed();
  const lastPlayed = localStorage.getItem('lastPlayedDate');
  return lastPlayed === String(today);
}

/**
 * Mark today as played
 */
export function markTodayAsPlayed() {
  const today = getTodaySeed();
  localStorage.setItem('lastPlayedDate', String(today));
}

/**
 * Get time until next challenge (midnight)
 * @returns {string} - Formatted time string
 */
export function getTimeUntilNext() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

/**
 * Deterministically select 3 distractors for a target street
 * @param {Array} validStreets - All valid streets
 * @param {Object} target - The correct street
 * @param {number} seed - Question-specific seed
 * @returns {Array} - 3 distractor streets
 */
export function selectDistractors(validStreets, target, seed) {
  const getPrefix = name => {
    if (!name) {
      return '';
    }
    const match = name.match(
      /^(Carrer|Avinguda|Plaça|Passeig|Passatge|Ronda|Via|Camí|Jardins|Parc|Rambla|Travessera)(\s+d(e|els|es|el|ala)|(?=\s))?/i
    );
    return match ? match[0].trim() : '';
  };

  const targetPrefix = getPrefix(target.name);
  let pool = validStreets.filter(s => s.id !== target.id && getPrefix(s.name) === targetPrefix);

  if (pool.length < 3) {
    pool = validStreets.filter(s => s.id !== target.id);
  }

  // Try to find a "neighbor" street first
  const neighbors = validStreets.filter(s => {
    const latDiff = Math.abs(s.lat - target.lat);
    const lngDiff = Math.abs(s.lng - target.lng);
    return latDiff < NEARBY_THRESHOLD && lngDiff < NEARBY_THRESHOLD && s.name !== target.name;
  });

  if (neighbors.length >= PRNG.MOD_4) {
    // Return a random neighbor
    return neighbors[seed % neighbors.length];
  }

  // If no neighbors, find closest by sorting (simplified)
  // Shuffle pool with seed
  const shuffledPool = seededShuffle(pool, seed);
  return shuffledPool.slice(0, 3);
}

/**
 * Deterministically shuffle options (target + distractors)
 * @param {Array} options - Array of 4 options
 * @param {number} seed - Seed
 * @returns {Array} - Shuffled options
 */
export function shuffleOptions(options, seed) {
  return seededShuffle(options, seed);
}
