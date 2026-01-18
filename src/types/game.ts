export interface Street {
  id: string;
  name: string;
  geometry: number[][][]; // array of line strings or whatever the GeoJSON structure is
  properties?: Record<string, unknown>;
  tier?: number; // 1-4 difficulty tier for street selection
  lat?: number; // center latitude for proximity calculations
  lng?: number; // center longitude for proximity calculations
  [key: string]: any;
}

export interface QuizQuestion {
  correctId: string;
  distractorIds: string[];
}

export interface QuizPlan {
  date: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  street: Street;
  userAnswer: string;
  status: 'correct' | 'failed';
  time: number;
  points: number;
  hintsUsed: number;
}

export type GameState = 'register' | 'intro' | 'playing' | 'summary' | 'instructions';

export type Feedback = 'none' | 'correct' | 'incorrect' | 'transitioning' | 'idle' | 'selected';

export interface GameStateObject {
  username: string | null;
  realName: string | null;
  gameState: GameState;
  quizStreets: Street[];
  currentQuestionIndex: number;
  questionStartTime: number | null;
  score: number;
  correct: number;
  questions?: Street[]; // legacy/redundant?
  options: Street[];
  quizResults: QuizResult[];
  feedback: Feedback;
  // selectedStreet: Street | null; // Removed in favor of selectedAnswer
  hintsRevealedCount: number;
  hintStreets: Street[];
  autoAdvance: boolean;
  registerMode: 'signin' | 'signup';
  streak: number;
  profileLoaded: boolean;
  plannedQuestions: QuizQuestion[] | null;
  selectedAnswer: Street | null; // Added
  isInputLocked: boolean; // Added
  activePage: string | null; // Added
}
