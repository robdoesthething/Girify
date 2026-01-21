import { redis } from './redis';
import { supabase } from './supabase';

export interface GameSession {
  userId: string;
  startTime: number;
  score: number;
  round: number;
  // Add other game state fields as needed
}

/**
 * Generates a simpler game ID.
 */
function generateId(): string {
  // eslint-disable-next-line no-magic-numbers
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Start a new game session.
 * Stores initial state in Redis with a 1-hour TTL.
 */
export async function startGame(userId: string): Promise<string> {
  const gameId = generateId();
  const sessionKey = `game:${gameId}`;

  const initialSession: GameSession = {
    userId,
    startTime: Date.now(),
    score: 0,
    round: 1,
  };

  // Expires after 3600 seconds (1 hour)
  // eslint-disable-next-line no-magic-numbers
  await redis.setex(sessionKey, 3600, JSON.stringify(initialSession));

  return gameId;
}

/**
 * Update the live score in Redis.
 * This can be called after each question.
 */
export async function updateGameScore(gameId: string, newScore: number): Promise<void> {
  const sessionKey = `game:${gameId}`;
  const rawData = await redis.get(sessionKey);

  if (rawData) {
    // Upstash Redis .get() returns the object directly if JSON, or string?
    // The SDK automatically parses JSON if it was stored as JSON?
    // Actually setex with JSON.stringify stores a string.
    // But verify behavior: usually set/get handles objects if configured, but here we explicitly stringified.
    // Let's safe parse.
    const session = (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) as GameSession;

    session.score = newScore;
    session.round += 1; // Increment round or logic as needed

    // Update with same TTL (resetting it? or use KEEPTTL if supported. simple setex resets it which is fine)
    await redis.setex(sessionKey, 3600, JSON.stringify(session));
  }
}

export interface EndGameResult {
  success: boolean;
  error?: string;
  gameId?: string;
}

/**
 * End the game.
 * 1. Retrieve session from Redis.
 * 2. Save result to Supabase.
 * 3. Delete from Redis.
 * @returns EndGameResult with success status and optional error message
 */
export async function endGame(
  gameId: string,
  finalScore: number,
  finalTime: number,
  correctAnswers: number,
  questionCount: number
): Promise<EndGameResult> {
  const sessionKey = `game:${gameId}`;

  try {
    const rawData = await redis.get(sessionKey);

    if (!rawData) {
      console.warn('[Redis] Session not found:', gameId);
      return {
        success: false,
        error: 'Session not found or expired. Please ensure Redis is running and accessible.',
      };
    }

    const session = (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) as GameSession;

    // Save to Supabase
    const { error } = await supabase.from('game_results').insert({
      user_id: session.userId || null,
      score: finalScore,
      time_taken: finalTime,
      correct_answers: correctAnswers,
      question_count: questionCount,
      played_at: new Date().toISOString(),
      platform: 'web',
      is_bonus: false,
    });

    if (error) {
      console.error('[Supabase] Failed to save game:', error);
      // Keep Redis data for potential retry
      return {
        success: false,
        error: `Database error: ${error.message}`,
      };
    }

    // Clean up Redis only after successful save
    await redis.del(sessionKey);

    return { success: true, gameId };
  } catch (error) {
    console.error('[Game] Unexpected error in endGame:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
