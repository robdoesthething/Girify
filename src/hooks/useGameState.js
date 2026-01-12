import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { gameReducer, initialState } from '../state/gameReducer';
import {
  getTodaySeed,
  selectDailyStreets,
  markTodayAsPlayed,
  selectDistractors,
  shuffleOptions,
} from '../utils/dailyChallenge';
import { calculateTimeScore } from '../utils/scoring';
import { calculateStreak } from '../utils/achievements';
import { saveScore, hasDailyReferral } from '../utils/leaderboard';
import { updateUserGameStats, saveUserGameResult, getReferrer } from '../utils/social';
import { awardChallengeBonus, awardReferralBonus } from '../utils/giuros';
import quizPlan from '../data/quizPlan.json';

/**
 * Hook for managing all game state and gameplay logic
 * @param {Array} validStreets - Array of valid street objects
 * @param {Function} getHintStreets - Function to calculate hint streets
 * @returns {Object} Game state, dispatch, and handlers
 */
export const useGameState = (validStreets, getHintStreets) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const navigate = useNavigate();

  // Current street being quizzed
  const currentStreet = useMemo(
    () => (state.gameState === 'playing' ? state.quizStreets[state.currentQuestionIndex] : null),
    [state.gameState, state.quizStreets, state.currentQuestionIndex]
  );

  // Sync Auto-Advance to localStorage
  useEffect(() => {
    localStorage.setItem('girify_auto_advance', state.autoAdvance);
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
    let timeoutId;
    if (state.feedback === 'transitioning' && state.autoAdvance) {
      timeoutId = setTimeout(() => {
        handleNext();
      }, 1000);
    }
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.autoAdvance, state.feedback]);

  /**
   * Generate quiz options for a question
   */
  const generateOptionsList = useCallback((target, allStreets, questionIndex) => {
    const todaySeed = getTodaySeed();
    const questionSeed = todaySeed + questionIndex * 100;
    const distractors = selectDistractors(allStreets, target, questionSeed);
    const opts = [target, ...distractors];
    return shuffleOptions(opts, questionSeed + 50);
  }, []);

  /**
   * Setup a new game session
   */
  const setupGame = useCallback(
    freshName => {
      const activeName = freshName || state.username;
      if (!activeName) {
        dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
        return;
      }

      if (validStreets.length === 0) {
        console.error('No valid streets found!');
        dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
        return;
      }

      const todaySeed = getTodaySeed();
      const todayStr = new Date().toISOString().split('T')[0];
      const plannedQuiz = quizPlan?.quizzes?.find(q => q.date === todayStr);

      let selected;
      let initialOptions;

      if (plannedQuiz && plannedQuiz.questions?.length > 0) {
        // eslint-disable-next-line no-console
        console.log('[Quiz] Using pre-generated plan for', todayStr);
        const streetMap = new Map(validStreets.map(s => [s.id, s]));
        selected = plannedQuiz.questions.map(q => streetMap.get(q.correctId)).filter(Boolean);

        if (selected.length > 0) {
          const firstQ = plannedQuiz.questions[0];
          const correctStreet = streetMap.get(firstQ.correctId);
          const distractorStreets = firstQ.distractorIds
            .map(id => streetMap.get(id))
            .filter(Boolean);

          if (correctStreet && distractorStreets.length >= 3) {
            const opts = [correctStreet, ...distractorStreets.slice(0, 3)];
            initialOptions = shuffleOptions(opts, todaySeed + 50);
          } else {
            initialOptions = generateOptionsList(selected[0], validStreets, 0);
          }
        }
      }

      if (!selected || selected.length === 0) {
        // eslint-disable-next-line no-console
        console.log('[Quiz] Falling back to dynamic generation');
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
    selectedStreet => {
      if (state.feedback === 'transitioning') return;

      const isCorrect = selectedStreet.id === currentStreet.id;
      const timeElapsed = state.questionStartTime
        ? (Date.now() - state.questionStartTime) / 1000
        : 0;
      const points = calculateTimeScore(timeElapsed, isCorrect, state.hintsRevealedCount);

      const result = {
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
    selectedStreet => {
      dispatch({ type: 'SELECT_ANSWER', payload: selectedStreet });
      processAnswer(selectedStreet);
    },
    [processAnswer]
  );

  /**
   * Handle advancing to next question or game end
   */
  const handleNext = useCallback(() => {
    if (state.feedback !== 'transitioning') return;

    const nextIndex = state.currentQuestionIndex + 1;

    if (nextIndex >= state.quizStreets.length) {
      // Game complete
      if (state.gameState === 'playing') {
        saveGameResults();
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
          .map(id => streetMap.get(id))
          .filter(Boolean);

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
    try {
      markTodayAsPlayed();
      const history = JSON.parse(localStorage.getItem('girify_history') || '[]');
      const avgTime = state.quizResults.length
        ? (
            state.quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0) /
            state.quizResults.length
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
      localStorage.setItem('girify_history', JSON.stringify(history));

      if (state.username) {
        saveUserGameResult(state.username, newRecord);

        hasDailyReferral(state.username).then(isBonus => {
          saveScore(state.username, state.score, newRecord.avgTime, {
            isBonus,
            correctAnswers: state.correct,
            questionCount: state.questions.length,
            email: auth.currentUser?.email,
          });
        });

        const historyForStreak = JSON.parse(localStorage.getItem('girify_history') || '[]');
        const streak = calculateStreak(historyForStreak);
        const totalScore = historyForStreak.reduce((acc, h) => acc + (h.score || 0), 0);

        updateUserGameStats(state.username, {
          streak,
          totalScore,
          lastPlayDate: getTodaySeed(),
        });

        awardChallengeBonus(state.username, streak).then(result => {
          // eslint-disable-next-line no-console
          console.log(`[Giuros] Challenge bonus: +${result.bonus}`);
        });

        getReferrer(state.username).then(referrer => {
          if (referrer) {
            awardReferralBonus(referrer).then(() => {
              // eslint-disable-next-line no-console
              console.log(`[Giuros] Referral bonus awarded to: ${referrer}`);
            });
          }
        });

        // Check for feedback prompt
        const lastFeedback = localStorage.getItem('girify_last_feedback');
        const now = Date.now();
        if (!lastFeedback || now - parseInt(lastFeedback) > 604800000) {
          if (Math.random() < 1 / 7) {
            setTimeout(() => navigate('/feedback'), 2000);
          }
        }
      }
    } catch (e) {
      console.error('[Game] Error saving game:', e);
    }
  }, [state, navigate]);

  /**
   * Handle user registration
   */
  const handleRegister = useCallback(name => {
    localStorage.setItem('girify_username', name);
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
