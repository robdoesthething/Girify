import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as socialUtils from '../../../../utils/social';
import * as statsUtils from '../../../../utils/stats';
import { useGameStreaks } from '../../hooks/useGameStreaks';

// Mock dependencies
vi.mock('../../../../utils/stats', () => ({
  calculateStreak: vi.fn(),
  getUserStats: vi.fn(),
}));

vi.mock('../../../../utils/social', () => ({
  updateUserGameStats: vi.fn(),
}));

vi.mock('../../../../services/gameService', () => ({
  endGame: vi.fn(),
}));

vi.mock('../../../../hooks/useNotification', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}));

describe('useGameStreaks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update streaks correctly', async () => {
    const mockStreakValue = 5;
    // calculateStreak returns a number (the streak count)
    vi.spyOn(statsUtils, 'calculateStreak').mockReturnValue(mockStreakValue);
    vi.spyOn(socialUtils, 'updateUserGameStats').mockResolvedValue(undefined);

    const { result } = renderHook(() => useGameStreaks());
    await result.current.updateStreaks('testuser', 1000);

    expect(statsUtils.calculateStreak).toHaveBeenCalled();
    expect(socialUtils.updateUserGameStats).toHaveBeenCalledWith(
      'testuser',
      expect.objectContaining({
        currentScore: 1000,
        streak: mockStreakValue,
      })
    );
  });

  it('should handle errors', async () => {
    vi.spyOn(statsUtils, 'calculateStreak').mockImplementation(() => {
      throw new Error('Calc error');
    });

    const { result } = renderHook(() => useGameStreaks());

    // Should not throw
    await result.current.updateStreaks('testuser', 1000);

    expect(socialUtils.updateUserGameStats).not.toHaveBeenCalled();
  });
});
