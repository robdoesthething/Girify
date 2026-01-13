import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Feedback, GameState } from '../../types/game';
import GameScreen from '../GameScreen';

// Mock dependencies
vi.mock('../MapArea', () => {
  const MapArea = () => <div data-testid="map-area">Map Area</div>;
  MapArea.displayName = 'MapArea';
  return { default: MapArea };
});
vi.mock('../Quiz', () => {
  const MockQuiz = ({ children }: React.PropsWithChildren) => (
    <div data-testid="quiz">{children}</div>
  );
  const Banner = () => <div data-testid="quiz-banner">Quiz Banner</div>;
  Banner.displayName = 'QuizBanner';
  MockQuiz.Banner = Banner;

  const Container = ({ children }: React.PropsWithChildren) => <div>{children}</div>;
  Container.displayName = 'QuizContainer';
  MockQuiz.Container = Container;

  const Content = ({ children }: React.PropsWithChildren) => <div>{children}</div>;
  Content.displayName = 'QuizContent';
  MockQuiz.Content = Content;

  const Options = ({ onSelect }: { onSelect: (option: { id: string; name: string }) => void }) => (
    <div data-testid="quiz-options">
      <button onClick={() => onSelect({ id: 'street1', name: 'Test Street' })}>Option 1</button>
    </div>
  );
  Options.displayName = 'QuizOptions';
  MockQuiz.Options = Options;

  const Hints = ({ onReveal }: { onReveal: () => void }) => (
    <div data-testid="quiz-hints">
      <button onClick={onReveal}>Reveal Hint</button>
    </div>
  );
  Hints.displayName = 'QuizHints';
  MockQuiz.Hints = Hints;

  const NextButton = ({ onNext }: { onNext: () => void }) => (
    <button data-testid="next-button" onClick={onNext}>
      Next
    </button>
  );
  NextButton.displayName = 'QuizNextButton';
  MockQuiz.NextButton = NextButton;

  return { default: MockQuiz };
});
vi.mock('../RegisterPanel', () => {
  const RegisterPanel = ({ onRegister }: { onRegister: (username: string) => void }) => (
    <div data-testid="register-panel">
      <button onClick={() => onRegister('@testuser')}>Register</button>
    </div>
  );
  RegisterPanel.displayName = 'RegisterPanel';
  return { default: RegisterPanel };
});
vi.mock('../SummaryScreen', () => {
  const SummaryScreen = () => <div data-testid="summary-screen">Summary</div>;
  SummaryScreen.displayName = 'SummaryScreen';
  return { default: SummaryScreen };
});
vi.mock('../LandingPage', () => {
  const LandingPage = ({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) => (
    <div data-testid="landing-page">
      <button onClick={onStart}>Start</button>
      <button onClick={onLogin}>Login</button>
    </div>
  );
  LandingPage.displayName = 'LandingPage';
  return { default: LandingPage };
});
vi.mock('../Logo', () => {
  const Logo = () => <div>Logo</div>;
  Logo.displayName = 'Logo';
  return { default: Logo };
});
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
    registerMode: 'signup' as 'signup' | 'signin',
    plannedQuestions: [],
    activePage: 'game',
  },
  dispatch: mockDispatch,
  theme: 'light' as 'light' | 'dark',
  deviceMode: 'desktop' as 'desktop' | 'mobile' | 'tablet',
  t: (key: string) => key,
  currentStreet: null,
  handleSelectAnswer: mockHandleSelectAnswer,
  handleNext: mockHandleNext,
  processAnswer: mockProcessAnswer,
  setupGame: mockSetupGame,
  handleRegister: mockHandleRegister,
  hasPlayedToday: () => false,
};

const renderGameScreen = (props: Record<string, unknown> = {}) => {
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
