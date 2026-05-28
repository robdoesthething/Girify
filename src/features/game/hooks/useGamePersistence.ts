import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, TIME } from '../../../config/constants';
import { shouldPromptFeedback } from '../../../config/gameConfig';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { useNotification } from '../../../hooks/useNotification';
import { updateDistrictScore } from '../../../services/db/games';
import { checkAndProgressQuests } from '../../../services/db/quests';
import { getUserByUsername } from '../../../services/db/users';
import { endGame } from '../../../services/gameService';
import { GameStateObject, QuizResult } from '../../../types/game';
import { GameHistory } from '../../../types/user';
import { debugLog } from '../../../utils/debug';
import { getTodaySeed, markTodayAsPlayed } from '../../../utils/game/dailyChallenge';
import { useTheme } from '../../../context/ThemeContext';
import { queuePendingScore } from '../../../utils/game/pendingScores';
import { publishActivity } from '../../../utils/social/publishActivity';
import { storage } from '../../../utils/storage';
import { useGameReferrals } from './useGameReferrals';
import { useGameStreaks } from './useGameStreaks';

/**
 * Queues a score to localStorage when the DB save fails.
 * flushPendingScores() retries them on next app load.
 */
const queueScoreLocally = (state: GameStateObject, avgTime: number): void => {
  if (!state.username) {
    return;
  }
  queuePendingScore({
    username: state.username,
    score: state.score,
    time_taken: avgTime,
    correct_answers: state.correct,
    question_count: state.quizStreets.length,
    platform: 'web',
    is_bonus: false,
    played_at: new Date().toISOString(),
  });
};

export const useGamePersistence = () => {
  const navigate = useNavigate();
  const { execute } = useAsyncOperation();
  const { notify } = useNotification();
  const { t } = useTheme();
  const { processReferrals } = useGameReferrals();
  const { updateStreaks } = useGameStreaks();

  const saveGameResults = useCallback(
    (state: GameStateObject) => {
      execute(
        async () => {
          markTodayAsPlayed();
          const history = storage.get<GameHistory[]>(STORAGE_KEYS.HISTORY, []);
          const avgTime = state.quizResults.length
            ? (
                state.quizResults.reduce(
                  (acc: number, curr: QuizResult) => acc + (curr.time || 0),
                  0
                ) / state.quizResults.length
              ).toFixed(1)
            : 0;

          const localRecord: GameHistory = {
            date: String(getTodaySeed()),
            score: state.score,
            avgTime: String(avgTime),
            timestamp: Date.now(),
            username: state.username || '',
          };
          history.push(localRecord);
          storage.set(STORAGE_KEYS.HISTORY, history);

          if (state.username) {
            const avgTimeNum = Number(localRecord.avgTime);
            let saved = false;

            try {
              const result = await endGame(state.gameId || 'local', {
                finalScore: state.score,
                finalTime: avgTimeNum,
                correctAnswers: state.correct,
                questionCount: state.quizStreets.length,
                username: state.username,
              });

              if (result.success) {
                saved = true;
                debugLog(`[Persistence] Save Success (GameID: ${result.gameId})`);
              } else {
                console.error('[Save Error] Failed to save game:', result.error);
                debugLog(`[Persistence] Save Failed: ${result.error}`);
              }
            } catch (error) {
              console.error('[Save Exception] Critical error:', error);
            }

            if (!saved) {
              // Queue locally so the score is retried on next app load
              queueScoreLocally(state, avgTimeNum);
              if (notify) {
                notify(t('scorePendingWarning'), 'warning', 8000);
              }
            } else {
              // Update district aggregate score (fire-and-forget background task)
              getUserByUsername(state.username)
                .then(userRow => {
                  if (userRow?.district) {
                    updateDistrictScore(userRow.district, state.score).catch(err => {
                      console.error('[District] Failed to update district score:', err);
                    });
                  }
                })
                .catch(err => {
                  console.error('[District] Failed to fetch user for district update:', err);
                });
            }

            // Publish activity to friends feed
            try {
              await publishActivity(state.username, 'daily_score', {
                score: state.score,
                time: Number(localRecord.avgTime),
              });
              debugLog(`[Activity] Published game completion for ${state.username}`);
            } catch (err) {
              console.error('[Activity] Failed to publish game activity:', err);
            }

            // Update stats & streaks
            await updateStreaks(state.username, state.score);

            // Check referrals
            await processReferrals(state.username);

            // Check Quests
            try {
              const completedQuests = await checkAndProgressQuests(state.username, state);
              if (completedQuests.length > 0) {
                completedQuests.forEach(title => {
                  if (notify) {
                    notify(`Quest Completed: ${title}`, 'success', 5000);
                  }
                });
              }
            } catch (err) {
              console.error('Quest check failed', err);
            }

            // Check for feedback prompt
            const lastFeedback = storage.get<string>(STORAGE_KEYS.LAST_FEEDBACK, '');
            const historyList = storage.get<GameHistory[]>(STORAGE_KEYS.HISTORY, []);

            if (shouldPromptFeedback(lastFeedback, historyList.length)) {
              setTimeout(() => navigate('/feedback'), TIME.FEEDBACK_DELAY);
            }
          }
        },
        { loadingKey: 'save-game', errorMessage: 'Failed to save game results' }
      );
    },
    [navigate, execute, notify, t, processReferrals, updateStreaks]
  );

  return { saveGameResults };
};
