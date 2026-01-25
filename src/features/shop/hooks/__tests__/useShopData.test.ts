import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useShopData } from '../useShopData';

// Mock dependencies

// Mock database service directly, let giuros.ts logic run
// Path from test: src/features/shop/hooks/__tests__/ -> ../../../../services/database
// Mock giuros utility directly
vi.mock('../../../../utils/shop/giuros', () => ({
  getGiuros: vi.fn().mockResolvedValue(1000),
  getPurchasedCosmetics: vi.fn().mockResolvedValue(['frame_1']),
  getEquippedCosmetics: vi.fn().mockResolvedValue({ frameId: 'frame_1' }),
}));

// Mock index import for shop items (as they come from DB or json)
vi.mock('../../../../utils/shop', () => ({
  getShopItems: vi.fn().mockResolvedValue({
    all: [{ id: 'item_1', price: 100 }],
    avatarFrames: [],
    titles: [],
    special: [],
    avatars: [],
  }),
}));

vi.mock('../../../../utils/social', () => ({
  getUserProfile: vi.fn().mockResolvedValue({ username: 'testuser', gamesPlayed: 10 }),
}));

describe('useShopData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load shop data correctly', async () => {
    const { result } = renderHook(() => useShopData('testuser'));

    expect(result.current.loading).toBe(true);
    expect(result.current.balance).toBe(0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.balance).toBe(1000);
    expect(result.current.purchased).toContain('frame_1');
    expect(result.current.equipped.frameId).toBe('frame_1');
  });

  it('should handle missing username', async () => {
    const { result } = renderHook(() => useShopData(''));

    expect(result.current.loading).toBe(false);
  });
});
