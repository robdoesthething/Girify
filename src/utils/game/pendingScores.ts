/**
 * Pending score queue — survives page reloads.
 *
 * When a DB save fails at game end, the score is queued here.
 * On next app load `flushPendingScores()` retries them automatically.
 */

import { STORAGE_KEYS } from '../../config/constants';
import { GameResultData, insertGameResult } from '../../services/db/games';
import { createLogger } from '../logger';
import { storage } from '../storage';

const logger = createLogger('PendingScores');

export function queuePendingScore(data: GameResultData): void {
  const pending = storage.get<GameResultData[]>(STORAGE_KEYS.PENDING_SCORES, []);
  pending.push(data);
  storage.set(STORAGE_KEYS.PENDING_SCORES, pending);
  logger.info(
    `Queued pending score for ${data.username} (${data.score} pts). Queue: ${pending.length}`
  );
}

export async function flushPendingScores(): Promise<void> {
  const pending = storage.get<GameResultData[]>(STORAGE_KEYS.PENDING_SCORES, []);
  if (pending.length === 0) {
    return;
  }

  logger.info(`Flushing ${pending.length} pending score(s)...`);
  const remaining: GameResultData[] = [];

  for (const score of pending) {
    const { success } = await insertGameResult(score);
    if (success) {
      logger.info(`Flushed pending score for ${score.username}`);
    } else {
      remaining.push(score);
    }
  }

  storage.set(STORAGE_KEYS.PENDING_SCORES, remaining);

  if (remaining.length > 0) {
    logger.error(`${remaining.length} score(s) still pending after flush`);
  }
}
