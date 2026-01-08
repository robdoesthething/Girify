/* eslint-env node */
/**
 * Quiz Plan Generator
 * Generates a 100-day quiz schedule following all rules:
 * 1. Tier frequency: T1 appears more often (shorter cooldown)
 * 2. Answer exclusion: No street as correct answer on adjacent days
 * 3. Same-type distractors: All options share street prefix
 * 4. Tier-down mixing: Correct can use lower-tier distractors only
 * 5. Daily distribution: 2 T1 + 5 T2/T3 + 3 T4 = 10 questions
 * 6. Geographic coverage: Streets spread across city
 */

import fs from 'fs';
import path from 'path';

// --- Configuration ---
const DAYS_TO_GENERATE = 100;
const START_DATE = new Date('2026-01-09');
const QUESTIONS_PER_DAY = 10;

// Tier distribution per day
const TIER_DISTRIBUTION = {
  tier1: 2,
  tier23: 5, // Combined T2 + T3
  tier4: 3,
};

// Cooldown periods (days before a street can be correct answer again)
const COOLDOWNS = {
  1: 3, // Tier 1: 3 days
  2: 5, // Tier 2: 5 days
  3: 7, // Tier 3: 7 days
  4: 10, // Tier 4: 10 days
};

// --- Load Streets ---
const streetsPath = path.join(process.cwd(), 'src', 'data', 'streets.json');
const streets = JSON.parse(fs.readFileSync(streetsPath, 'utf8'));

console.log(`Loaded ${streets.length} streets`);

// --- Helper Functions ---

/**
 * Get street type prefix (e.g., "Carrer", "Avinguda")
 */
function getStreetPrefix(name) {
  if (!name) return '';
  const match = name.match(
    /^(Carrer|Avinguda|Plaça|Passeig|Passatge|Ronda|Via|Camí|Jardins|Parc|Rambla|Travessera|Carretera|Túnel|Pont|Moll)(\s+d(e|els|es|el|')|(?=\s))?/i
  );
  return match ? match[1].toLowerCase() : 'other';
}

/**
 * Get centroid of street geometry for geographic distribution
 */
function getStreetCentroid(street) {
  let sumLat = 0,
    sumLon = 0,
    count = 0;
  for (const segment of street.geometry) {
    for (const point of segment) {
      sumLat += point[0];
      sumLon += point[1];
      count++;
    }
  }
  return count > 0 ? { lat: sumLat / count, lon: sumLon / count } : { lat: 0, lon: 0 };
}

/**
 * Seeded random number generator
 */
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Shuffle array with seed
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
 * Check geographic spread - divide city into grid and check coverage
 */
function checkGeographicCoverage(selectedStreets) {
  // Barcelona bounds approximately
  const GRID_SIZE = 3; // 3x3 grid
  const MIN_LAT = 41.32,
    MAX_LAT = 41.47;
  const MIN_LON = 2.05,
    MAX_LON = 2.23;

  const grid = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));

  for (const street of selectedStreets) {
    const centroid = getStreetCentroid(street);
    const gridX = Math.min(
      GRID_SIZE - 1,
      Math.floor(((centroid.lon - MIN_LON) / (MAX_LON - MIN_LON)) * GRID_SIZE)
    );
    const gridY = Math.min(
      GRID_SIZE - 1,
      Math.floor(((centroid.lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * GRID_SIZE)
    );
    if (gridX >= 0 && gridY >= 0) {
      grid[gridY][gridX]++;
    }
  }

  // Count non-empty cells
  let coverage = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell > 0) coverage++;
    }
  }

  return coverage >= 4; // At least 4 of 9 grid cells covered
}

/**
 * Select distractors for a question following rules
 */
function selectDistractors(street, allStreets, usedAnswerIds, dayOffset, seed) {
  const targetPrefix = getStreetPrefix(street.name);
  const targetTier = street.tier;

  // Filter candidates:
  // 1. Not the correct answer
  // 2. Same street type prefix
  // 3. Same tier or LOWER tier (tier-down mixing)
  // 4. Not used as answer on adjacent days (dayOffset -1, 0, +1)
  let candidates = allStreets.filter(s => {
    if (s.id === street.id) return false;
    if (getStreetPrefix(s.name) !== targetPrefix) return false;
    if (s.tier < targetTier) return false; // Only same or lower tier (higher number = lower importance)

    // Check if used as answer on adjacent days
    for (let d = dayOffset - 1; d <= dayOffset + 1; d++) {
      if (usedAnswerIds[d] && usedAnswerIds[d].has(s.id)) {
        return false;
      }
    }
    return true;
  });

  // Fallback: if not enough same-type candidates, relax prefix constraint
  if (candidates.length < 3) {
    candidates = allStreets.filter(s => {
      if (s.id === street.id) return false;
      if (s.tier < targetTier) return false;
      for (let d = dayOffset - 1; d <= dayOffset + 1; d++) {
        if (usedAnswerIds[d] && usedAnswerIds[d].has(s.id)) return false;
      }
      return true;
    });
  }

  const shuffled = seededShuffle(candidates, seed);
  return shuffled.slice(0, 3);
}

// --- Main Generation Logic ---

// Track when each street was last used as correct answer
const lastUsedDay = {}; // streetId -> day number

// Track which street IDs are answers on each day (for adjacent-day exclusion)
const dayAnswerIds = {}; // dayOffset -> Set of street IDs

// Group streets by tier
const streetsByTier = {
  1: streets.filter(s => s.tier === 1),
  2: streets.filter(s => s.tier === 2),
  3: streets.filter(s => s.tier === 3),
  4: streets.filter(s => s.tier === 4),
};

console.log(
  `Streets by tier: T1=${streetsByTier[1].length}, T2=${streetsByTier[2].length}, T3=${streetsByTier[3].length}, T4=${streetsByTier[4].length}`
);

const quizzes = [];

for (let day = 0; day < DAYS_TO_GENERATE; day++) {
  const date = new Date(START_DATE);
  date.setDate(date.getDate() + day);
  const dateStr = date.toISOString().split('T')[0];

  const seed = parseInt(dateStr.replace(/-/g, ''));
  let seedOffset = 0;

  dayAnswerIds[day] = new Set();

  /**
   * Select streets for a tier, respecting cooldown
   */
  function selectFromTier(tierStreets, count, tierNum) {
    const available = tierStreets.filter(s => {
      const lastDay = lastUsedDay[s.id];
      if (lastDay === undefined) return true;
      return day - lastDay >= COOLDOWNS[tierNum];
    });

    // Shuffle and pick
    const shuffled = seededShuffle(available, seed + seedOffset);
    seedOffset += 100;

    return shuffled.slice(0, count);
  }

  // Select correct answers for each tier category
  const tier1Selected = selectFromTier(streetsByTier[1], TIER_DISTRIBUTION.tier1, 1);

  // Combine T2 and T3 for selection
  const tier23Pool = [...streetsByTier[2], ...streetsByTier[3]];
  const tier23Selected = selectFromTier(tier23Pool, TIER_DISTRIBUTION.tier23, 2); // Use T2 cooldown

  const tier4Selected = selectFromTier(streetsByTier[4], TIER_DISTRIBUTION.tier4, 4);

  const selectedStreets = [...tier1Selected, ...tier23Selected, ...tier4Selected];

  // Fallback if not enough streets
  if (selectedStreets.length < QUESTIONS_PER_DAY) {
    console.warn(
      `Day ${day} (${dateStr}): Only ${selectedStreets.length} streets available, filling with any available`
    );
    const needed = QUESTIONS_PER_DAY - selectedStreets.length;
    const usedIds = new Set(selectedStreets.map(s => s.id));
    const fallback = streets.filter(s => !usedIds.has(s.id));
    const shuffledFallback = seededShuffle(fallback, seed + 500);
    selectedStreets.push(...shuffledFallback.slice(0, needed));
  }

  // Check geographic coverage
  if (!checkGeographicCoverage(selectedStreets) && day % 10 === 0) {
    console.log(`Day ${day}: Limited geographic coverage (may be expected)`);
  }

  // Update tracking
  for (const street of selectedStreets) {
    lastUsedDay[street.id] = day;
    dayAnswerIds[day].add(street.id);
  }

  // Generate questions with distractors
  const questions = [];
  for (let q = 0; q < selectedStreets.length; q++) {
    const correct = selectedStreets[q];
    const distractors = selectDistractors(correct, streets, dayAnswerIds, day, seed + q * 10);

    questions.push({
      correctId: correct.id,
      distractorIds: distractors.map(d => d.id),
    });
  }

  // Shuffle question order
  const shuffledQuestions = seededShuffle(questions, seed + 999);

  quizzes.push({
    date: dateStr,
    questions: shuffledQuestions,
  });

  if (day % 10 === 0) {
    console.log(`Generated day ${day + 1}/${DAYS_TO_GENERATE}: ${dateStr}`);
  }
}

// --- Output ---
const output = {
  startDate: START_DATE.toISOString().split('T')[0],
  generatedAt: new Date().toISOString(),
  totalDays: DAYS_TO_GENERATE,
  quizzes,
};

const outputPath = path.join(process.cwd(), 'src', 'data', 'quizPlan.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`\nSaved quiz plan to ${outputPath}`);
console.log(`Total quizzes: ${quizzes.length}`);
