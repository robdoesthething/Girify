import { Dispatch, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { GAME_LOGIC, STORAGE_KEYS, TIME } from '../../../config/constants';
import { calculateScore } from '../../../config/gameConfig';
import quizPlan from '../../../data/quizPlan.json';
import { gameReducer, initialState } from '../../../reducers/gameReducer';
import { startGame } from '../../../services/gameService';
import { GameStateObject, QuizResult, Street } from '../../../types/game';
import { getTodaySeed, shuffleOptions } from '../../../utils/game/dailyChallenge';
import {
  calculateGameSetup,
  GameSetupResult,
  generateOptionsList,
} from '../../../utils/game/gameHelpers';
import { storage } from '../../../utils/storage';
import { useGamePersistence } from './useGamePersistence';

interface GameAction {
  type: string;
  payload?:
    | string
    | number
    | boolean
    | Street
    | Street[]
    | QuizResult
    | null
    | GameSetupResult
    | Record<string, unknown>;
}

export interface UseGameStateResult {
  state: GameStateObject;
  dispatch: Dispatch<GameAction>;
  currentStreet: Street | null;
  setupGame: (freshName?: string) => void;
  processAnswer: (selectedStreet: Street) => void;
  handleSelectAnswer: (selectedStreet: Street) => void;
  handleNext: () => void;
  handleRegister: (name: string) => void;
}

/**
 * Hook for managing all game state and gameplay logic
 * @param {Array} validStreets - Array of valid street objects
 * @param {Function} getHintStreets - Function to calculate hint streets
 * @returns {Object} Game state, dispatch, and handlers
 */
export const useGameState = (
  validStreets: Street[],
  getHintStreets: (street: Street) => Street[]
): UseGameStateResult => {
  const [state, dispatch] = useReducer(gameReducer, initialState) as [
    GameStateObject,
    Dispatch<GameAction>,
  ];
  const { saveGameResults } = useGamePersistence();

  // Current street being quizzed
  const currentStreet = useMemo(
    () => (state.gameState === 'playing' ? state.quizStreets[state.currentQuestionIndex] : null),
    [state.gameState, state.quizStreets, state.currentQuestionIndex]
  );

  // Sync Auto-Advance to localStorage
  useEffect(() => {
    storage.set(STORAGE_KEYS.AUTO_ADVANCE, state.autoAdvance);
  }, [state.autoAdvance]);

  // Calculate hint streets when current street changes
  useEffect(() => {
    if (!currentStreet) {
      dispatch({ type: 'SET_HINT_STREETS', payload: [] });
      return;
    }
    const hints = getHintStreets(currentStreet);
    dispatch({ type: 'SET_HINT_STREETS', payload: hints });
  }, [currentStreet, getHintStreets]);

  // ...

  // ...

  /**
   * Setup a new game session
   */
  const setupGame = useCallback(
    async (freshName?: string) => {
      const activeName = freshName || state.username;
      if (!activeName) {
        dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
        return;
      }

      const setupResult = calculateGameSetup(validStreets, quizPlan);

      if (!setupResult) {
        dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
        return;
      }

      // Initialize Redis session (non-blocking, with timeout)
      const redisPromise = Promise.race([
        startGame(activeName).then(gameId => {
          dispatch({ type: 'SET_GAME_ID', payload: gameId });
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 3000)),
      ]).catch(e => {
        console.error('Failed to start game session in Redis:', e);
      });

      // Start game immediately — don't wait for Redis
      dispatch({
        type: 'START_GAME',
        payload: setupResult,
      });

      // Let Redis finish in background
      void redisPromise;
    },
    [state.username, validStreets, dispatch]
  );

  /**
   * Process answer submission
   */
  const processAnswer = useCallback(
    (selectedStreet: Street) => {
      if (state.feedback === 'transitioning') {
        return;
      }
      if (!currentStreet) {
        return;
      }

      const isCorrect = selectedStreet.id === currentStreet.id;
      const timeElapsed = state.questionStartTime
        ? (Date.now() - state.questionStartTime) / 1000
        : 0;
      const points = calculateScore(timeElapsed, isCorrect, state.hintsRevealedCount);

      const result: QuizResult = {
        street: currentStreet,
        userAnswer: selectedStreet.name,
        status: isCorrect ? 'correct' : 'failed',
        time: timeElapsed,
        points: points,
        hintsUsed: state.hintsRevealedCount,
      };

      dispatch({
        type: 'ANSWER_SUBMITTED',
        payload: { result, points, selectedStreet },
      });
    },
    [currentStreet, state.feedback, state.questionStartTime, state.hintsRevealedCount, dispatch]
  );

  /**
   * Handle answer selection
   */
  const handleSelectAnswer = useCallback(
    (selectedStreet: Street) => {
      dispatch({ type: 'SELECT_ANSWER', payload: selectedStreet });
      processAnswer(selectedStreet);
    },
    [processAnswer, dispatch]
  );

  /**
   * Handle advancing to next question or game end
   */
  const handleNext = useCallback(() => {
    if (state.feedback !== 'transitioning') {
      return;
    }

    const nextIndex = state.currentQuestionIndex + 1;

    if (nextIndex >= state.quizStreets.length) {
      // Game complete
      if (state.gameState === 'playing') {
        saveGameResults(state);
        // Since saving is async (fire-and-forget logic below), we don't strictly *block* UI here,
        // but we could wrap saveGameResults in execute() if we wanted a "Saving..." indicator.
        // For now, let's keep it fluid as users might want to see summary immediately.
      }
      dispatch({ type: 'NEXT_QUESTION', payload: {} });
    } else {
      // Next question
      const nextStreet = state.quizStreets[nextIndex];
      let nextOptions: Street[] = [];

      if (state.plannedQuestions && state.plannedQuestions[nextIndex]) {
        const plannedQ = state.plannedQuestions[nextIndex];
        const streetMap = new Map(validStreets.map(s => [s.id, s]));
        const distractorStreets = plannedQ.distractorIds
          .map((id: string) => streetMap.get(id))
          .filter(Boolean) as Street[];

        if (distractorStreets.length >= GAME_LOGIC.DISTRACTORS_COUNT) {
          const todaySeed = getTodaySeed();
          const opts = [nextStreet, ...distractorStreets.slice(0, GAME_LOGIC.DISTRACTORS_COUNT)];
          nextOptions = shuffleOptions(
            opts as Street[],
            todaySeed +
              nextIndex * GAME_LOGIC.QUESTION_SEED_MULTIPLIER +
              GAME_LOGIC.SHUFFLE_SEED_OFFSET
          );
        } else {
          nextOptions = generateOptionsList(nextStreet!, validStreets, nextIndex);
        }
      } else if (nextStreet) {
        nextOptions = generateOptionsList(nextStreet, validStreets, nextIndex);
      } else {
        nextOptions = [];
      }

      dispatch({
        type: 'NEXT_QUESTION',
        payload: { options: nextOptions },
      });
    }
  }, [state, validStreets, saveGameResults, dispatch]);

  // Keep a stable ref to handleNext for the auto-advance timer
  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  });

  // Auto-advance effect
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (state.feedback === 'transitioning' && state.autoAdvance) {
      timeoutId = setTimeout(() => {
        handleNextRef.current();
      }, TIME.AUTO_ADVANCE_DELAY);
    }
    return () => clearTimeout(timeoutId);
  }, [state.autoAdvance, state.feedback]);

  /**
   * Handle user registration
   */
  const handleRegister = useCallback(
    (name: string) => {
      // Only set storage - useAuth listener will dispatch if needed
      const currentUsername = storage.get(STORAGE_KEYS.USERNAME, '');
      if (currentUsername !== name) {
        storage.set(STORAGE_KEYS.USERNAME, name);
      }
      dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
    },
    [dispatch]
  );

  return {
    state,
    dispatch,
    currentStreet: currentStreet || null,
    setupGame,
    processAnswer,
    handleSelectAnswer,
    handleNext,
    handleRegister,
  };
};

export default useGameState;
