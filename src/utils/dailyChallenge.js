// Daily Challenge Utility
// Generates consistent street selection based on date

/**
 * Seeded random number generator
 * @param {number} seed - The seed value
 * @returns {number} - Random number between 0 and 1
 */
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
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
  return parseInt(`${year}${month}${day}`);
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
export function selectDailyStreets(validStreets, seed) {
  // Shuffle with seed
  const shuffled = seededShuffle(validStreets, seed);

  // Select by tiers
  const tier1 = shuffled.filter(s => s.tier === 1).slice(0, 3);
  const tier2 = shuffled.filter(s => s.tier === 2).slice(0, 3);
  const tier3 = shuffled.filter(s => s.tier === 3).slice(0, 2);
  const tier4 = shuffled.filter(s => s.tier === 4).slice(0, 2);

  let selected = [...tier1, ...tier2, ...tier3, ...tier4];

  // Fallback if tiers didn't yield enough
  if (selected.length < 10) {
    selected = shuffled.slice(0, 10);
  }

  // Shuffle again with different seed offset
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
    if (!name) return '';
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
