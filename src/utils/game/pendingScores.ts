/**
 * Pending score queue — survives page reloads.
 *
 * When a DB save fails at game end, the score is queued here.
 * On next app load `flushPendingScores()` retries them automatically.
 */

import { STORAGE_KEYS } from '../../config/constants';
import { GameResultData, insertGameResult } from '../../services/db/games';
import { getUserByUid } from '../../services/db/users';
import { supabase } from '../../services/supabase';
import { createLogger } from '../logger';
import { normalizeUsername } from '../format';
import { storage } from '../storage';

const logger = createLogger('PendingScores');

// Prevent concurrent flush calls (React strict-mode double-invoke, re-mounts)
let flushInProgress: Promise<void> | null = null;

export function queuePendingScore(data: GameResultData): void {
  const pending = storage.get<GameResultData[]>(STORAGE_KEYS.PENDING_SCORES, []);

  // Dedup: if endGame partially succeeded (DB wrote but response was lost),
  // don't queue a second entry for the same user + calendar date.
  const playDate = data.played_at.slice(0, 10);
  const alreadyQueued = pending.some(
    p => p.username === data.username && p.played_at.slice(0, 10) === playDate
  );
  if (alreadyQueued) {
    logger.info(`Score for ${data.username} on ${playDate} already queued — skipping duplicate`);
    return;
  }

  pending.push(data);
  storage.set(STORAGE_KEYS.PENDING_SCORES, pending);
  logger.info(
    `Queued pending score for ${data.username} (${data.score} pts). Queue: ${pending.length}`
  );
}

export function flushPendingScores(): Promise<void> {
  if (!flushInProgress) {
    flushInProgress = _doFlush().finally(() => {
      flushInProgress = null;
    });
  }
  return flushInProgress;
}

async function _doFlush(): Promise<void> {
  const pending = storage.get<GameResultData[]>(STORAGE_KEYS.PENDING_SCORES, []);
  if (pending.length === 0) {
    return;
  }

  // Resolve the authenticated user's canonical username so we can discard
  // any queue entries that don't belong to them (tamper protection).
  const { data: authData } = await supabase.auth.getUser();
  const sessionUid = authData?.user?.id;
  let sessionUsername: string | null = null;
  if (sessionUid) {
    const userRow = await getUserByUid(sessionUid);
    sessionUsername = userRow?.username ? normalizeUsername(userRow.username) : null;
  }

  if (!sessionUsername) {
    logger.info('No authenticated session — deferring flush until next login.');
    return;
  }

  logger.info(`Flushing ${pending.length} pending score(s) for ${sessionUsername}...`);
  const remaining: GameResultData[] = [];

  for (const score of pending) {
    const scoreUsername = score.username ? normalizeUsername(score.username) : null;
    if (scoreUsername !== sessionUsername) {
      logger.warn(
        `Discarding queued score for ${score.username} — does not match session user ${sessionUsername}`
      );
      continue;
    }
    try {
      const { success } = await insertGameResult(score);
      if (success) {
        logger.info(`Flushed pending score for ${score.username}`);
      } else {
        remaining.push(score);
      }
    } catch (err) {
      logger.error(`Exception flushing score for ${score.username}:`, err);
      remaining.push(score);
    }
  }

  storage.set(STORAGE_KEYS.PENDING_SCORES, remaining);

  if (remaining.length > 0) {
    logger.error(`${remaining.length} score(s) still pending after flush`);
  }
}
