import { describe, it, expect } from 'vitest';
import { Street } from '../../../types/game';
import { generateOptionsList, generatePracticeQuestion } from '../gameHelpers';

const mockStreets: Street[] = Array.from({ length: 20 }, (_, i) => ({
  id: `${i}`,
  name: `Street ${i}`,
  tier: (i % 4) + 1,
  geometry: [[[]]],
}));

describe('generateOptionsList', () => {
  it('accepts an explicit baseSeed and is deterministic for it', () => {
    const a = generateOptionsList(mockStreets[0]!, mockStreets, 0, 12345);
    const b = generateOptionsList(mockStreets[0]!, mockStreets, 0, 12345);
    expect(a).toEqual(b);
  });

  it('produces different options for different baseSeeds', () => {
    const a = generateOptionsList(mockStreets[0]!, mockStreets, 0, 12345);
    const b = generateOptionsList(mockStreets[0]!, mockStreets, 0, 99999);
    expect(a).not.toEqual(b);
  });

  it('still works with no baseSeed argument (existing daily-mode callers)', () => {
    const result = generateOptionsList(mockStreets[0]!, mockStreets, 0);
    expect(result).toHaveLength(4);
    expect(result).toContainEqual(mockStreets[0]);
  });
});

describe('generatePracticeQuestion', () => {
  it('returns null when there are no valid streets', () => {
    expect(generatePracticeQuestion([], 12345, 0)).toBeNull();
  });

  it('returns a street and 4 options for a valid pool', () => {
    const result = generatePracticeQuestion(mockStreets, 12345, 0);
    expect(result).not.toBeNull();
    expect(result!.options).toHaveLength(4);
    expect(result!.options).toContainEqual(result!.street);
  });

  it('is deterministic for the same seed and index', () => {
    const a = generatePracticeQuestion(mockStreets, 12345, 3);
    const b = generatePracticeQuestion(mockStreets, 12345, 3);
    expect(a).toEqual(b);
  });

  it('produces different streets across increasing question indexes', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const q = generatePracticeQuestion(mockStreets, 12345, i);
      seen.add(q!.street.id);
    }
    // Not asserting all-unique (pool is small), just that it isn't stuck on one street
    expect(seen.size).toBeGreaterThan(1);
  });

  it('works with a Date.now()-scale seed without throwing or producing NaN', () => {
    const result = generatePracticeQuestion(mockStreets, Date.now(), 0);
    expect(result).not.toBeNull();
    expect(Number.isNaN(Number(result!.street.id))).toBe(false);
  });
});
