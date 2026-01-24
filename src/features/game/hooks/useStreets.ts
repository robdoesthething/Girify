import booleanDisjoint from '@turf/boolean-disjoint';
import centroid from '@turf/centroid';
import turfDistance from '@turf/distance';
import { multiLineString, point } from '@turf/helpers';
import { useCallback, useEffect, useState } from 'react';
import { Street } from '../../../types/game';

// --- Constants ---
const HINTS_LIMIT = 3;

// --- Helper Functions ---

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

const processStreetsData = (rawStreets: Street[]): Street[] => {
  const streets = rawStreets;
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
};

// Use 'any' return type compatible with Turf's Position[] expectation to avoid type errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toTurf = (lines: number[][][]): any[][] =>
  lines.map(line =>
    line
      .filter(p => p && typeof p[0] === 'number' && typeof p[1] === 'number')
      .map(p => [p[1], p[0]])
  );

/**
 * Hook for managing street data - validation and hint calculation
 * @returns {Object} { validStreets, getHintStreets, isLoading }
 */
export const useStreets = () => {
  const [validStreets, setValidStreets] = useState<Street[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStreets = async () => {
      try {
        // Dynamic import to split chunk
        const module = await import('../../../data/streets.json');
        const rawStreets = module.default as Street[];

        if (mounted) {
          const processed = processStreetsData(rawStreets);
          setValidStreets(processed);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load streets data:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadStreets();

    return () => {
      mounted = false;
    };
  }, []);

  const getIntersectionHints = useCallback(
    (currentGeo: any, targetId: string | number, streets: Street[]): Street[] => {
      const hints: Street[] = [];

      for (const street of streets) {
        if (street.id === targetId) {
          continue;
        }

        if (street.geometry && street.geometry.length > 0) {
          const processedGeo = toTurf(street.geometry!);
          if (processedGeo.length > 0 && processedGeo[0] && processedGeo[0]!.length > 0) {
            const otherGeo = multiLineString(processedGeo);
            if (!booleanDisjoint(currentGeo, otherGeo)) {
              hints.push(street);
              if (hints.length >= HINTS_LIMIT) {
                break;
              }
            }
          }
        }
      }
      return hints;
    },
    []
  );

  const getDistanceHints = useCallback(
    (
      currentGeo: any,
      targetId: string | number,
      streets: Street[],
      existingHints: Street[]
    ): Street[] => {
      const candidates: { street: Street; dist: number }[] = [];
      const currentCentroid = centroid(currentGeo);

      for (const street of streets) {
        if (street.id === targetId) {
          continue;
        }
        if (existingHints.some(h => h.id === street.id)) {
          continue;
        }

        if (
          street.geometry &&
          street.geometry.length > 0 &&
          street.geometry[0] &&
          street.geometry[0]!.length > 0
        ) {
          const p1 = street.geometry[0]?.[0];
          if (p1 && typeof p1[0] === 'number' && typeof p1[1] === 'number') {
            const otherPoint = point([p1[1], p1[0]]);
            const dist = turfDistance(currentCentroid, otherPoint);
            candidates.push({ street, dist });
          }
        }
      }

      candidates.sort((a, b) => a.dist - b.dist);
      const needed = HINTS_LIMIT - existingHints.length;
      return candidates.slice(0, needed).map(c => c.street);
    },
    []
  );

  const getHintStreets = useCallback(
    (targetStreet: Street) => {
      if (!targetStreet || validStreets.length === 0) {
        return [];
      }

      try {
        const currentGeo = multiLineString(toTurf(targetStreet.geometry));

        let hints = getIntersectionHints(currentGeo, targetStreet.id, validStreets);

        if (hints.length < HINTS_LIMIT) {
          const distanceHints = getDistanceHints(currentGeo, targetStreet.id, validStreets, hints);
          hints = [...hints, ...distanceHints];
        }

        return hints;
      } catch (e) {
        console.error('Turf error in getHintStreets:', e);
        return [];
      }
    },
    [validStreets, getIntersectionHints, getDistanceHints]
  );

  return { validStreets, getHintStreets, isLoading };
};

export default useStreets;
