import { createLogger } from '../utils/logger';
import { insertGameResult } from './db/games';

const logger = createLogger('GameService');

/**
 * Generates a game ID.
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Start a new game session. Returns a local game ID.
 */
export async function startGame(_userId: string): Promise<string> {
  return generateId();
}

export interface EndGameResult {
  success: boolean;
  error?: string;
  gameId?: string;
}

/**
 * End the game and save result to Supabase.
 * @returns EndGameResult with success status and optional error message
 */
export async function endGame(
  gameId: string,
  finalScore: number,
  finalTime: number,
  correctAnswers: number,
  questionCount: number,
  username?: string
): Promise<EndGameResult> {
  try {
    const { success, error } = await insertGameResult({
      username: username || null,
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
