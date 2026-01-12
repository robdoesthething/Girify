import { useMemo, useCallback } from 'react';
import * as turf from '@turf/turf';
import rawStreets from '../data/streets.json';

/**
 * Hook for managing street data - validation and hint calculation
 * @returns {Object} { validStreets, getHintStreets }
 */
export const useStreets = () => {
  // Memoize valid streets - filters out highways and deduplicates
  const validStreets = useMemo(() => {
    const isValidType = name => {
      if (!name) return false;
      const lower = name.toLowerCase();
      return (
        !lower.includes('autopista') &&
        !lower.includes('autovia') &&
        !lower.includes('b-1') &&
        !lower.includes('b-2')
      );
    };

    const rawValidStreets = rawStreets.filter(
      s => isValidType(s.name) && s.geometry && s.geometry.length > 0
    );

    // Deduplicate by name, keeping the one with most geometry points
    const uniqueStreetsMap = new Map();
    rawValidStreets.forEach(s => {
      if (!uniqueStreetsMap.has(s.name)) {
        uniqueStreetsMap.set(s.name, s);
      } else {
        const existing = uniqueStreetsMap.get(s.name);
        const currentLength = s.geometry.flat().length;
        const existingLength = existing.geometry.flat().length;
        if (currentLength > existingLength) {
          uniqueStreetsMap.set(s.name, s);
        }
      }
    });

    return Array.from(uniqueStreetsMap.values());
  }, []);

  /**
   * Calculate hint streets (streets that intersect with target)
   * @param {Object} targetStreet - The current street to find hints for
   * @returns {Array} Up to 3 streets that intersect or are near target
   */
  const getHintStreets = useCallback(targetStreet => {
    if (!targetStreet) return [];

    const toTurf = lines => lines.map(line => line.map(p => [p[1], p[0]]));
    let hints = [];

    try {
      const currentGeo = turf.multiLineString(toTurf(targetStreet.geometry));

      // Find intersecting streets
      for (const street of rawStreets) {
        if (street.id === targetStreet.id) continue;
        const lower = street.name.toLowerCase();
        if (lower.includes('autopista') || lower.includes('autovia') || lower.includes('ronda'))
          continue;

        if (street.geometry) {
          const otherGeo = turf.multiLineString(toTurf(street.geometry));
          if (!turf.booleanDisjoint(currentGeo, otherGeo)) {
            hints.push(street);
            if (hints.length >= 3) break;
          }
        }
      }

      // If not enough intersecting streets, find nearest
      if (hints.length < 3) {
        const currentCentroid = turf.centroid(currentGeo);
        const candidates = [];

        for (const street of rawStreets) {
          if (street.id === targetStreet.id) continue;
          if (hints.some(h => h.id === street.id)) continue;
          const lower = street.name.toLowerCase();
          if (lower.includes('autopista') || lower.includes('autovia') || lower.includes('ronda'))
            continue;

          if (street.geometry) {
            const p1 = street.geometry[0][0];
            const otherPoint = turf.point([p1[1], p1[0]]);
            const dist = turf.distance(currentCentroid, otherPoint);
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

  return { validStreets, getHintStreets, rawStreets };
};

export default useStreets;
