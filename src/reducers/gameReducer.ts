import { QuizResult, Street } from '../types/game';
import { storage } from '../utils/storage';

// Game state types
export type GameStateType = 'intro' | 'register' | 'playing' | 'summary';

export type FeedbackType = 'idle' | 'transitioning' | 'selected' | 'correct' | 'wrong';

export type RegisterMode = 'signin' | 'signup';

export interface PlannedQuestion {
  targetStreet: Street;
  options: Street[];
  hintStreets: Street[];
}

export interface GameState {
  gameState: GameStateType;
  username: string;
  realName: string;
  profileLoaded: boolean;
  streak: number;
  quizStreets: Street[];
  currentQuestionIndex: number;
  score: number;
  correct: number;
  feedback: FeedbackType;
  options: Street[];
  autoAdvance: boolean;
  hintStreets: Street[];
  hintsRevealedCount: number;
  startTime: number | null;
  quizResults: QuizResult[];
  questionStartTime: number | null;
  activePage: string | null;
  selectedAnswer: Street | null;
  plannedQuestions: PlannedQuestion[] | null;
  registerMode: RegisterMode;
  isInputLocked: boolean;
  gameId: string | null;
}

// Action types
export type GameAction =
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_REAL_NAME'; payload: string }
  | { type: 'SET_STREAK'; payload: number }
  | { type: 'SET_PROFILE_LOADED' }
  | { type: 'SET_GAME_STATE'; payload: GameStateType }
  | {
      type: 'START_GAME';
      payload: {
        quizStreets: Street[];
        initialOptions?: Street[];
        plannedQuestions?: PlannedQuestion[];
      };
    }
  | { type: 'SET_OPTIONS'; payload: Street[] }
  | { type: 'SET_HINT_STREETS'; payload: Street[] }
  | { type: 'REVEAL_HINT' }
  | { type: 'SELECT_ANSWER'; payload: Street }
  | {
      type: 'ANSWER_SUBMITTED';
      payload: {
        result: QuizResult;
        points: number;
        selectedStreet: Street;
      };
    }
  | { type: 'NEXT_QUESTION'; payload: { options: Street[] } }
  | { type: 'SET_ACTIVE_PAGE'; payload: string | null }
  | { type: 'SET_AUTO_ADVANCE'; payload: boolean }
  | { type: 'SET_REGISTER_MODE'; payload: RegisterMode }
  | { type: 'SET_GAME_ID'; payload: string | null }
  | { type: 'UNLOCK_INPUT' }
  | { type: 'LOGOUT' };

export const initialState: GameState = {
  gameState: 'intro',
  username: storage.get<string>('girify_username', ''),
  realName: storage.get<string>('girify_realName', ''),
  profileLoaded: false,
  streak: 0,
  quizStreets: [],
  currentQuestionIndex: 0,
  score: 0,
  correct: 0,
  feedback: 'idle',
  options: [],
  autoAdvance: (() => {
    const val = storage.get<boolean | string>('girify_auto_advance', true);
    return val === 'false' ? false : Boolean(val);
  })(),
  hintStreets: [],
  hintsRevealedCount: 0,
  startTime: null,
  quizResults: [],
  questionStartTime: null,
  activePage: null,
  selectedAnswer: null,
  plannedQuestions: null,
  registerMode: 'signin',
  isInputLocked: false,
  gameId: null,
};

const MAX_SCORE = 1000;

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_USERNAME':
      return {
        ...state,
        username: action.payload,
      };

    case 'SET_REAL_NAME':
      return {
        ...state,
        realName: action.payload,
        profileLoaded: true,
      };

    case 'SET_STREAK':
      return {
        ...state,
        streak: action.payload,
      };

    case 'SET_PROFILE_LOADED':
      return {
        ...state,
        profileLoaded: true,
      };

    case 'SET_GAME_STATE':
      return {
        ...state,
        gameState: action.payload,
      };

    case 'START_GAME':
      return {
        ...state,
        gameState: 'playing',
        quizStreets: action.payload.quizStreets,
        currentQuestionIndex: 0,
        score: 0,
        correct: 0,
        feedback: 'idle',
        hintsRevealedCount: 0,
        startTime: Date.now(),
        questionStartTime: null,
        quizResults: [],
        options: action.payload.initialOptions || [],
        isInputLocked: true,
        selectedAnswer: null,
        plannedQuestions: action.payload.plannedQuestions || null,
      };

    case 'SET_OPTIONS':
      return {
        ...state,
        options: action.payload,
      };

    case 'SET_HINT_STREETS':
      return {
        ...state,
        hintStreets: action.payload,
        hintsRevealedCount: 0,
      };

    case 'REVEAL_HINT':
      return {
        ...state,
        hintsRevealedCount: state.hintsRevealedCount + 1,
      };

    case 'SELECT_ANSWER':
      return {
        ...state,
        selectedAnswer: action.payload,
        feedback: 'selected',
      };

    case 'ANSWER_SUBMITTED': {
      const potentialScore = state.score + action.payload.points;
      const finalScore = Math.min(potentialScore, MAX_SCORE);

      return {
        ...state,
        score: finalScore,
        correct: state.correct + (action.payload.result.status === 'correct' ? 1 : 0),
        quizResults: [...state.quizResults, action.payload.result],
        feedback: 'transitioning',
        selectedAnswer: action.payload.selectedStreet,
      };
    }

    case 'NEXT_QUESTION': {
      const nextIndex = state.currentQuestionIndex + 1;
      const isFinished = nextIndex >= state.quizStreets.length;

      if (isFinished) {
        return {
          ...state,
          gameState: 'summary',
          feedback: 'idle',
        };
      }

      return {
        ...state,
        currentQuestionIndex: nextIndex,
        feedback: 'idle',
        selectedAnswer: null,
        hintsRevealedCount: 0,
        questionStartTime: null,
        isInputLocked: true,
        options: action.payload.options || [],
      };
    }

    case 'SET_ACTIVE_PAGE':
      return {
        ...state,
        activePage: action.payload,
      };

    case 'SET_AUTO_ADVANCE':
      return {
        ...state,
        autoAdvance: action.payload,
      };

    case 'SET_REGISTER_MODE':
      return {
        ...state,
        registerMode: action.payload,
      };

    case 'SET_GAME_ID':
      return {
        ...state,
        gameId: action.payload,
      };

    case 'UNLOCK_INPUT':
      return {
        ...state,
        isInputLocked: false,
        questionStartTime: Date.now(),
      };

    case 'LOGOUT':
      return {
        ...state,
        username: '',
        realName: '',
        profileLoaded: false,
        gameState: 'intro',
        activePage: null,
      };

    default:
      return state;
  }
}
