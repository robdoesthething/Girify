import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Feedback, GameState } from '../../../../types/game';
import GameScreen from '../GameScreen';

// Mock mocks first
const mockDispatch = vi.fn();
const mockSetupGame = vi.fn();
const mockHandleRegister = vi.fn();
const mockHandleSelectAnswer = vi.fn();
const mockHandleNext = vi.fn();
const mockProcessAnswer = vi.fn();
const mockHasPlayedToday = vi.fn();

// Mock hooks
const mockUseTheme = vi.fn();
const mockUseGameContext = vi.fn();

vi.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

vi.mock('../../../../context/GameContext', () => ({
  useGameContext: () => mockUseGameContext(),
}));

// Mock Firebase
vi.mock('../../../../firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

// Mock child components to avoid deep rendering issues
vi.mock('../MapArea', () => ({
  default: () => <div data-testid="map-area">Map Area</div>,
}));

vi.mock('../Quiz', () => {
  const MockQuiz = ({ children }: React.PropsWithChildren) => (
    <div data-testid="quiz">{children}</div>
  );
  MockQuiz.displayName = 'MockQuiz';

  const Banner = () => <div data-testid="quiz-banner">Quiz Banner</div>;
  Banner.displayName = 'MockQuizBanner';
  MockQuiz.Banner = Banner;

  const Container = ({ children }: React.PropsWithChildren) => <div>{children}</div>;
  Container.displayName = 'MockQuizContainer';
  MockQuiz.Container = Container;

  const Content = ({ children }: React.PropsWithChildren) => <div>{children}</div>;
  Content.displayName = 'MockQuizContent';
  MockQuiz.Content = Content;

  const Options = () => <div data-testid="quiz-options">Options</div>;
  Options.displayName = 'MockQuizOptions';
  MockQuiz.Options = Options;

  const Hints = () => <div data-testid="quiz-hints">Hints</div>;
  Hints.displayName = 'MockQuizHints';
  MockQuiz.Hints = Hints;

  const NextButton = () => <button data-testid="next-button">Next</button>;
  NextButton.displayName = 'MockQuizNextButton';
  MockQuiz.NextButton = NextButton;

  return { default: MockQuiz };
});

vi.mock('../../../auth/components/RegisterPanel', () => ({
  default: () => <div data-testid="register-panel">Register Panel</div>,
}));

vi.mock('../SummaryScreen', () => ({
  default: () => <div data-testid="summary-screen">Summary Screen</div>,
}));

vi.mock('../../../../components/LandingPage', () => ({
  default: ({ onStart, onLogin }: any) => (
    <div data-testid="landing-page">
      <button onClick={onStart}>Start</button>
      <button onClick={onLogin}>Login</button>
    </div>
  ),
}));

vi.mock('../PlayOverlay', () => ({
  default: () => <div data-testid="play-overlay">Play Overlay</div>,
}));

vi.mock('../InstructionsOverlay', () => ({
  default: () => <div data-testid="instructions-overlay">Instructions Overlay</div>,
}));

vi.mock('../OnboardingTour', () => ({
  default: () => <div data-testid="onboarding-tour">Onboarding Tour</div>,
}));

describe('GameScreen Component', () => {
  const defaultTheme = {
    theme: 'light',
    deviceMode: 'desktop',
    t: (key: string) => key,
  };

  const defaultGameState = {
    username: null,
    gameId: 'test-game-id',
    gameState: 'intro' as GameState,
    score: 0,
    streak: 0,
    quizStreets: [],
    currentQuestionIndex: 0,
    quizResults: [],
    hintStreets: [],
    hintsRevealedCount: 0,
    options: [],
    feedback: 'idle' as Feedback,
    autoAdvance: false,
    selectedAnswer: null,
    isInputLocked: false,
    profileLoaded: false,
    realName: '',
    questionStartTime: 0,
    correct: 0,
    selectedStreet: null,
    answerStatus: 'idle',
    showResults: false,
    showSummary: false,
    hintLevel: 0,
    registerMode: 'signup',
    plannedQuestions: [],
    activePage: 'game',
  };

  const defaultContext = {
    state: defaultGameState,
    dispatch: mockDispatch,
    currentStreet: null,
    handlers: {
      handleSelectAnswer: mockHandleSelectAnswer,
      handleNext: mockHandleNext,
      processAnswer: mockProcessAnswer,
      setupGame: mockSetupGame,
      handleRegister: mockHandleRegister,
      hasPlayedToday: mockHasPlayedToday,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue(defaultTheme);
    mockUseGameContext.mockReturnValue(defaultContext);
    mockHasPlayedToday.mockReturnValue(false);
  });

  it('renders LandingPage when not logged in and in intro state', () => {
    render(
      <BrowserRouter>
        <GameScreen />
      </BrowserRouter>
    );
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('renders PlayOverlay when logged in and in intro state', () => {
    mockUseGameContext.mockReturnValue({
      ...defaultContext,
      state: { ...defaultGameState, username: '@TestUser' },
    });

    render(
      <BrowserRouter>
        <GameScreen />
      </BrowserRouter>
    );
    expect(screen.getByTestId('play-overlay')).toBeInTheDocument();
  });

  it('renders RegisterPanel when in register state', () => {
    mockUseGameContext.mockReturnValue({
      ...defaultContext,
      state: { ...defaultGameState, gameState: 'register' },
    });

    render(
      <BrowserRouter>
        <GameScreen />
      </BrowserRouter>
    );
    expect(screen.getByTestId('register-panel')).toBeInTheDocument();
  });

  it('renders MapArea and Quiz when playing', () => {
    mockUseGameContext.mockReturnValue({
      ...defaultContext,
      state: {
        ...defaultGameState,
        gameState: 'playing',
        username: '@TestUser',
        quizStreets: [{ id: '1', name: 'Street' }],
      },
    });

    render(
      <BrowserRouter>
        <GameScreen />
      </BrowserRouter>
    );
    expect(screen.getByTestId('map-area')).toBeInTheDocument();
    expect(screen.getByTestId('quiz')).toBeInTheDocument();
    expect(screen.getByTestId('quiz-banner')).toBeInTheDocument();
  });

  it('renders SummaryScreen when in summary state', () => {
    mockUseGameContext.mockReturnValue({
      ...defaultContext,
      state: { ...defaultGameState, gameState: 'summary', username: '@TestUser' },
    });

    render(
      <BrowserRouter>
        <GameScreen />
      </BrowserRouter>
    );
    expect(screen.getByTestId('summary-screen')).toBeInTheDocument();
  });

  it('renders InstructionsOverlay when in instructions state', () => {
    mockUseGameContext.mockReturnValue({
      ...defaultContext,
      state: { ...defaultGameState, gameState: 'instructions' },
    });

    render(
      <BrowserRouter>
        <GameScreen />
      </BrowserRouter>
    );
    expect(screen.getByTestId('instructions-overlay')).toBeInTheDocument();
  });
});
