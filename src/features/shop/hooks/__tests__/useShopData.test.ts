import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useShopData } from '../useShopData';

// Mock the new dependencies
vi.mock('../../../../services/database', () => ({
  getUserShopData: vi.fn().mockResolvedValue({
    username: 'testuser',
    giuros: 1000,
    purchased_cosmetics: ['frame_1'],
    equipped_cosmetics: { frameId: 'frame_1' },
    streak: 5,
    games_played: 10,
    best_score: 8000,
  }),
  getUserPurchasedBadges: vi.fn().mockResolvedValue(['badge_1']),
}));

vi.mock('../../../../utils/shop', () => ({
  getShopItems: vi.fn().mockResolvedValue({
    all: [{ id: 'item_1', price: 100 }],
    avatarFrames: [],
    titles: [],
    special: [],
    avatars: [],
  }),
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
    expect(result.current.purchased).toContain('badge_1');
    expect(result.current.equipped.frameId).toBe('frame_1');
  });

  it('should handle missing username', async () => {
    const { result } = renderHook(() => useShopData(''));

    expect(result.current.loading).toBe(false);
  });
});
