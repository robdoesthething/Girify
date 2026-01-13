import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameScreen from '../GameScreen';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../MapArea', () => ({ default: () => <div data-testid="map-area">Map Area</div> }));
vi.mock('../Quiz', () => {
  const MockQuiz = ({ children }: any) => <div data-testid="quiz">{children}</div>;
  MockQuiz.Banner = () => <div data-testid="quiz-banner">Quiz Banner</div>;
  MockQuiz.Container = ({ children }: any) => <div>{children}</div>;
  MockQuiz.Content = ({ children }: any) => <div>{children}</div>;
  MockQuiz.Options = ({ onSelect }: any) => (
    <div data-testid="quiz-options">
      <button onClick={() => onSelect({ id: 'street1', name: 'Test Street' })}>Option 1</button>
    </div>
  );
  MockQuiz.Hints = ({ onReveal }: any) => (
    <div data-testid="quiz-hints">
      <button onClick={onReveal}>Reveal Hint</button>
    </div>
  );
  MockQuiz.NextButton = ({ onNext }: any) => (
    <button data-testid="next-button" onClick={onNext}>
      Next
    </button>
  );
  return { default: MockQuiz };
});
vi.mock('../RegisterPanel', () => ({
  default: ({ onRegister }: any) => (
    <div data-testid="register-panel">
      <button onClick={() => onRegister('@testuser')}>Register</button>
    </div>
  ),
}));
vi.mock('../SummaryScreen', () => ({
  default: () => <div data-testid="summary-screen">Summary</div>,
}));
vi.mock('../LandingPage', () => ({
  default: ({ onStart, onLogin }: any) => (
    <div data-testid="landing-page">
      <button onClick={onStart}>Start</button>
      <button onClick={onLogin}>Login</button>
    </div>
  ),
}));
vi.mock('../Logo', () => ({ default: () => <div>Logo</div> }));
vi.mock('../OnboardingTour', () => ({
  default: () => <div data-testid="onboarding">Onboarding</div>,
}));

// Mock utils
vi.mock('../../utils/dailyChallenge', () => ({
  hasPlayedToday: vi.fn(() => false),
}));

const mockDispatch = vi.fn();
const mockSetupGame = vi.fn();
const mockHandleRegister = vi.fn();
const mockHandleSelectAnswer = vi.fn();
const mockHandleNext = vi.fn();
const mockProcessAnswer = vi.fn();

const defaultProps = {
  state: {
    username: null,
    gameState: 'intro',
    score: 0,
    streak: 0,
    quizStreets: [],
    currentQuestionIndex: 0,
    quizResults: [],
    hintStreets: [],
    hintsRevealedCount: 0,
    options: [],
    feedback: 'idle',
    autoAdvance: false,
    selectedAnswer: null,
    isInputLocked: false,
    profileLoaded: false,
  },
  dispatch: mockDispatch,
  theme: 'light',
  deviceMode: 'desktop',
  t: (key: string) => key,
  currentStreet: null,
  handleSelectAnswer: mockHandleSelectAnswer,
  handleNext: mockHandleNext,
  processAnswer: mockProcessAnswer,
  setupGame: mockSetupGame,
  handleRegister: mockHandleRegister,
  hasPlayedToday: () => false,
};

const renderGameScreen = (props: any = {}) => {
  return render(
    <BrowserRouter>
      <GameScreen {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('GameScreen Component', () => {
  it('renders LandingPage when not logged in and in intro state', () => {
    renderGameScreen();
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('renders Play button when logged in and in intro state', () => {
    renderGameScreen({
      state: { ...defaultProps.state, username: '@TestUser', profileLoaded: true },
    });
    // Checks for "play" text (t('play'))
    expect(screen.getByText('play')).toBeInTheDocument();
  });

  it('calls setupGame when Play button is clicked', () => {
    renderGameScreen({
      state: { ...defaultProps.state, username: '@TestUser', profileLoaded: true },
    });

    const playBtn = screen.getByText('play');
    fireEvent.click(playBtn.closest('button')!);

    expect(mockSetupGame).toHaveBeenCalled();
  });

  it('renders RegisterPanel when in register state', () => {
    renderGameScreen({
      state: { ...defaultProps.state, gameState: 'register' },
    });
    expect(screen.getByTestId('register-panel')).toBeInTheDocument();
  });

  it('renders MapArea and Quiz when playing', () => {
    renderGameScreen({
      state: {
        ...defaultProps.state,
        gameState: 'playing',
        username: '@TestUser',
        quizStreets: [{ id: '1', name: 'Street' }],
      },
    });
    expect(screen.getByTestId('map-area')).toBeInTheDocument();
    expect(screen.getByTestId('quiz')).toBeInTheDocument();
    expect(screen.getByTestId('quiz-banner')).toBeInTheDocument();
  });

  it('renders SummaryScreen when in summary state', () => {
    renderGameScreen({
      state: { ...defaultProps.state, gameState: 'summary', username: '@TestUser' },
    });
    expect(screen.getByTestId('summary-screen')).toBeInTheDocument();
  });
});
