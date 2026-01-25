import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameStateObject } from '../../../../types/game';
import { useGamePersistence } from '../useGamePersistence';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../hooks/useAsyncOperation', () => ({
  useAsyncOperation: () => ({
    execute: (fn: any) => fn(), // Execute immediately
  }),
}));

vi.mock('../../../../services/gameService', () => ({
  endGame: vi.fn(),
}));

vi.mock('../../../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        error: null,
      })),
    })),
  },
}));

vi.mock('../../../../utils/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../../../../utils/game/dailyChallenge', () => ({
  markTodayAsPlayed: vi.fn(),
  getTodaySeed: vi.fn(() => 20230101),
}));

vi.mock('../../../../utils/social', () => ({
  saveUserGameResult: vi.fn(),
  updateUserGameStats: vi.fn(),
  getReferrer: vi.fn(),
}));

vi.mock('../../../../utils/shop/giuros', () => ({
  awardChallengeBonus: vi.fn(),
  awardReferralBonus: vi.fn(),
}));

// Mock imported modules
import { endGame } from '../../../../services/gameService';
import { saveUserGameResult, updateUserGameStats } from '../../../../utils/social';
import { storage } from '../../../../utils/storage';

describe('useGamePersistence', () => {
  const mockState = {
    username: 'testuser',
    score: 1000,
    quizStreets: [{ id: 's1' }, { id: 's2' }],
    quizResults: [
      { time: 5, points: 500 },
      { time: 5, points: 500 },
    ],
    gameId: 'game123',
    correct: 2,
  } as unknown as GameStateObject;

  beforeEach(() => {
    vi.clearAllMocks();
    (storage.get as any).mockReturnValue([]); // Default empty history
    (endGame as any).mockResolvedValue({ success: true, gameId: 'game123' });
  });

  it('saves game results to local storage', async () => {
    const { result } = renderHook(() => useGamePersistence());
    await result.current.saveGameResults(mockState);

    expect(storage.set).toHaveBeenCalledTimes(1);
    // Check if called with history containing the new game
    expect(storage.set).toHaveBeenCalledWith(
      'girify_history',
      expect.arrayContaining([
        expect.objectContaining({
          score: 1000,
          username: 'testuser',
        }),
      ])
    );
  });

  it('saves game results to remote services (social + game service)', async () => {
    const { result } = renderHook(() => useGamePersistence());
    await result.current.saveGameResults(mockState);

    expect(saveUserGameResult).toHaveBeenCalledWith('testuser', expect.anything());
    expect(endGame).toHaveBeenCalledWith('game123', 1000, 5, 2, 2);
  });

  it('updates user stats (streak)', async () => {
    // Mock existing history to test streak calculation logic if needed
    // But calculateStreak is a utility. We just want to check if updateUserGameStats is called.

    // We mocked storage.get to return empty array in beforeEach.
    // Let's rely on that for this test.

    const { result } = renderHook(() => useGamePersistence());
    await result.current.saveGameResults(mockState);

    await waitFor(() => {
      expect(updateUserGameStats).toHaveBeenCalledWith(
        'testuser',
        expect.objectContaining({
          streak: expect.any(Number),
          totalScore: expect.any(Number),
        })
      );
    });
  });
});
