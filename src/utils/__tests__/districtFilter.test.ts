import { describe, expect, it } from 'vitest';
import type { Street } from '../../types/game';
import { filterStreetsByDistrict } from '../game/districtFilter';

// Helper: build a minimal Street fixture with a single coordinate
function makeStreet(id: string, lat: number, lng: number): Street {
  return {
    id,
    name: `Street ${id}`,
    geometry: [[[lat, lng]]],
  };
}

describe('filterStreetsByDistrict', () => {
  it('returns streets whose centroid falls inside the district bounding box', () => {
    // eixample bbox: lat 41.376–41.4, lng 2.138–2.196
    const inside = makeStreet('in', 41.39, 2.165);
    const outside = makeStreet('out', 41.45, 2.22);

    const result = filterStreetsByDistrict([inside, outside], 'eixample');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('in');
  });

  it('returns only streets strictly within the bounding box (centroid check)', () => {
    // gracia bbox: lat 41.4–41.43, lng 2.146–2.178
    const a = makeStreet('a', 41.415, 2.16); // inside
    const b = makeStreet('b', 41.44, 2.16); // outside (too high)
    const c = makeStreet('c', 41.415, 2.18); // outside (too far east)

    const result = filterStreetsByDistrict([a, b, c], 'gracia');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('a');
  });

  it('uses centroid for multi-point streets', () => {
    // Centroid of these two points: lat ~41.39, lng ~2.165 — inside eixample
    const multiPoint: Street = {
      id: 'multi',
      name: 'Multi Point Street',
      geometry: [[[41.38, 2.16]], [[41.4, 2.17]]],
    };

    const result = filterStreetsByDistrict([multiPoint], 'eixample');

    expect(result).toHaveLength(1);
  });

  it('excludes streets with empty geometry (no centroid)', () => {
    const empty: Street = { id: 'empty', name: 'Empty', geometry: [] };
    const result = filterStreetsByDistrict([empty], 'eixample');
    expect(result).toHaveLength(0);
  });

  it('returns all streets unchanged for an unknown districtId', () => {
    const streets = [makeStreet('a', 41.39, 2.165), makeStreet('b', 41.5, 2.3)];

    const result = filterStreetsByDistrict(streets, 'unknown_district');

    expect(result).toHaveLength(2);
  });

  it('returns empty array when input is empty', () => {
    const result = filterStreetsByDistrict([], 'eixample');
    expect(result).toHaveLength(0);
  });

  it('covers all known district keys without throwing', () => {
    const district_ids = [
      'ciutat_vella',
      'eixample',
      'sants_montjuic',
      'les_corts',
      'sarria_sant_gervasi',
      'gracia',
      'horta_guinardo',
      'nou_barris',
      'sant_andreu',
      'sant_marti',
    ];

    const streets = [makeStreet('x', 41.39, 2.165)];

    for (const id of district_ids) {
      expect(() => filterStreetsByDistrict(streets, id)).not.toThrow();
    }
  });
});
