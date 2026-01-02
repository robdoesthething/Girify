export const initialState = {
  gameState: 'intro', // 'intro' | 'playing' | 'summary' | 'register' | 'instructions'
  username:
    typeof localStorage !== 'undefined' ? localStorage.getItem('girify_username') || '' : '',
  quizStreets: [],
  currentQuestionIndex: 0,
  score: 0,
  feedback: 'idle', // 'idle' | 'transitioning'
  options: [],
  autoAdvance:
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('girify_auto_advance') !== 'false'
      : true,
  hintStreets: [],
  hintsRevealedCount: 0,
  startTime: null,
  quizResults: [],
  questionStartTime: null,
  activePage: null, // 'leaderboard' | 'settings' | 'about' | 'profile' | null
  selectedAnswer: null, // New field for manual selection
};

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_USERNAME':
      return {
        ...state,
        username: action.payload,
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
        feedback: 'idle',
        hintsRevealedCount: 0,
        startTime: Date.now(),
        questionStartTime: Date.now(),
        quizResults: [],
        options: action.payload.initialOptions || [],
        selectedAnswer: null,
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
        hintsRevealedCount: 0, // Reset hints count when new hints are loaded (usually new question)
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

    case 'ANSWER_SUBMITTED':
      // Payload: { result, points }
      return {
        ...state,
        score: state.score + action.payload.points,
        quizResults: [...state.quizResults, action.payload.result],
        feedback: 'transitioning',
        selectedAnswer: action.payload.selectedStreet, // Persist selection after submit
      };

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
        questionStartTime: Date.now(),
        // Options should be set via SET_OPTIONS shortly after or in the same tick if possible,
        // but often we might need to calc them.
        // Ideally we pass them here if we pre-calc them.
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

    case 'LOGOUT':
      return {
        ...state,
        username: '',
        gameState: 'intro',
        activePage: null,
      };

    default:
      return state;
  }
}
