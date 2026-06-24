/**
 * Leaderboard data utility tests.
 * Verifies that the current user's row can be correctly identified
 * within the leaderboard entries returned from getLeaderboard.
 *
 * The actual "highlighted" rendering is a UI concern, but the data shape
 * (id === normalised username) is what the screen components depend on.
 */
import { describe, expect, it } from 'vitest';
import type { ScoreEntry } from '../social/leaderboard';

/**
 * Mirror of the logic used in LeaderboardScreen to find the current user's
 * own row:  entry.id === normalizedCurrentUsername
 */
function findOwnRow(entries: ScoreEntry[], currentUsername: string): ScoreEntry | undefined {
  const normalised = currentUsername.toLowerCase().replace(/^@/, '');
  return entries.find(e => e.id.toLowerCase() === normalised);
}

const sampleEntries: ScoreEntry[] = [
  { id: 'alice', username: '@alice', score: 2000, time: 5 },
  { id: 'bob', username: '@bob', score: 1800, time: 7 },
  { id: 'carol', username: '@carol', score: 1500, time: 9 },
];

describe('Leaderboard – own row identification', () => {
  it('finds the own row when username matches exactly', () => {
    const own = findOwnRow(sampleEntries, 'bob');
    expect(own).toBeDefined();
    expect(own!.id).toBe('bob');
  });

  it('finds the own row when username has @ prefix', () => {
    const own = findOwnRow(sampleEntries, '@carol');
    expect(own).toBeDefined();
    expect(own!.id).toBe('carol');
  });

  it('is case-insensitive', () => {
    const own = findOwnRow(sampleEntries, 'ALICE');
    expect(own).toBeDefined();
    expect(own!.id).toBe('alice');
  });

  it('returns undefined when current user is not on the leaderboard', () => {
    const own = findOwnRow(sampleEntries, 'dave');
    expect(own).toBeUndefined();
  });

  it('returns undefined for an empty leaderboard', () => {
    const own = findOwnRow([], 'alice');
    expect(own).toBeUndefined();
  });

  it('each entry has a unique id so exactly one own row is found', () => {
    const matches = sampleEntries.filter(e => e.id.toLowerCase() === 'bob');
    expect(matches).toHaveLength(1);
  });
});
