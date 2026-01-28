import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStreets } from '../../hooks/useStreets';

// Mock Turf functions since they are dependencies
vi.mock('@turf/boolean-disjoint', () => ({ default: vi.fn() }));
vi.mock('@turf/centroid', () => ({ default: vi.fn() }));
vi.mock('@turf/distance', () => ({ default: vi.fn() }));
vi.mock('@turf/helpers', () => ({
  multiLineString: vi.fn(),
  point: vi.fn(),
}));

describe('useStreets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch streets successfully', async () => {
    const mockStreets = [
      {
        id: '1',
        name: 'Street 1',
        category: 'avenue',
        geometry: [
          [
            [0, 0],
            [1, 1],
          ],
        ],
      },
      { id: '2', name: 'B-10', category: 'highway', geometry: [] }, // Should be filtered out by isValidType
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockStreets,
    });

    const { result } = renderHook(() => useStreets());

    expect(result.current.isLoading).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/streets.json');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.validStreets).toHaveLength(1);
    expect(result.current.validStreets[0].name).toBe('Street 1');
  });

  it('should handle fetch errors', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() => useStreets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.validStreets).toEqual([]);
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useStreets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.validStreets).toEqual([]);
  });
});
