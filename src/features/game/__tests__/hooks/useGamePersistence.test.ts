import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as gameService from '../../../../services/gameService';
import type { GameStateObject } from '../../../../types/game';
import * as dailyChallengeUtils from '../../../../utils/game/dailyChallenge';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-router', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../../../services/gameService');
vi.mock('../../../../services/db/games', () => ({
  insertGameResult: vi.fn(),
}));
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
vi.mock('../../../../hooks/useNotification', () => ({
  useNotification: () => ({
    notify: vi.fn(),
  }),
}));

vi.mock('../../../../services/db/quests', () => ({
  checkAndProgressQuests: vi.fn(() => Promise.resolve([])),
}));

const { mockProcessReferrals, mockUpdateStreaks } = vi.hoisted(() => ({
  mockProcessReferrals: vi.fn(),
  mockUpdateStreaks: vi.fn(),
}));

// Mock new hooks
vi.mock('../../hooks/useGameReferrals', () => ({
  useGameReferrals: () => ({ processReferrals: mockProcessReferrals }),
}));
vi.mock('../../hooks/useGameStreaks', () => ({
  useGameStreaks: () => ({ updateStreaks: mockUpdateStreaks }),
}));

vi.mock('../../../../hooks/useAsyncOperation', () => ({
  useAsyncOperation: () => ({
    execute: (fn: () => Promise<void>) => fn(),
    loading: false,
    error: null,
  }),
}));

describe('useGamePersistence Integration Tests', () => {
  // ... (keep mockGameState)
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

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(gameService.endGame).toHaveBeenCalled();
    expect(dailyChallengeUtils.markTodayAsPlayed).toHaveBeenCalled();
    // Sub-hooks should be called
    expect(mockProcessReferrals).toHaveBeenCalledWith(mockGameState.username);
    expect(mockUpdateStreaks).toHaveBeenCalled();
  });

  it('should fallback to Supabase when Redis fails', async () => {
    // Mock Redis failure
    vi.spyOn(gameService, 'endGame').mockResolvedValue({
      success: false,
      error: 'Redis connection failed',
    });

    const { insertGameResult } = await import('../../../../services/db/games');
    // @ts-ignore
    insertGameResult.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(gameService.endGame).toHaveBeenCalled();
    expect(insertGameResult).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'testuser',
        score: 7500,
        correct_answers: 8,
      })
    );
  });

  it('should store game history in local storage', async () => {
    vi.spyOn(gameService, 'endGame').mockResolvedValue({ success: true });
    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"score":7500')
    );
  });

  it('should process referrals', async () => {
    vi.spyOn(gameService, 'endGame').mockResolvedValue({ success: true });
    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(mockProcessReferrals).toHaveBeenCalledWith('testuser');
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

    expect(gameService.endGame).not.toHaveBeenCalled();
    expect(mockProcessReferrals).not.toHaveBeenCalled();
  });

  it('should update streaks', async () => {
    vi.spyOn(gameService, 'endGame').mockResolvedValue({ success: true });
    vi.spyOn(dailyChallengeUtils, 'markTodayAsPlayed').mockReturnValue(undefined);
    vi.spyOn(dailyChallengeUtils, 'getTodaySeed').mockReturnValue(20260124);

    const { result } = renderHook(() => useGamePersistence());

    await act(async () => {
      await result.current.saveGameResults(mockGameState);
    });

    expect(mockUpdateStreaks).toHaveBeenCalledWith(mockGameState.username, mockGameState.score);
  });
});
