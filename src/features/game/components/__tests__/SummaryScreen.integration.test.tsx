import { render, screen, fireEvent } from '@testing-library/react';
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

const mockProfile: { username: string | null; team: string | null } = {
  username: 'testuser',
  team: null,
};

vi.mock('../../../auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    profile: mockProfile,
    loading: false,
  }),
}));

import { MemoryRouter } from 'react-router-dom';

const baseProps = {
  score: 5000,
  total: 5,
  theme: 'light' as const,
  streak: 5,
  onRestart: vi.fn(),
  onBackToMenu: vi.fn(),
  quizResults: Array(5).fill({
    time: 5,
    status: 'correct',
    points: 1000,
    street: { id: 's1', name: 'Test Street', coordinates: [] },
  }),
  quizStreets: Array(5).fill({ id: 's1', name: 'Test Street' }),
  t: (key: string) => key,
};

describe('SummaryScreen Integration', () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockState.username = 'testuser';
    mockProfile.username = 'testuser';
    mockProfile.team = null;
    Object.assign(navigator, {
      share: undefined,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders summary stats immediately without an intermediate screen', () => {
    renderWithRouter(<SummaryScreen {...baseProps} />);

    // Score is visible directly — no curiosity step to click through
    expect(screen.getByText('5000')).toBeInTheDocument();
    // maxPossibleScore = 5 * 100 = 500
    expect(screen.getByText('/ 500 pts')).toBeInTheDocument();
  });

  it('calls onKeepPlaying when the Keep Playing button is clicked', () => {
    const onKeepPlaying = vi.fn();
    renderWithRouter(<SummaryScreen {...baseProps} onKeepPlaying={onKeepPlaying} />);

    fireEvent.click(screen.getByText('keepPlaying', { exact: false }));
    expect(onKeepPlaying).toHaveBeenCalledTimes(1);
  });

  describe('share button', () => {
    it('copies share text with www.girifyapp.com domain', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: undefined, clipboard: { writeText } });

      renderWithRouter(<SummaryScreen {...baseProps} />);
      await fireEvent.click(screen.getByText('shareYourResult'));

      expect(writeText).toHaveBeenCalledTimes(1);
      const shareText = writeText.mock.calls[0]?.[0] as string;
      expect(shareText).toContain('www.girifyapp.com');
      expect(shareText).not.toContain('girify.vercel.app');
    });

    it('includes ?ref=username when profile has a username', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: undefined, clipboard: { writeText } });
      mockProfile.username = 'testuser';

      renderWithRouter(<SummaryScreen {...baseProps} />);
      await fireEvent.click(screen.getByText('shareYourResult'));

      const shareText = writeText.mock.calls[0]?.[0] as string;
      expect(shareText).toContain('?ref=testuser');
    });

    it('omits ?ref param when username is null', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: undefined, clipboard: { writeText } });
      mockProfile.username = null;

      renderWithRouter(<SummaryScreen {...baseProps} />);
      await fireEvent.click(screen.getByText('shareYourResult'));

      const shareText = writeText.mock.calls[0]?.[0] as string;
      expect(shareText).toContain('www.girifyapp.com');
      expect(shareText).not.toContain('?ref=null');
      expect(shareText).not.toContain('?ref=undefined');
      expect(shareText).not.toContain('?ref=');
    });
  });
});
