import { Street } from '../../types/game';

interface DistrictBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Approximate bounding boxes for each Barcelona district.
// Streets whose centroid falls inside a box are considered part of that district.
// Boxes intentionally overlap near borders so boundary streets appear in both adjacent
// districts during practice — a better UX than silently excluding them.
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

function getStreetCentroid(street: Street): { lat: number; lng: number } | null {
  const allPoints = street.geometry.flat();
  if (allPoints.length === 0) {
    return null;
  }
  const lat = allPoints.reduce((sum, p) => sum + (p[0] ?? 0), 0) / allPoints.length;
  const lng = allPoints.reduce((sum, p) => sum + (p[1] ?? 0), 0) / allPoints.length;
  return { lat, lng };
}

export function filterStreetsByDistrict(streets: Street[], districtId: string): Street[] {
  const bounds = DISTRICT_BOUNDS[districtId];
  if (!bounds) {
    return streets;
  }

  return streets.filter(street => {
    const centroid = getStreetCentroid(street);
    if (!centroid) {
      return false;
    }
    return (
      centroid.lat >= bounds.minLat &&
      centroid.lat <= bounds.maxLat &&
      centroid.lng >= bounds.minLng &&
      centroid.lng <= bounds.maxLng
    );
  });
}
