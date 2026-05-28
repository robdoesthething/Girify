import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockInsertGameResult = vi.fn();
const mockGetUser = vi.fn();
const mockGetUserByUid = vi.fn();
const mockStorageGet = vi.fn();
const mockStorageSet = vi.fn();

vi.mock('../../services/db/games', () => ({
  insertGameResult: (...args: unknown[]) => mockInsertGameResult(...args),
}));

vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

vi.mock('../../services/db/users', () => ({
  getUserByUid: (...args: unknown[]) => mockGetUserByUid(...args),
}));

vi.mock('../../utils/storage', () => ({
  storage: {
    get: (...args: unknown[]) => mockStorageGet(...args),
    set: (...args: unknown[]) => mockStorageSet(...args),
  },
}));

import { flushPendingScores, queuePendingScore } from '../game/pendingScores';
import type { GameResultData } from '../../services/db/games';

const makeScore = (overrides: Partial<GameResultData> = {}): GameResultData => ({
  username: '@alice1234',
  score: 800,
  time_taken: 5,
  correct_answers: 8,
  question_count: 10,
  played_at: '2026-05-28T10:00:00.000Z',
  platform: 'web',
  is_bonus: false,
  ...overrides,
});

describe('queuePendingScore', () => {
  beforeEach(() => {
    mockStorageGet.mockReturnValue([]);
    mockStorageSet.mockReset();
  });

  it('appends the score to the queue', () => {
    const score = makeScore();
    queuePendingScore(score);

    expect(mockStorageSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([score])
    );
  });

  it('preserves existing queue entries', () => {
    const existing = makeScore({ played_at: '2026-05-27T10:00:00.000Z' });
    mockStorageGet.mockReturnValue([existing]);

    const newScore = makeScore();
    queuePendingScore(newScore);

    const saved = (mockStorageSet.mock.calls[0] as [string, GameResultData[]])[1];
    expect(saved).toHaveLength(2);
    expect(saved).toContainEqual(existing);
    expect(saved).toContainEqual(newScore);
  });

  it('deduplicates: skips if same user + same calendar date already queued', () => {
    const existing = makeScore({ score: 750 });
    mockStorageGet.mockReturnValue([existing]);

    // Same user, same played_at date
    queuePendingScore(makeScore({ score: 999 }));

    expect(mockStorageSet).not.toHaveBeenCalled();
  });

  it('does not deduplicate scores for different dates', () => {
    const existing = makeScore({ played_at: '2026-05-27T10:00:00.000Z' });
    mockStorageGet.mockReturnValue([existing]);

    queuePendingScore(makeScore({ played_at: '2026-05-28T10:00:00.000Z' }));

    expect(mockStorageSet).toHaveBeenCalled();
    const saved = (mockStorageSet.mock.calls[0] as [string, GameResultData[]])[1];
    expect(saved).toHaveLength(2);
  });

  it('does not deduplicate scores for different users', () => {
    const existing = makeScore({ username: '@bob9999' });
    mockStorageGet.mockReturnValue([existing]);

    queuePendingScore(makeScore({ username: '@alice1234' }));

    expect(mockStorageSet).toHaveBeenCalled();
    const saved = (mockStorageSet.mock.calls[0] as [string, GameResultData[]])[1];
    expect(saved).toHaveLength(2);
  });
});

describe('flushPendingScores', () => {
  beforeEach(() => {
    mockInsertGameResult.mockReset();
    mockGetUser.mockReset();
    mockGetUserByUid.mockReset();
    mockStorageGet.mockReset();
    mockStorageSet.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns early when queue is empty', async () => {
    mockStorageGet.mockReturnValue([]);

    await flushPendingScores();

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockInsertGameResult).not.toHaveBeenCalled();
  });

  it('defers when no authenticated session', async () => {
    mockStorageGet.mockReturnValue([makeScore()]);
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await flushPendingScores();

    expect(mockInsertGameResult).not.toHaveBeenCalled();
    expect(mockStorageSet).not.toHaveBeenCalled();
  });

  it('defers when session user cannot be resolved to a username', async () => {
    mockStorageGet.mockReturnValue([makeScore()]);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-123' } } });
    mockGetUserByUid.mockResolvedValue(null);

    await flushPendingScores();

    expect(mockInsertGameResult).not.toHaveBeenCalled();
  });

  it('flushes owned scores and clears the queue', async () => {
    const score = makeScore();
    mockStorageGet.mockReturnValue([score]);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-123' } } });
    mockGetUserByUid.mockResolvedValue({ username: '@alice1234' });
    mockInsertGameResult.mockResolvedValue({ success: true });

    await flushPendingScores();

    expect(mockInsertGameResult).toHaveBeenCalledWith(score);
    expect(mockStorageSet).toHaveBeenCalledWith(expect.any(String), []);
  });

  it('retains scores that fail to insert', async () => {
    const score = makeScore();
    mockStorageGet.mockReturnValue([score]);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-123' } } });
    mockGetUserByUid.mockResolvedValue({ username: '@alice1234' });
    mockInsertGameResult.mockResolvedValue({ success: false });

    await flushPendingScores();

    const remaining = (mockStorageSet.mock.calls[0] as [string, GameResultData[]])[1];
    expect(remaining).toContainEqual(score);
  });

  it('retains scores that throw during insert', async () => {
    const score = makeScore();
    mockStorageGet.mockReturnValue([score]);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-123' } } });
    mockGetUserByUid.mockResolvedValue({ username: '@alice1234' });
    mockInsertGameResult.mockRejectedValue(new Error('network error'));

    await flushPendingScores();

    const remaining = (mockStorageSet.mock.calls[0] as [string, GameResultData[]])[1];
    expect(remaining).toContainEqual(score);
  });

  it('partial flush: clears successes, retains failures', async () => {
    const good = makeScore({ played_at: '2026-05-27T10:00:00.000Z', score: 700 });
    const bad = makeScore({ played_at: '2026-05-28T10:00:00.000Z', score: 800 });
    mockStorageGet.mockReturnValue([good, bad]);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-123' } } });
    mockGetUserByUid.mockResolvedValue({ username: '@alice1234' });
    mockInsertGameResult
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });

    await flushPendingScores();

    const remaining = (mockStorageSet.mock.calls[0] as [string, GameResultData[]])[1];
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toEqual(bad);
  });

  it('discards scores that belong to other users (tamper protection)', async () => {
    const ownScore = makeScore({ username: '@alice1234' });
    const foreignScore = makeScore({ username: '@hacker9999' });
    mockStorageGet.mockReturnValue([ownScore, foreignScore]);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-123' } } });
    mockGetUserByUid.mockResolvedValue({ username: '@alice1234' });
    mockInsertGameResult.mockResolvedValue({ success: true });

    await flushPendingScores();

    expect(mockInsertGameResult).toHaveBeenCalledTimes(1);
    expect(mockInsertGameResult).toHaveBeenCalledWith(ownScore);

    const remaining = (mockStorageSet.mock.calls[0] as [string, GameResultData[]])[1];
    expect(remaining).toHaveLength(0);
  });

  it('username comparison is case-insensitive', async () => {
    const score = makeScore({ username: '@Alice1234' });
    mockStorageGet.mockReturnValue([score]);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-123' } } });
    mockGetUserByUid.mockResolvedValue({ username: '@alice1234' });
    mockInsertGameResult.mockResolvedValue({ success: true });

    await flushPendingScores();

    expect(mockInsertGameResult).toHaveBeenCalledWith(score);
  });
});
