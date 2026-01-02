import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveScore, getLeaderboard } from '../leaderboard';

// Mock Firestore
const mockAddDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockTimestamp = { now: vi.fn(() => ({ seconds: 1234567890 })) };

vi.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  doc: (...args) => mockDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  addDoc: (...args) => mockAddDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
  limit: (...args) => mockLimit(...args),
  where: (...args) => mockWhere(...args),
  Timestamp: mockTimestamp,
}));

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('../dailyChallenge', () => ({
  getTodaySeed: () => 20240101,
}));

describe('Firebase Leaderboard Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('mockCollection');
    mockDoc.mockReturnValue('mockDoc');
    mockQuery.mockReturnValue('mockQuery');
    mockOrderBy.mockReturnValue('mockOrderBy');
    mockLimit.mockReturnValue('mockLimit');
    mockWhere.mockReturnValue('mockWhere');
  });

  describe('saveScore', () => {
    it('should save score to history collection', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await saveScore('TestUser', 1500, '10.5');

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledWith(
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
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await saveScore('NewUser', 1200, '12.0');

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mockDoc',
        expect.objectContaining({
          username: 'NewUser',
          score: 1200,
          time: 12.0,
        })
      );
    });

    it('should update personal best when new score is higher', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'TestUser',
          score: 1000,
          time: 15.0,
        }),
      });

      await saveScore('TestUser', 1500, '10.0');

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should not update personal best when new score is lower', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'TestUser',
          score: 1500,
          time: 10.0,
        }),
      });

      await saveScore('TestUser', 1200, '12.0');

      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should update personal best when score is same but time is better', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'TestUser',
          score: 1500,
          time: 12.0,
        }),
      });

      await saveScore('TestUser', 1500, '10.0');

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should not update personal best when score is same but time is worse', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          username: 'TestUser',
          score: 1500,
          time: 10.0,
        }),
      });

      await saveScore('TestUser', 1500, '12.0');

      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should handle missing username gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await saveScore('', 1500, '10.0');

      expect(consoleSpy).toHaveBeenCalled();
      expect(mockAddDoc).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle null username gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await saveScore(null, 1500, '10.0');

      expect(consoleSpy).toHaveBeenCalled();
      expect(mockAddDoc).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should parse time as float', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await saveScore('TestUser', 1500, '10.5');

      expect(mockAddDoc).toHaveBeenCalledWith(
        'mockCollection',
        expect.objectContaining({
          time: 10.5,
        })
      );
    });

    it('should include timestamp and date', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await saveScore('TestUser', 1500, '10.0');

      expect(mockAddDoc).toHaveBeenCalledWith(
        'mockCollection',
        expect.objectContaining({
          date: 20240101,
          timestamp: expect.any(Object),
        })
      );
    });

    it('should handle Firestore errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

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

      mockGetDocs.mockResolvedValue({
        docs: mockScores,
      });

      const result = await getLeaderboard('all');

      expect(mockQuery).toHaveBeenCalled();
      expect(mockOrderBy).toHaveBeenCalledWith('score', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: '1',
        username: 'User1',
        score: 1800,
      });
    });

    it('should fetch daily leaderboard with date filter', async () => {
      const mockScores = [
        { id: '1', data: () => ({ username: 'User1', score: 1800, time: 8.0, date: 20240101 }) },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockScores,
      });

      await getLeaderboard('daily');

      expect(mockWhere).toHaveBeenCalledWith('date', '==', 20240101);
    });

    it('should handle empty leaderboard', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      const result = await getLeaderboard('all');

      expect(result).toEqual([]);
    });

    it('should handle Firestore errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

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

      mockGetDocs.mockResolvedValue({
        docs: mockScores,
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
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      // Save score
      await saveScore('IntegrationUser', 1500, '10.0');

      // Verify save was called
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalled();

      // Setup: Mock retrieval
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: '1',
            data: () => ({
              username: 'IntegrationUser',
              score: 1500,
              time: 10.0,
              date: 20240101,
            }),
          },
        ],
      });

      // Retrieve leaderboard
      const leaderboard = await getLeaderboard('all');

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0]).toMatchObject({
        username: 'IntegrationUser',
        score: 1500,
        time: 10.0,
      });
    });
  });
});
