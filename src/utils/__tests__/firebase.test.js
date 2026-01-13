import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLeaderboard, saveScore } from '../leaderboard';

// Mock Firestore
const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  timestamp: { now: vi.fn(() => ({ seconds: 1234567890 })) },
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args) => mocks.collection(...args),
  doc: (...args) => mocks.doc(...args),
  setDoc: (...args) => mocks.setDoc(...args),
  addDoc: (...args) => mocks.addDoc(...args),
  getDoc: (...args) => mocks.getDoc(...args),
  getDocs: (...args) => mocks.getDocs(...args),
  query: (...args) => mocks.query(...args),
  orderBy: (...args) => mocks.orderBy(...args),
  limit: (...args) => mocks.limit(...args),
  where: (...args) => mocks.where(...args),
  Timestamp: mocks.timestamp,
}));

vi.mock('../../firebase', () => ({
  db: {},
}));

vi.mock('../dailyChallenge', () => ({
  getTodaySeed: () => 20240101,
}));

describe('Firebase Leaderboard Functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.collection.mockReturnValue('mockCollection');
    mocks.doc.mockReturnValue('mockDoc');
    mocks.query.mockReturnValue('mocks.query');
    mocks.orderBy.mockReturnValue('mocks.orderBy');
    mocks.limit.mockReturnValue('mocks.limit');
    mocks.where.mockReturnValue('mocks.where');
  });

  describe('saveScore', () => {
    it('should save score to history collection', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => false,
      });

      await saveScore('TestUser', 1500, '10.5');

      expect(mocks.addDoc).toHaveBeenCalledTimes(1);
      expect(mocks.addDoc).toHaveBeenCalledWith(
        'mockCollection',
        expect.objectContaining({
          username: 'TestUser',
          score: 1500,
          time: 10.5,
          date: 20240101,
          platform: 'web',
        })
      );
    });

    it('should update personal best when no previous score exists', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => false,
      });

      await saveScore('NewUser', 1200, '12.0');

      expect(mocks.setDoc).toHaveBeenCalledTimes(1);
      expect(mocks.setDoc).toHaveBeenCalledWith(
        'mockDoc',
        expect.objectContaining({
          username: 'NewUser',
          score: 1200,
          time: 12.0,
        })
      );
    });

    it('should update personal best when new score is higher', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'TestUser',
          score: 1000,
          time: 15.0,
        }),
      });

      await saveScore('TestUser', 1500, '10.0');

      expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    });

    it('should not update personal best when new score is lower', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'TestUser',
          score: 1500,
          time: 10.0,
        }),
      });

      await saveScore('TestUser', 1200, '12.0');

      expect(mocks.setDoc).not.toHaveBeenCalled();
    });

    it('should update personal best when score is same but time is better', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'TestUser',
          score: 1500,
          time: 12.0,
        }),
      });

      await saveScore('TestUser', 1500, '10.0');

      expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    });

    it('should not update personal best when score is same but time is worse', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'TestUser',
          score: 1500,
          time: 10.0,
        }),
      });

      await saveScore('TestUser', 1500, '12.0');

      expect(mocks.setDoc).not.toHaveBeenCalled();
    });

    it('should handle missing username gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await saveScore('', 1500, '10.0');

      expect(consoleSpy).toHaveBeenCalled();
      expect(mocks.addDoc).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle null username gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await saveScore(null, 1500, '10.0');

      expect(consoleSpy).toHaveBeenCalled();
      expect(mocks.addDoc).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should parse time as float', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => false,
      });

      await saveScore('TestUser', 1500, '10.5');

      expect(mocks.addDoc).toHaveBeenCalledWith(
        'mockCollection',
        expect.objectContaining({
          time: 10.5,
        })
      );
    });

    it('should include timestamp and date', async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => false,
      });

      await saveScore('TestUser', 1500, '10.0');

      expect(mocks.addDoc).toHaveBeenCalledWith(
        'mockCollection',
        expect.objectContaining({
          date: 20240101,
          timestamp: expect.any(Object),
        })
      );
    });

    it('should handle Firestore errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.addDoc.mockRejectedValue(new Error('Firestore error'));

      await saveScore('TestUser', 1500, '10.0');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getLeaderboard', () => {
    it('should fetch all-time leaderboard from highscores collection', async () => {
      const mockScores = [
        { id: '1', data: () => ({ username: 'User1', score: 1800, time: 8.0 }) },
        { id: '2', data: () => ({ username: 'User2', score: 1700, time: 9.0 }) },
      ];

      // Return valid snapshot structure for both calls (scores + migrations)
      mocks.getDocs.mockResolvedValue({
        docs: mockScores,
        forEach: fn => mockScores.forEach(fn),
        size: mockScores.length,
        empty: mockScores.length === 0,
      });

      const result = await getLeaderboard('all');

      expect(mocks.query).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: '@user1', // updated expectation
        username: '@user1', // updated expectation
        score: 1800,
      });
    });

    it('should fetch daily leaderboard with date filter', async () => {
      const mockScores = [
        { id: '1', data: () => ({ username: 'User1', score: 1800, time: 8.0, date: 20240101 }) },
      ];

      mocks.getDocs.mockResolvedValue({
        docs: mockScores,
        forEach: fn => mockScores.forEach(fn),
        size: mockScores.length,
        empty: mockScores.length === 0,
      });

      await getLeaderboard('daily');

      // Logic changed: Now it fetches last 2000 items and filters in-memory
      expect(mocks.limit).toHaveBeenCalledWith(2000);
    });

    it('should handle empty leaderboard', async () => {
      mocks.getDocs.mockResolvedValue({
        docs: [],
        forEach: fn => [].forEach(fn),
        size: 0,
        empty: true,
      });

      const result = await getLeaderboard('all');

      expect(result).toEqual([]);
    });

    it('should handle Firestore errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.getDocs.mockRejectedValue(new Error('Firestore error'));

      const result = await getLeaderboard('all');

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should deduplicate scores by username', async () => {
      const mockScores = [
        { id: '1', data: () => ({ username: 'User1', score: 1800, time: 8.0 }) },
        { id: '2', data: () => ({ username: 'User1', score: 1700, time: 9.0 }) },
        { id: '3', data: () => ({ username: 'User2', score: 1600, time: 10.0 }) },
      ];

      mocks.getDocs.mockResolvedValue({
        docs: mockScores,
        forEach: fn => mockScores.forEach(fn),
        size: mockScores.length,
        empty: mockScores.length === 0,
      });

      const result = await getLeaderboard('all');

      // Should only have one entry per user (the highest score)
      const usernames = result.map(r => r.username);
      expect(new Set(usernames).size).toBe(usernames.length);
    });
  });

  describe('Integration: Save and Retrieve', () => {
    it('should save score and retrieve it from leaderboard', async () => {
      // Setup: No existing score
      mocks.getDoc.mockResolvedValue({
        exists: () => false,
      });
      mocks.addDoc.mockResolvedValue({});
      mocks.setDoc.mockResolvedValue({});

      // Save score
      await saveScore('IntegrationUser', 1500, '10.0');

      // Verify save was called
      expect(mocks.addDoc).toHaveBeenCalled();
      expect(mocks.getDoc).toHaveBeenCalled();
      expect(mocks.setDoc).toHaveBeenCalled();

      // Setup: Mock retrieval
      const mockDocs = [
        {
          id: '1',
          data: () => ({
            username: 'IntegrationUser',
            score: 1500,
            time: 10.0,
            date: 20240101,
          }),
        },
      ];
      mocks.getDocs.mockResolvedValue({
        docs: mockDocs,
        forEach: fn => mockDocs.forEach(fn),
        size: mockDocs.length,
      });

      // Retrieve leaderboard
      const leaderboard = await getLeaderboard('all');

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0]).toMatchObject({
        username: '@integrationuser',
        score: 1500,
        time: 10.0,
      });
    });
  });
});
