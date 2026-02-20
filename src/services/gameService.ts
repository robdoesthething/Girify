import { createLogger } from '../utils/logger';
import { insertGameResult } from './db/games';

const logger = createLogger('GameService');

export interface EndGameResult {
  success: boolean;
  error?: string;
  gameId?: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Start a new game session. Returns a correlation ID only.
 * Game state is managed client-side; no server session required.
 */
export async function startGame(_userId: string): Promise<string> {
  return generateId();
}

/**
 * No-op: game score is tracked client-side.
 */
export async function updateGameScore(_gameId: string, _newScore: number): Promise<void> {
  // Game state is managed client-side; no server update required.
}

/**
 * Save final game result to Supabase.
 */
export async function endGame(
  gameId: string,
  finalScore: number,
  finalTime: number,
  correctAnswers: number,
  questionCount: number,
  userId: string | null
): Promise<EndGameResult> {
  try {
    const { success, error } = await insertGameResult({
      user_id: userId,
      score: finalScore,
      time_taken: finalTime,
      correct_answers: correctAnswers,
      question_count: questionCount,
      played_at: new Date().toISOString(),
      platform: 'web',
      is_bonus: false,
    });

    if (!success) {
      logger.error('Failed to save game:', error);
      return {
        success: false,
        error: `Database error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    return { success: true, gameId };
  } catch (error) {
    logger.error('Unexpected error in endGame:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
