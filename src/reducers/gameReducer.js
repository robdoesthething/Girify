export const initialState = {
  // All users start at 'intro' - the landing/play screen
  // Logged-in users will see a "Play" button, not auto-start
  gameState: 'intro',
  username:
    typeof localStorage !== 'undefined' ? localStorage.getItem('girify_username') || '' : '',
  realName: localStorage.getItem('girify_realName') || '', // New field for user's real name
  profileLoaded: false, // True once profile is fetched from Firestore
  streak: 0, // Streak from DB
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
  plannedQuestions: null, // Pre-generated quiz plan questions
  registerMode: 'signin', // 'signin' | 'signup'
  isInputLocked: false,
};

export function gameReducer(state, action) {
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
        feedback: 'idle',
        hintsRevealedCount: 0,
        startTime: Date.now(),
        questionStartTime: null, // Will be set when animation completes (UNLOCK_INPUT)
        quizResults: [],
        options: action.payload.initialOptions || [],
        isInputLocked: true, // Lock input until animation finishes
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
        questionStartTime: null, // Wait for animation
        isInputLocked: true,
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

    case 'SET_REGISTER_MODE':
      return {
        ...state,
        registerMode: action.payload,
      };

    case 'UNLOCK_INPUT':
      return {
        ...state,
        isInputLocked: false,
        questionStartTime: Date.now(), // Start timer now
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
