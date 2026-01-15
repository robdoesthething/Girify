import booleanDisjoint from '@turf/boolean-disjoint';
import centroid from '@turf/centroid';
import turfDistance from '@turf/distance';
import { multiLineString, point } from '@turf/helpers';
import { useCallback } from 'react';
// @ts-ignore
import rawStreets from '../data/streets.json';
import { Street } from '../types/game';

// --- Static Data Initialization ---
// Calculate this once at module load time, not on every render

const isValidType = (name: string): boolean => {
  if (!name) {
    return false;
  }
  const lower = name.toLowerCase();
  return (
    !lower.includes('autopista') &&
    !lower.includes('autovia') &&
    !lower.includes('b-1') &&
    !lower.includes('b-2')
  );
};

const validStreetsData: Street[] = (() => {
  const streets = rawStreets as Street[];
  const rawValidStreets = streets.filter(
    s => isValidType(s.name) && s.geometry && s.geometry.length > 0
  );

  // Deduplicate by name, keeping the one with most geometry points
  const uniqueStreetsMap = new Map<string, Street>();
  rawValidStreets.forEach(s => {
    if (!uniqueStreetsMap.has(s.name)) {
      uniqueStreetsMap.set(s.name, s);
    } else {
      const existing = uniqueStreetsMap.get(s.name)!;
      const currentLength = s.geometry.flat().length;
      const existingLength = existing.geometry.flat().length;
      if (currentLength > existingLength) {
        uniqueStreetsMap.set(s.name, s);
      }
    }
  });

  return Array.from(uniqueStreetsMap.values());
})();

/**
 * Hook for managing street data - validation and hint calculation
 * @returns {Object} { validStreets, getHintStreets }
 */
export const useStreets = () => {
  /**
   * Calculate hint streets (streets that intersect with target)
   * @param {Object} targetStreet - The current street to find hints for
   * @returns {Array} Up to 3 streets that intersect or are near target
   */
  const getHintStreets = useCallback((targetStreet: Street) => {
    if (!targetStreet) {
      return [];
    }

    const toTurf = (lines: number[][][]) => lines.map(line => line.map(p => [p[1], p[0]]));
    let hints: Street[] = [];

    try {
      const currentGeo = multiLineString(toTurf(targetStreet.geometry));

      // OPTIMIZATION: Iterate over validStreetsData instead of rawStreets
      // This is smaller and already filtered/deduped
      for (const street of validStreetsData) {
        if (street.id === targetStreet.id) {
          continue;
        }

        // No need to check isValidType here as validStreetsData is already filtered

        if (street.geometry) {
          const otherGeo = multiLineString(toTurf(street.geometry));
          if (!booleanDisjoint(currentGeo, otherGeo)) {
            hints.push(street);
            if (hints.length >= 3) {
              break;
            }
          }
        }
      }

      // If not enough intersecting streets, find nearest
      if (hints.length < 3) {
        const currentCentroid = centroid(currentGeo);
        const candidates: { street: Street; dist: number }[] = [];

        for (const street of validStreetsData) {
          if (street.id === targetStreet.id) {
            continue;
          }
          if (hints.some(h => h.id === street.id)) {
            continue;
          }

          if (street.geometry) {
            const p1 = street.geometry[0][0];
            const otherPoint = point([p1[1], p1[0]]);
            const dist = turfDistance(currentCentroid, otherPoint);
            candidates.push({ street, dist });
          }
        }

        candidates.sort((a, b) => a.dist - b.dist);
        const needed = 3 - hints.length;
        const extra = candidates.slice(0, needed).map(c => c.street);
        hints = [...hints, ...extra];
      }
    } catch (e) {
      console.error('Turf error in getHintStreets:', e);
    }

    return hints;
  }, []);

  return { validStreets: validStreetsData, getHintStreets, rawStreets: rawStreets as Street[] };
};

export default useStreets;
