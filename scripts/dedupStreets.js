import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { bboxPolygon, multiLineString, booleanDisjoint } from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const streetsPath = path.join(__dirname, '../src/data/streets.json');
const rawStreets = JSON.parse(fs.readFileSync(streetsPath, 'utf8'));

console.log(`Original count: ${rawStreets.length}`);

// Barcelona Bounds (approx)
// SW: 41.32, 2.05
// NE: 41.47, 2.23
const EXTENT = [2.05, 41.32, 2.23, 41.47]; // minX, minY, maxX, maxY
const bboxPoly = bboxPolygon(EXTENT);

const streetMap = new Map();

rawStreets.forEach(street => {
  // Normalize name
  let name = street.name.trim();
  // Remove parentheticals like (central), (lateral)
  name = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  // Normalization quirks?
  // name = name.replace('Av.', 'Avinguda'); // Optional logic if needed

  if (!streetMap.has(name)) {
    streetMap.set(name, {
      id: street.id, // Keep first ID
      name: name,
      tier: street.tier,
      geometry: [],
    });
  }

  const entry = streetMap.get(name);
  // Add all line segments
  street.geometry.forEach(line => {
    entry.geometry.push(line);
  });
  // Keep lowest tier (1 is best/most important)
  if (street.tier < entry.tier) {
    entry.tier = street.tier;
  }
});

const mergedStreets = [];

for (const street of streetMap.values()) {
  let isInside = false;

  // Check bounding box overlap
  try {
    const coords = street.geometry.map(line => line.map(p => [p[1], p[0]])); // Swap lat/lng to lng/lat
    const multiLine = multiLineString(coords);

    if (!booleanDisjoint(multiLine, bboxPoly)) {
      // It intersects or is inside
      isInside = true;
    }
  } catch (e) {
    console.warn(`Error checking bounds for ${street.name}:`, e.message);
    if (street.tier <= 2) isInside = true;
  }

  if (isInside) {
    mergedStreets.push(street);
  }
}

console.log(`Merged and Filtered count: ${mergedStreets.length}`);

// Write back
fs.writeFileSync(streetsPath, JSON.stringify(mergedStreets, null, 2));
console.log('Done.');
