import fs from 'fs';
import path from 'path';

// using a different mirror that might be less loaded
const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter';
// const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Query for Barcelona streets
// Focusing on named residential, tertiary, secondary, primary, trunk
// STRICTLY within Barcelona city limits (admin_level=8)
// Query for Barcelona streets
// Focusing on named residential, tertiary, secondary, primary, trunk
// STRICTLY within Barcelona city limits (admin_level=8)
const query = `
    [out:json][timeout:180];
    relation(347950);
    map_to_area->.searchArea;
    (
      way["highway"~"^(primary|trunk|secondary|tertiary|residential|living_street|pedestrian)$"]["name"](area.searchArea);
    );
    out geom;
`;

const BOUNDARY_QUERY = `
    [out:json][timeout:180];
    relation(347950);
    out geom;
`;

const TIER_MAPPING = {
  trunk: 1,
  primary: 1,
  secondary: 2,
  tertiary: 3,
  residential: 4,
  living_street: 4,
  pedestrian: 4,
};

async function fetchStreets() {
  console.log('Fetching Barcelona streets from Overpass API...');

  let data = null;

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    data = await response.json();
    console.log(`Received ${data.elements.length} street segments.`);

    // Process data if successful
    const streetsMap = new Map();

    data.elements.forEach(element => {
      if (!element.tags || !element.tags.name) return;

      let name = element.tags.name.trim();
      // Normalize: remove parentheticals like (central), (lateral) to deduplicate
      name = name.replace(/\s*\(.*?\)\s*/g, '').trim();

      const type = element.tags.highway;
      // Initial tier from mapping
      const tier = TIER_MAPPING[type] || 4;

      // Normalize coordinate to [lat, lon] and round to 5 decimals (~1m precision)
      const geometry = element.geometry.map(p => [
        Number(p.lat.toFixed(5)),
        Number(p.lon.toFixed(5)),
      ]);

      if (!streetsMap.has(name)) {
        streetsMap.set(name, {
          name: name,
          tier: tier,
          type: type, // Store initial type, though it might differ per segment
          segments: [],
        });
      } else {
        // If street already exists, check if this segment implies a better (lower) tier
        const entry = streetsMap.get(name);
        if (tier < entry.tier) {
          entry.tier = tier;
          entry.type = type; // Update type to the more important one
        }
      }

      streetsMap.get(name).segments.push(geometry);
    });

    const streetsRaw = Array.from(streetsMap.values());

    // Recalculate tiers based on full street data (total length)
    streetsRaw.forEach(street => {
      const totalPoints = street.segments.reduce((acc, seg) => acc + seg.length, 0);

      // Promote major pedestrian streets
      if (street.type === 'pedestrian' || street.type === 'living_street') {
        if (totalPoints > 150) {
          street.tier = 1; // Major pedestrian hubs (e.g. La Rambla)
        } else if (totalPoints > 50) {
          street.tier = 2; // Significant pedestrian streets
        }
        // Else remains Tier 4
      }

      // Optional: Demote very short primary/secondary segments if they are likely noise?
      // For now, let's stick to promoting pedestrian streets.
    });

    const streets = streetsRaw.filter(() => {
      // Keep all streets for now, maybe filter very tiny ones if needed later
      return true;
    });

    streets.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return b.segments.length - a.segments.length; // Secondary sort by size
    });

    const finalStreets = [];
    for (let t = 1; t <= 4; t++) {
      const tierStreets = streets.filter(s => s.tier === t);
      console.log(`Tier ${t} count: ${tierStreets.length}`);
      finalStreets.push(...tierStreets);
    }

    const simplifiedStreets = finalStreets.map((s, index) => ({
      id: String(index + 1),
      name: s.name,
      tier: s.tier,
      geometry: s.segments,
    }));

    const outputPath = path.join(process.cwd(), 'src', 'data', 'streets.json');
    fs.writeFileSync(outputPath, JSON.stringify(simplifiedStreets, null, 2));
    console.log(`Saved ${simplifiedStreets.length} streets to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching/processing streets:', error);
  }

  // --- Fetch Boundary ---
  console.log('Fetching Barcelona boundary...');
  try {
    const boundaryResponse = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(BOUNDARY_QUERY)}`,
    });

    if (!boundaryResponse.ok) {
      console.error('Failed to fetch boundary, status:', boundaryResponse.status);
    } else {
      const text = await boundaryResponse.text();
      try {
        const boundaryData = JSON.parse(text);
        const boundaryRel = boundaryData.elements.find(e => e.type === 'relation');

        let boundaryCoords = [];
        if (boundaryRel && boundaryRel.members) {
          boundaryCoords = boundaryRel.members
            .filter(m => m.role === 'outer' && m.geometry)
            .map(m => m.geometry.map(p => [p.lat, p.lon]));
        }

        if (boundaryCoords.length > 0) {
          const boundaryPath = path.join(process.cwd(), 'src', 'data', 'boundary.json');
          fs.writeFileSync(boundaryPath, JSON.stringify(boundaryCoords, null, 2));
          console.log(`Saved boundary to ${boundaryPath}`);
        } else {
          console.log('No partial boundary geometry found (might need full relation download).');
        }
      } catch (e) {
        console.error('Failed to parse boundary JSON', e);
      }
    }
  } catch (e) {
    console.error('Boundary fetch error:', e);
  }
  // --- End Boundary Fetch ---
}

fetchStreets();
