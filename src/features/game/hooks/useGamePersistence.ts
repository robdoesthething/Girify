import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, TIME } from '../../../config/constants';
import { shouldPromptFeedback } from '../../../config/gameConfig';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { insertGameResult } from '../../../services/db/games';
import { endGame } from '../../../services/gameService';
import { GameStateObject, QuizResult } from '../../../types/game';
import { GameHistory } from '../../../types/user';
import { debugLog } from '../../../utils/debug';
import { getTodaySeed, markTodayAsPlayed } from '../../../utils/game/dailyChallenge';
import { awardChallengeBonus, awardReferralBonus } from '../../../utils/shop/giuros';
import { getReferrer, updateUserGameStats } from '../../../utils/social';
import { calculateStreak } from '../../../utils/stats';
import { storage } from '../../../utils/storage';

/**
 * Fallback function to save score directly to Supabase without Redis
 * Used when Redis session is missing or endGame fails
 */
const fallbackSaveScore = async (state: GameStateObject, avgTime: number): Promise<void> => {
  // Use username from state (consistent with how gameService stores it)
  // This ensures leaderboard queries work correctly
  if (!state.username) {
    console.warn('[Fallback] No username in state, cannot save to Supabase');
    return;
  }

  try {
    debugLog(`[Fallback] Saving directly to DB...`);
    const { success, error } = await insertGameResult({
      user_id: state.username,
      score: state.score,
      time_taken: avgTime,
      correct_answers: state.correct,
      question_count: state.quizStreets.length,
      platform: 'web',
      is_bonus: false,
      played_at: new Date().toISOString(),
    });

    if (!success) {
      console.error('[Fallback] Failed to save directly to Supabase:', error);
      debugLog(
        `[Fallback] DB Save Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } else {
      console.warn('[Fallback] Score saved directly to Supabase');
      debugLog(`[Fallback] DB Save Success`);
    }
  } catch (err) {
    console.error('[Fallback] Exception during direct save:', err);
    debugLog(`[Fallback] Exception: ${String(err)}`);
  }
};

export const useGamePersistence = () => {
  const navigate = useNavigate();
  const { execute } = useAsyncOperation();

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
            // [MIGRATION] Use Game Service to end game (Redis -> Supabase)
            // Replaces legacy saveScore() logic
            if (state.gameId) {
              try {
                const result = await endGame(
                  state.gameId,
                  state.score,
                  Number(localRecord.avgTime),
                  state.correct,
                  state.quizStreets.length
                );

                if (!result.success) {
                  console.error('[Save Error] Failed to save game:', result.error);
                  debugLog(`[Persistence] Save Failed: ${result.error}. Trying fallback.`);
                  // Try fallback: direct Supabase insert without Redis
                  await fallbackSaveScore(state, Number(localRecord.avgTime));
                } else {
                  console.warn('[Save Success] Game saved:', result.gameId);
                  debugLog(`[Persistence] Save Success (GameID: ${result.gameId})`);
                }
              } catch (error) {
                console.error('[Save Exception] Critical error:', error);
                // Last resort: Try direct Supabase insert
                await fallbackSaveScore(state, Number(localRecord.avgTime));
              }
            } else {
              console.warn(
                '[Migration] No gameId found - using fallback save (Redis session missing)'
              );
              // No gameId = no Redis session, use fallback directly
              await fallbackSaveScore(state, Number(localRecord.avgTime));
            }

            const historyForStreak = storage.get<GameHistory[]>(STORAGE_KEYS.HISTORY, []);
            const streak = calculateStreak(
              historyForStreak.map(h => ({ ...h, date: Number(h.date) }))
            );
            const totalScore = historyForStreak.reduce(
              (acc: number, h: GameHistory) => acc + (h.score || 0),
              0
            );

            await updateUserGameStats(state.username, {
              streak,
              totalScore,
              lastPlayDate: String(getTodaySeed()),
            });

            await awardChallengeBonus(state.username, streak);

            const referrer = await getReferrer(state.username);
            if (referrer) {
              await awardReferralBonus(referrer);
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
    [navigate, execute]
  );

  return { saveGameResults };
};
