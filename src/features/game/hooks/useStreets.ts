import booleanDisjoint from '@turf/boolean-disjoint';
import centroid from '@turf/centroid';
import turfDistance from '@turf/distance';
import { multiLineString, point } from '@turf/helpers';
import type { Feature, MultiLineString, Position } from 'geojson';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Street } from '../../../types/game';

// --- Constants ---
const HINTS_LIMIT = 3;
const STREETS_CACHE_KEY = 'girify_streets_cache';
const STREETS_VERSION_KEY = 'girify_streets_version';
// Bump this when streets.json changes to invalidate cache
const STREETS_VERSION = '1';

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
  const rawValidStreets = rawStreets.filter(
    s => isValidType(s.name) && s.geometry && s.geometry.length > 0
  );

  // Deduplicate by name, keeping the one with most geometry points
  // Pre-compute flat lengths to avoid redundant .flat() calls
  const uniqueStreetsMap = new Map<string, { street: Street; geomLength: number }>();
  rawValidStreets.forEach(s => {
    const geomLength = s.geometry.flat().length;
    const existing = uniqueStreetsMap.get(s.name);
    if (!existing || geomLength > existing.geomLength) {
      uniqueStreetsMap.set(s.name, { street: s, geomLength });
    }
  });

  return Array.from(uniqueStreetsMap.values()).map(v => v.street);
};

const toTurf = (lines: number[][][]): Position[][] =>
  lines.map(line =>
    line
      .filter(p => p && typeof p[0] === 'number' && typeof p[1] === 'number')
      .map(p => [p[1], p[0]] as Position)
  );

/**
 * Hook for managing street data - validation and hint calculation
 * @returns {Object} { validStreets, getHintStreets, isLoading }
 */
export const useStreets = () => {
  const [validStreets, setValidStreets] = useState<Street[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hintCache = useRef<Map<string | number, Street[]>>(new Map());

  useEffect(() => {
    let mounted = true;

    const loadStreets = async () => {
      try {
        // Try localStorage cache first
        const cachedVersion = localStorage.getItem(STREETS_VERSION_KEY);
        if (cachedVersion === STREETS_VERSION) {
          const cached = localStorage.getItem(STREETS_CACHE_KEY);
          if (cached) {
            // Unblock main thread to allow "Loading..." state to render
            await new Promise(resolve => setTimeout(resolve, 0));
            const processed = JSON.parse(cached) as Street[];
            if (mounted && processed.length > 0) {
              setValidStreets(processed);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fetch from static assets
        const response = await fetch('/streets.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch streets: ${response.statusText}`);
        }
        const rawStreets = (await response.json()) as Street[];

        if (mounted) {
          // Process data (Computationally expensive)
          // Ensure this runs after a tick
          await new Promise(resolve => setTimeout(resolve, 0));

          const processed = processStreetsData(rawStreets);
          setValidStreets(processed);
          setIsLoading(false);

          // Cache processed data - Defer to avoid blocking commit
          setTimeout(() => {
            try {
              localStorage.setItem(STREETS_CACHE_KEY, JSON.stringify(processed));
              localStorage.setItem(STREETS_VERSION_KEY, STREETS_VERSION);
            } catch {
              // localStorage full or unavailable — ignore
            }
          }, 100);
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

  // Clear hint cache when streets change
  useEffect(() => {
    hintCache.current.clear();
  }, [validStreets]);

  const getIntersectionHints = useCallback(
    (
      currentGeo: Feature<MultiLineString>,
      targetId: string | number,
      streets: Street[]
    ): Street[] => {
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
              // eslint-disable-next-line max-depth
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
      currentGeo: Feature<MultiLineString>,
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

      // Check cache
      const cached = hintCache.current.get(targetStreet.id);
      if (cached) {
        return cached;
      }

      try {
        const currentGeo = multiLineString(toTurf(targetStreet.geometry));

        let hints = getIntersectionHints(currentGeo, targetStreet.id, validStreets);

        if (hints.length < HINTS_LIMIT) {
          const distanceHints = getDistanceHints(currentGeo, targetStreet.id, validStreets, hints);
          hints = [...hints, ...distanceHints];
        }

        // Cache result
        hintCache.current.set(targetStreet.id, hints);
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
