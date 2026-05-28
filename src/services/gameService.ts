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
export async function startGame(): Promise<string> {
  return generateId();
}

export interface EndGameResult {
  success: boolean;
  error?: string;
  gameId?: string;
}

export interface EndGameOptions {
  finalScore: number;
  finalTime: number;
  correctAnswers: number;
  questionCount: number;
  username?: string;
}

/**
 * End the game and save result to Supabase.
 */
export async function endGame(gameId: string, options: EndGameOptions): Promise<EndGameResult> {
  const { finalScore, finalTime, correctAnswers, questionCount, username } = options;
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
