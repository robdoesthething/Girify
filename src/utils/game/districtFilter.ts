import { Street } from '../../types/game';

interface DistrictBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Approximate bounding boxes for each Barcelona district.
// These intentionally overlap near borders so boundary streets appear in
// adjacent districts; however the actual assignment uses a best-district
// algorithm (see filterStreetsByDistrict) to avoid streets from one district
// appearing in a clearly different one just because the boxes overlap.
const DISTRICT_BOUNDS: Record<string, DistrictBounds> = {
  ciutat_vella: { minLat: 41.373, maxLat: 41.393, minLng: 2.163, maxLng: 2.197 },
  eixample: { minLat: 41.376, maxLat: 41.4, minLng: 2.138, maxLng: 2.196 },
  sants_montjuic: { minLat: 41.325, maxLat: 41.386, minLng: 2.09, maxLng: 2.166 },
  les_corts: { minLat: 41.367, maxLat: 41.4, minLng: 2.105, maxLng: 2.143 },
  sarria_sant_gervasi: { minLat: 41.38, maxLat: 41.462, minLng: 2.088, maxLng: 2.15 },
  gracia: { minLat: 41.4, maxLat: 41.43, minLng: 2.146, maxLng: 2.178 },
  horta_guinardo: { minLat: 41.405, maxLat: 41.46, minLng: 2.148, maxLng: 2.19 },
  nou_barris: { minLat: 41.428, maxLat: 41.48, minLng: 2.15, maxLng: 2.208 },
  sant_andreu: { minLat: 41.416, maxLat: 41.464, minLng: 2.174, maxLng: 2.218 },
  sant_marti: { minLat: 41.384, maxLat: 41.432, minLng: 2.18, maxLng: 2.232 },
};

const ALL_BOUNDS = Object.entries(DISTRICT_BOUNDS);

// Streets within 12 percentage-points of the best-matching district are
// considered border streets and may appear in multiple adjacent districts.
const BORDER_TOLERANCE = 0.12;

function pctInBounds(points: number[][], b: DistrictBounds): number {
  if (points.length === 0) {
    return 0;
  }
  const inside = points.filter(
    p =>
      (p[0] ?? 0) >= b.minLat &&
      (p[0] ?? 0) <= b.maxLat &&
      (p[1] ?? 0) >= b.minLng &&
      (p[1] ?? 0) <= b.maxLng
  ).length;
  return inside / points.length;
}

export function filterStreetsByDistrict(streets: Street[], districtId: string): Street[] {
  const targetBounds = DISTRICT_BOUNDS[districtId];
  if (!targetBounds) {
    return streets;
  }

  return streets.filter(street => {
    const allPoints = street.geometry.flat();
    if (allPoints.length === 0) {
      return false;
    }

    const targetPct = pctInBounds(allPoints, targetBounds);
    if (targetPct === 0) {
      return false;
    }

    // Find the highest score across all districts.
    // A street is included only when the target district is the best match
    // or within BORDER_TOLERANCE of it (genuine boundary streets).
    const bestPct = Math.max(...ALL_BOUNDS.map(([, b]) => pctInBounds(allPoints, b)));
    return targetPct >= bestPct - BORDER_TOLERANCE;
  });
}
