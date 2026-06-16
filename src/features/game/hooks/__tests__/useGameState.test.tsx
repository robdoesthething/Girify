import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Street } from '../../../../types/game';
import { useGameState } from '../useGameState';

// useGameState pulls in useGamePersistence, which itself depends on
// react-router-dom's useNavigate, ThemeContext, and several Supabase-backed
// services. Mock the whole hook so these tests don't need a Router/Theme
// wrapper — this also gives us a spy to assert practice mode never saves.
const mockSaveGameResults = vi.fn();
vi.mock('../useGamePersistence', () => ({
  useGamePersistence: () => ({ saveGameResults: mockSaveGameResults }),
}));

// useGameState also imports startGame directly from gameService (for the
// Redis-backed session id), which in turn pulls in the real Supabase client.
// Mock it the same way other hook tests in this codebase do, so module load
// doesn't fail on missing Supabase env vars.
vi.mock('../../../../services/gameService', () => ({
  startGame: vi.fn().mockResolvedValue('mock-game-id'),
}));

const mockStreets: Street[] = Array.from({ length: 20 }, (_, i) => ({
  id: `${i}`,
  name: `Street ${i}`,
  tier: (i % 4) + 1,
  geometry: [[[]]],
}));

const getHintStreets = () => [];

describe('useGameState practice mode', () => {
  beforeEach(() => {
    localStorage.clear();
    mockSaveGameResults.mockClear();
  });

  it('startPracticeMode sets practiceMode true and seeds the first street', () => {
    const { result } = renderHook(() => useGameState(mockStreets, getHintStreets));

    act(() => {
      result.current.startPracticeMode();
    });

    expect(result.current.state.practiceMode).toBe(true);
    expect(result.current.state.gameState).toBe('playing');
    expect(result.current.state.sessionSeed).not.toBeNull();
    expect(result.current.state.quizStreets).toHaveLength(1);
  });

  it('does nothing if there are no valid streets', () => {
    const { result } = renderHook(() => useGameState([], getHintStreets));

    act(() => {
      result.current.startPracticeMode();
    });

    expect(result.current.state.practiceMode).toBe(false);
    expect(result.current.state.gameState).toBe('intro');
  });

  it('handleNext in practice mode appends a street instead of finishing the game, and never saves', async () => {
    const { result } = renderHook(() => useGameState(mockStreets, getHintStreets));

    act(() => {
      result.current.startPracticeMode();
    });

    // Simulate reaching the "transitioning" feedback state that gates handleNext
    act(() => {
      result.current.dispatch({
        type: 'ANSWER_SUBMITTED',
        payload: {
          result: {
            street: result.current.state.quizStreets[0]!,
            userAnswer: 'x',
            status: 'failed',
            time: 1,
            points: 0,
            hintsUsed: 0,
          },
          points: 0,
          selectedStreet: result.current.state.quizStreets[0]!,
        },
      });
    });

    expect(result.current.state.feedback).toBe('transitioning');

    act(() => {
      result.current.handleNext();
    });

    await waitFor(() => {
      expect(result.current.state.quizStreets.length).toBeGreaterThan(1);
    });
    expect(result.current.state.gameState).toBe('playing');
    expect(result.current.state.currentQuestionIndex).toBe(1);
    expect(mockSaveGameResults).not.toHaveBeenCalled();
  });
});
