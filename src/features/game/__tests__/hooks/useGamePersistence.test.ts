import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as gameService from '../../../../services/gameService';
import * as supabaseService from '../../../../services/supabase';
import type { GameStateObject } from '../../../../types/game';
import * as dailyChallengeUtils from '../../../../utils/game/dailyChallenge';
import * as socialUtils from '../../../../utils/social';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../services/gameService');
vi.mock('../../../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
    })),
  },
}));
vi.mock('../../../../utils/game/dailyChallenge');
vi.mock('../../../../utils/social');
vi.mock('../../../../utils/shop/giuros', () => ({
  awardChallengeBonus: vi.fn(() => Promise.resolve({ success: true })),
  awardReferralBonus: vi.fn(() => Promise.resolve({ success: true })),
}));
vi.mock('../../../../utils/stats', () => ({
  calculateStreak: vi.fn(() => ({ streak: 5, maxStreak: 10 })),
}));
vi.mock('../../../../hooks/useAsyncOperation', () => ({
  useAsyncOperation: () => ({
    execute: (fn: () => Promise<void>) => fn(),
    loading: false,
    error: null,
  }),
}));

describe('useGamePersistence Integration Tests', () => {
  const mockGameState: GameStateObject = {
    username: 'testuser',
    score: 7500,
    correct: 8,
    gameId: 'game-123',
    questionStartTime: Date.now(),
    quizStreets: Array(10).fill({ name: 'Test Street', id: '1', geometry: [] }),
    quizResults: [
      {
        status: 'correct',
        time: 5,
        street: { name: 'Street 1', id: '1', geometry: [] },
        userAnswer: 'Street 1',
        points: 1000,
        hintsUsed: 0,
      },
      {
        status: 'correct',
        time: 10,
        street: { name: 'Street 2', id: '2', geometry: [] },
        userAnswer: 'Street 2',
        points: 1000,
        hintsUsed: 0,
      },
      {
        status: 'failed',
        time: 15,
        street: { name: 'Street 3', id: '3', geometry: [] },
        userAnswer: 'Street X',
        points: 0,
        hintsUsed: 0,
      },
    ],
    currentQuestionIndex: 0,
    selectedAnswer: null,
    feedback: 'idle' as const,
    isInputLocked: false,
    options: [],
    autoAdvance: true,
    gameState: 'playing',
    hintsRevealedCount: 0,
    hintStreets: [],
    registerMode: 'signin',
    streak: 5,
    profileLoaded: true,
    plannedQuestions: null,
    activePage: null,
    realName: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('[]');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should save game results successfully via Redis', async () => {
    // Mock successful Redis save
    vi.spyOn(gameService, 'endGame').mockResolvedValue({
      success: true,
      gameId: 'game-123',
    });

    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);
    vi.spyOn(socialUtils, 'saveUserGameResult').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'updateUserGameStats').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'getReferrer').mockResolvedValue(null);

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(gameService.endGame).toHaveBeenCalled();
    expect(dailyChallengeUtils.markTodayAsPlayed).toHaveBeenCalled();
    expect(socialUtils.updateUserGameStats).toHaveBeenCalled();
  });

  it('should fallback to Supabase when Redis fails', async () => {
    // Mock Redis failure
    vi.spyOn(gameService, 'endGame').mockResolvedValue({
      success: false,
      error: 'Redis connection failed',
    });

    const mockSupabaseInsert = vi.fn(() => ({ error: null }));
    vi.spyOn(supabaseService.supabase, 'from').mockReturnValue({
      insert: mockSupabaseInsert,
    } as any);

    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);
    vi.spyOn(socialUtils, 'saveUserGameResult').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'updateUserGameStats').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'getReferrer').mockResolvedValue(null);

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(gameService.endGame).toHaveBeenCalled();
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'testuser',
        score: 7500,
        correct_answers: 8,
      })
    );
  });

  it('should calculate average time correctly', async () => {
    vi.spyOn(gameService, 'endGame').mockResolvedValue({ success: true });
    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);
    vi.spyOn(socialUtils, 'saveUserGameResult').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'updateUserGameStats').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'getReferrer').mockResolvedValue(null);

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    // Average of [5, 10, 15] = 10.0
    expect(socialUtils.saveUserGameResult).toHaveBeenCalledWith(
      'testuser',
      expect.objectContaining({
        avgTime: '10.0',
      })
    );
  });

  it('should store game history in local storage', async () => {
    vi.spyOn(gameService, 'endGame').mockResolvedValue({ success: true });
    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);
    vi.spyOn(socialUtils, 'saveUserGameResult').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'updateUserGameStats').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'getReferrer').mockResolvedValue(null);

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"score":7500')
    );
  });

  it('should award bonuses to referred users', async () => {
    vi.spyOn(gameService, 'endGame').mockResolvedValue({ success: true });
    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);
    vi.spyOn(socialUtils, 'saveUserGameResult').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'updateUserGameStats').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'getReferrer').mockResolvedValue('referrerUser');

    const { awardReferralBonus } = await import('../../../../utils/shop/giuros');

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(awardReferralBonus).toHaveBeenCalledWith('referrerUser');
  });

  it('should handle missing username gracefully', async () => {
    const stateWithoutUsername = { ...mockGameState, username: '' };

    vi.spyOn(gameService, 'endGame').mockResolvedValue({
      success: false,
      error: 'No username',
    });
    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(stateWithoutUsername);
    });

    // Should not crash, should handle gracefully
    expect(gameService.endGame).not.toHaveBeenCalled();
  });

  it('should calculate streak correctly', async () => {
    vi.spyOn(gameService, 'endGame').mockResolvedValue({ success: true });
    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);
    vi.spyOn(socialUtils, 'saveUserGameResult').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'updateUserGameStats').mockResolvedValue(undefined);
    vi.spyOn(socialUtils, 'getReferrer').mockResolvedValue(null);

    const { calculateStreak } = await import('../../../../utils/stats');

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(calculateStreak).toHaveBeenCalled();
  });
});
