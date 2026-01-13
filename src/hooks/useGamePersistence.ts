import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { auth } from '../firebase';
import { getTodaySeed, markTodayAsPlayed } from '../utils/dailyChallenge';
// @ts-ignore
import { calculateStreak } from '../utils/stats';
// @ts-ignore
import { saveScore } from '../utils/leaderboard';
// @ts-ignore
import { shouldPromptFeedback } from '../config/gameConfig';
import {
  getReferrer,
  hasDailyReferral,
  saveUserGameResult,
  updateUserGameStats,
} from '../utils/social';
// @ts-ignore
import { awardChallengeBonus, awardReferralBonus } from '../utils/giuros';
// @ts-ignore
import { storage } from '../utils/storage';
// @ts-ignore
import { STORAGE_KEYS, TIME } from '../config/constants';
import { GameStateObject, QuizResult } from '../types/game';
import { GameHistory } from '../types/user';
import { useAsyncOperation } from './useAsyncOperation';

export const useGamePersistence = () => {
  const navigate = useNavigate();
  const { execute } = useAsyncOperation();

  const saveGameResults = useCallback(
    (state: GameStateObject) => {
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
    },
    [navigate, execute]
  );

  return { saveGameResults };
};
