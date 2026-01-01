import { selectDailyStreets } from './src/utils/dailyChallenge.js';
import fs from 'fs';

const rawStreets = JSON.parse(fs.readFileSync('./src/data/streets.json', 'utf8'));

console.log(`Total raw streets: ${rawStreets.length}`);
const seed = 20250101;
const result = selectDailyStreets(rawStreets, seed);
console.log(`Real selected count: ${result.length}`);

// Debugging logic inside selectDailyStreets
const shuffled = rawStreets; // approximating what happens inside
const tier1 = shuffled.filter(s => s.tier === 1).slice(0, 3);
const tier2 = shuffled.filter(s => s.tier === 2).slice(0, 3);
const tier3 = shuffled.filter(s => s.tier === 3).slice(0, 2);
const tier4 = shuffled.filter(s => s.tier === 4).slice(0, 2);
let selected = [...tier1, ...tier2, ...tier3, ...tier4];
console.log(`Tier logic yields: ${selected.length}`);
if (selected.length < 10) {
    selected = shuffled.slice(0, 10);
    console.log(`Fallback yields: ${selected.length}`);
}
