import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameStateObject } from '../../../../types/game';
import SummaryScreen from '../SummaryScreen';

// Mock dependencies
const mockDispatch = vi.fn();
const mockHandleRegister = vi.fn();

const mockState = {
  username: 'testuser' as string | null,
  score: 5000,
  correct: 5,
  quizStreets: Array(5).fill({}),
  quizResults: Array(5).fill({ time: 5, status: 'correct', points: 1000 }),
  gameId: 'game1',
} as GameStateObject;

vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    t: (key: string) => key,
  }),
}));

vi.mock('../../../context/GameContext', () => ({
  useGameContext: () => ({
    state: mockState,
    dispatch: mockDispatch,
    handlers: {
      handleRegister: mockHandleRegister,
    },
  }),
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  }),
}));

import { MemoryRouter } from 'react-router-dom';

describe('SummaryScreen Integration', () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockState.username = 'testuser'; // Reset state
  });

  it('renders summary stats correctly', () => {
    // Need to pass required props to SummaryScreen
    const props = {
      score: 5000,
      total: 5,
      theme: 'light' as const,
      streak: 5,
      onRestart: vi.fn(),
      onBackToMenu: vi.fn(),
      quizResults: Array(5).fill({ time: 5, status: 'correct', points: 1000 }),
      quizStreets: Array(5).fill({ id: 's1', name: 'Test Street' }),
      t: (key: string) => key,
    };
    renderWithRouter(<SummaryScreen {...props} />);

    // Initially shows city curiosity view
    // Click Next to see stats
    const nextBtn = screen.getByText('next'); // Mock t returns 'next'
    fireEvent.click(nextBtn);

    // Check score display (5000)
    expect(screen.getByText('5000')).toBeInTheDocument();

    // Check correct answers (5/5) is NOT directly shown as "5 / 5" text maybe?
    // In code: <span ...> / {maxPossibleScore} {t('pts')} </span>
    // maxPossibleScore = 5 * 100 = 500.
    // Wait. "Score" section shows score.
    // Does it show "5 / 5"?
    // Code:
    // <span ...>{score}</span>
    // <span ...>/ {maxPossibleScore} pts</span>
    // It DOES NOT show "5 / 5" correct answers count explicitly in the code I read?
    // Let's check SummaryScreen.tsx again.

    // It shows Streak.
    // It DOES NOT show "Correct Answers" count explicitly in the `actions` view.
    // So `expect(screen.getByText('5 / 5'))` will fail.

    // I should assert `maxPossibleScore` (500).
    expect(screen.getByText('/ 500 pts')).toBeInTheDocument();
  });
});
