import { GAME_LOGIC, PRNG } from '../config/constants';
import { Street } from '../types/game';

// Daily Challenge Utility
// Generates consistent street selection based on date

const NEARBY_THRESHOLD = 0.01; // ~1km
const EXCLUSION_DAYS = 7;
const MIN_STREETS = 10;
const PRESENTATION_SEED_OFFSET = 1000;
const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_MINUTE = 1000 * 60;

/**
 * Seeded random number generator
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * PRNG.SEED_SCALE;
  return x - Math.floor(x);
}

/**
 * Get today's date as a seed (YYYYMMDD format)
 */
export function getTodaySeed(): number {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`, 10);
}

/**
 * Shuffle array using seeded random
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
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
 * Get seed for a specific date object
 */
function getSeedForDate(date: Date): number {
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
 */
export const getDailyStreetIndex = (
  validStreets: Street[],
  dateSeed: number,
  questionIndex: number
): number => {
  if (!validStreets || validStreets.length === 0) {
    return 0;
  }

  const index =
    (dateSeed + questionIndex * PRNG.PRIME_1 + (dateSeed % PRNG.PRIME_2)) % validStreets.length;
  return index;
};

/**
 * Select daily streets based on date seed
 */
export function selectDailyStreets(validStreets: Street[], seed: number): Street[] {
  const excludedIds = new Set<string>();

  // Parse seed back to date
  const seedStr = String(seed);
  const year = parseInt(seedStr.substring(0, 4), 10);
  const month = parseInt(seedStr.substring(4, 6), 10) - 1;
  const day = parseInt(seedStr.substring(6, 8), 10);
  const currentDate = new Date(year, month, day);

  const getRawSelection = (pool: Street[], s: number): Street[] => {
    const shuffled = seededShuffle(pool, s);
    const t1 = shuffled.filter(str => str.tier === 1).slice(0, 3);
    const t2 = shuffled.filter(str => str.tier === 2).slice(0, 3);
    const t3 = shuffled.filter(str => str.tier === 3).slice(0, 2);
    const t4 = shuffled.filter(str => str.tier === 4).slice(0, 2);
    let sel = [...t1, ...t2, ...t3, ...t4];
    if (sel.length < MIN_STREETS) {
      sel = shuffled.slice(0, MIN_STREETS);
    }
    return sel;
  };

  for (let i = 1; i <= EXCLUSION_DAYS; i++) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - i);
    const pastSeed = getSeedForDate(d);
    const pastStreets = getRawSelection(validStreets, pastSeed);
    pastStreets.forEach(s => excludedIds.add(s.id));
  }

  const availableStreets = validStreets.filter(s => !excludedIds.has(s.id));
  const pool = availableStreets.length >= MIN_STREETS ? availableStreets : validStreets;
  const selected = getRawSelection(pool, seed);

  return seededShuffle(selected, seed + PRESENTATION_SEED_OFFSET);
}

/**
 * Check if user has played today
 */
export function hasPlayedToday(): boolean {
  const today = getTodaySeed();
  const lastPlayed = localStorage.getItem('lastPlayedDate');
  return lastPlayed === String(today);
}

/**
 * Mark today as played
 */
export function markTodayAsPlayed(): void {
  const today = getTodaySeed();
  localStorage.setItem('lastPlayedDate', String(today));
}

/**
 * Get time until next challenge (midnight)
 */
export function getTimeUntilNext(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / MS_PER_HOUR);
  const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);

  return `${hours}h ${minutes}m`;
}

/**
 * Deterministically select 3 distractors for a target street
 */
export function selectDistractors(validStreets: Street[], target: Street, seed: number): Street[] {
  const getPrefix = (name: string): string => {
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

  const MIN_DISTRACTORS = 3;
  if (pool.length < MIN_DISTRACTORS) {
    pool = validStreets.filter(s => s.id !== target.id);
  }

  // Try to find a "neighbor" street first
  const neighbors = validStreets.filter(s => {
    const latDiff = Math.abs((s.lat || 0) - (target.lat || 0));
    const lngDiff = Math.abs((s.lng || 0) - (target.lng || 0));
    return latDiff < NEARBY_THRESHOLD && lngDiff < NEARBY_THRESHOLD && s.name !== target.name;
  });

  if (neighbors.length >= PRNG.MOD_4) {
    return [neighbors[seed % neighbors.length]];
  }

  const shuffledPool = seededShuffle(pool, seed);
  return shuffledPool.slice(0, MIN_DISTRACTORS);
}

/**
 * Deterministically shuffle options (target + distractors)
 */
export function shuffleOptions<T>(options: T[], seed: number): T[] {
  return seededShuffle(options, seed);
}
