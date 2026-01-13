import { Dispatch, useCallback, useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { auth } from '../firebase';
// @ts-ignore
import { gameReducer, initialState } from '../reducers/gameReducer';
import {
  getTodaySeed,
  markTodayAsPlayed,
  selectDailyStreets,
  selectDistractors,
  shuffleOptions,
} from '../utils/dailyChallenge';
// @ts-ignore
import { calculateStreak } from '../utils/stats';
// @ts-ignore
import { saveScore } from '../utils/leaderboard';
// @ts-ignore
import { calculateScore, shouldPromptFeedback } from '../config/gameConfig';
import {
  getReferrer,
  hasDailyReferral,
  saveUserGameResult,
  updateUserGameStats,
} from '../utils/social';
// @ts-ignore
import { awardChallengeBonus, awardReferralBonus } from '../utils/giuros';
// @ts-ignore
import { logger } from '../utils/logger';
// @ts-ignore
import { storage } from '../utils/storage';
// @ts-ignore
import quizPlan from '../data/quizPlan.json';
// @ts-ignore
import { STORAGE_KEYS, TIME } from '../config/constants';
import { GameStateObject, QuizResult, Street } from '../types/game';
import { useAsyncOperation } from './useAsyncOperation'; // [NEW]

export interface UseGameStateResult {
  state: GameStateObject;
  dispatch: Dispatch<any>;
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
    Dispatch<any>,
  ];
  const navigate = useNavigate();
  const { execute } = useAsyncOperation(); // [NEW]

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

  // Auto-advance effect
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (state.feedback === 'transitioning' && state.autoAdvance) {
      timeoutId = setTimeout(() => {
        handleNext();
      }, TIME.AUTO_ADVANCE_DELAY);
    }
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.autoAdvance, state.feedback]);

  /**
   * Generate quiz options for a question
   */
  const generateOptionsList = useCallback(
    (target: Street, allStreets: Street[], questionIndex: number) => {
      const todaySeed = getTodaySeed();
      const questionSeed = todaySeed + questionIndex * 100;
      const distractors = selectDistractors(allStreets, target, questionSeed);
      const opts = [target, ...distractors];
      return shuffleOptions(opts, questionSeed + 50);
    },
    []
  );

  /**
   * Setup a new game session
   */
  const setupGame = useCallback(
    (freshName?: string) => {
      // NOTE: Setup is mostly synchronous/local calculation, so we might not need a loader here unless
      // we decide to fetch daily questions from server instead of local JSON plan.
      // Keeping it sync for now to avoid specific "loading" flash on simple transitions.

      const activeName = freshName || state.username;
      if (!activeName) {
        dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
        return;
      }

      if (validStreets.length === 0) {
        logger.error('No valid streets found!');
        dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
        return;
      }

      const todaySeed = getTodaySeed();
      const todayStr = new Date().toISOString().split('T')[0];
      const plannedQuiz = quizPlan?.quizzes?.find((q: QuizPlan) => q.date === todayStr);

      let selected: Street[] | undefined;
      let initialOptions: Street[] | undefined;

      if (plannedQuiz && plannedQuiz.questions?.length > 0) {
        const streetMap = new Map(validStreets.map(s => [s.id, s]));
        selected = plannedQuiz.questions
          .map((q: QuizQuestion) => streetMap.get(q.correctId))
          .filter(Boolean) as Street[];

        if (selected.length > 0) {
          const firstQ = plannedQuiz.questions[0];
          const correctStreet = streetMap.get(firstQ.correctId);
          const distractorStreets = firstQ.distractorIds
            .map((id: string) => streetMap.get(id))
            .filter(Boolean) as Street[];

          if (correctStreet && distractorStreets.length >= 3) {
            const opts = [correctStreet, ...distractorStreets.slice(0, 3)];
            initialOptions = shuffleOptions(opts, todaySeed + 50);
          } else {
            initialOptions = generateOptionsList(selected[0], validStreets, 0);
          }
        }
      }

      if (!selected || selected.length === 0) {
        selected = selectDailyStreets(validStreets, todaySeed);
        initialOptions =
          selected.length > 0 ? generateOptionsList(selected[0], validStreets, 0) : [];
      }

      dispatch({
        type: 'START_GAME',
        payload: {
          quizStreets: selected,
          initialOptions: initialOptions,
          plannedQuestions: plannedQuiz?.questions || null,
        },
      });
    },
    [state.username, validStreets, generateOptionsList]
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
    [currentStreet, state.feedback, state.questionStartTime, state.hintsRevealedCount]
  );

  /**
   * Handle answer selection
   */
  const handleSelectAnswer = useCallback(
    (selectedStreet: Street) => {
      dispatch({ type: 'SELECT_ANSWER', payload: selectedStreet });
      processAnswer(selectedStreet);
    },
    [processAnswer]
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
        saveGameResults();
        // Since saving is async (fire-and-forget logic below), we don't strictly *block* UI here,
        // but we could wrap saveGameResults in execute() if we wanted a "Saving..." indicator.
        // For now, let's keep it fluid as users might want to see summary immediately.
      }
      dispatch({ type: 'NEXT_QUESTION', payload: {} });
    } else {
      // Next question
      const nextStreet = state.quizStreets[nextIndex];
      let nextOptions;

      if (state.plannedQuestions && state.plannedQuestions[nextIndex]) {
        const plannedQ = state.plannedQuestions[nextIndex];
        const streetMap = new Map(validStreets.map(s => [s.id, s]));
        const distractorStreets = plannedQ.distractorIds
          .map((id: string) => streetMap.get(id))
          .filter(Boolean) as Street[];

        if (distractorStreets.length >= 3) {
          const todaySeed = getTodaySeed();
          const opts = [nextStreet, ...distractorStreets.slice(0, 3)];
          nextOptions = shuffleOptions(opts, todaySeed + nextIndex * 100 + 50);
        } else {
          nextOptions = generateOptionsList(nextStreet, validStreets, nextIndex);
        }
      } else {
        nextOptions = generateOptionsList(nextStreet, validStreets, nextIndex);
      }

      dispatch({
        type: 'NEXT_QUESTION',
        payload: { options: nextOptions },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.feedback,
    state.currentQuestionIndex,
    state.quizStreets,
    state.gameState,
    state.plannedQuestions,
    validStreets,
    generateOptionsList,
  ]);

  /**
   * Save game results to localStorage and Firestore
   */
  const saveGameResults = useCallback(() => {
    execute(
      async () => {
        markTodayAsPlayed();
        const history = storage.get(STORAGE_KEYS.HISTORY, []);
        const avgTime = state.quizResults.length
          ? (
              state.quizResults.reduce(
                (acc: number, curr: QuizResult) => acc + (curr.time || 0),
                0
              ) / state.quizResults.length
            ).toFixed(1)
          : 0;

        const newRecord = {
          date: getTodaySeed(),
          score: state.score,
          avgTime: avgTime,
          timestamp: Date.now(),
          username: state.username,
        };
        history.push(newRecord);
        storage.set(STORAGE_KEYS.HISTORY, history);

        if (state.username) {
          await saveUserGameResult(state.username, newRecord);

          const isBonus = await hasDailyReferral(state.username);
          await saveScore(state.username, state.score, newRecord.avgTime, {
            isBonus,
            correctAnswers: state.correct,
            questionCount: state.questions?.length || 0,
            // @ts-ignore
            email: auth.currentUser?.email,
          });

          const historyForStreak = storage.get(STORAGE_KEYS.HISTORY, []);
          const streak = calculateStreak(historyForStreak);
          const totalScore = historyForStreak.reduce(
            (acc: number, h: GameHistory) => acc + (h.score || 0),
            0
          );

          await updateUserGameStats(state.username, {
            streak,
            totalScore,
            lastPlayDate: getTodaySeed(),
          });

          await awardChallengeBonus(state.username, streak);

          const referrer = await getReferrer(state.username);
          if (referrer) {
            await awardReferralBonus(referrer);
          }

          // Check for feedback prompt
          const lastFeedback = storage.get(STORAGE_KEYS.LAST_FEEDBACK);
          const historyList = storage.get(STORAGE_KEYS.HISTORY, []);

          if (shouldPromptFeedback(lastFeedback, historyList.length)) {
            setTimeout(() => navigate('/feedback'), TIME.FEEDBACK_DELAY);
          }
        }
      },
      { loadingKey: 'save-game', errorMessage: 'Failed to save game results' }
    );
  }, [state, navigate, execute]);

  /**
   * Handle user registration
   */
  const handleRegister = useCallback((name: string) => {
    storage.set(STORAGE_KEYS.USERNAME, name);
    dispatch({ type: 'SET_USERNAME', payload: name });
    dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
  }, []);

  return {
    state,
    dispatch,
    currentStreet,
    setupGame,
    processAnswer,
    handleSelectAnswer,
    handleNext,
    handleRegister,
  };
};

export default useGameState;
