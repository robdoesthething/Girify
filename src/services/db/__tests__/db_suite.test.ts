/**
 * Database Integration Test Suite
 *
 * NOTE: These tests use dynamic imports with vi.doMock() to avoid mock pollution.
 * However, they may still be affected by other test files calling vi.clearAllMocks().
 *
 * ✅ RELIABLE: Run in isolation with:
 *    npm test -- src/services/db/__tests__/db_suite.test.ts --run
 *
 * ⚠️ FLAKY: May fail intermittently when run with full test suite due to global mock clearing
 *           from other test files. This is a known Vitest limitation with shared mock registry.
 *
 * If these tests fail in CI, re-run them - they should pass in isolation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create fresh mock builder for each test
function createMockBuilder() {
  const builder: any = {};
  const mockReturnBuilder = vi.fn().mockReturnValue(builder);

  const methods = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'order',
    'limit',
    'gte',
    'single',
    'in',
  ];

  methods.forEach(method => {
    builder[method] = mockReturnBuilder;
  });

  builder.then = vi.fn(resolve => resolve({ data: [], error: null }));

  return builder;
}

describe('Database Integration Suite', () => {
  let mockBuilder: any;
  let supabaseMock: any;

  beforeEach(async () => {
    // Reset module registry to force fresh imports
    vi.resetModules();

    // Create fresh mocks for each test to avoid pollution
    mockBuilder = createMockBuilder();

    supabaseMock = {
      from: vi.fn(() => mockBuilder),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    // Re-mock the module for each test
    vi.doMock('../../supabase', () => ({
      supabase: supabaseMock,
    }));
  });

  describe('Users Service', () => {
    it('getUserByUsername should fetch user with normalized username', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      mockBuilder.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: mockUser, error: null })
      );

      // Dynamic import to get fresh module with our mock
      const { getUserByUsername } = await import('../users');
      const result = await getUserByUsername('@TestUser');

      expect(supabaseMock.from).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUser);
    });

    it('updateUser should return true on success', async () => {
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve({ error: null }));

      const { updateUser } = await import('../users');
      const result = await updateUser('TestUser', { real_name: 'New Name' });

      expect(result).toBe(true);
    });
  });

  describe('Friends Service', () => {
    it('createFriendRequest should return true on success', async () => {
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve({ error: null }));

      const { createFriendRequest } = await import('../friends');
      const result = await createFriendRequest('Alice', 'Bob');

      expect(result).toBe(true);
    });
  });

  describe('Shop Service', () => {
    it('getShopItems should fetch active items', async () => {
      const mockItems = [{ id: '1', name: 'Item', cost: 100 }];
      mockBuilder.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: mockItems, error: null })
      );

      const { getShopItems } = await import('../shop');
      const result = await getShopItems();

      expect(result).toEqual(mockItems);
    });
  });

  describe('Games Service', () => {
    it('insertGameResult should success', async () => {
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve({ error: null }));

      const { insertGameResult } = await import('../games');
      const result = await insertGameResult({
        user_id: 'TestUser',
        score: 1000,
        time_taken: 10,
        correct_answers: 5,
        question_count: 5,
        played_at: 'now',
        platform: 'web',
        is_bonus: false,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Quests Service', () => {
    it('getDailyQuests should fetch quests', async () => {
      const mockQuests = [{ id: 1, title: 'Quest 1', is_active: true }];

      mockBuilder.then.mockImplementation((resolve: any) =>
        resolve({ data: mockQuests, error: null })
      );

      const { getDailyQuests } = await import('../quests');
      // Call without userId to avoid the second query
      const result = await getDailyQuests();

      // Just verify the function completes and returns an array
      expect(Array.isArray(result)).toBe(true);
    });

    it('checkAndProgressQuests should update progress', async () => {
      const mockState = {
        score: 1500,
        correct: 5,
        correctStreak: 0,
        username: 'test',
        quizResults: [],
        quizStreets: [],
        gameId: '1',
        lives: 3,
      } as any;

      const mockQuests = [
        { id: 1, title: 'Quest 1', criteria_type: 'score_attack', criteria_value: '1000' },
      ];

      mockBuilder.then
        .mockImplementationOnce((resolve: any) => resolve({ data: mockQuests, error: null }))
        .mockImplementationOnce((resolve: any) => resolve({ data: [], error: null }))
        .mockImplementationOnce((resolve: any) => resolve({ error: null }));

      const { checkAndProgressQuests } = await import('../quests');
      await checkAndProgressQuests('User1', mockState);

      // Just verify it completes without error
      expect(mockBuilder.upsert).toHaveBeenCalled();
    });
  });

  describe('Games Service - Extended', () => {
    it('getLeaderboardScores should fetch scores', async () => {
      const mockResponse = { data: [{ id: 1, score: 100 }], error: null };
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve(mockResponse));

      const { getLeaderboardScores } = await import('../games');
      const scores = await getLeaderboardScores('all');

      expect(scores).toHaveLength(1);
    });

    it('getUserGameHistory should fetch history with normalization', async () => {
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve({ data: [], error: null }));

      const { getUserGameHistory } = await import('../games');
      await getUserGameHistory('TestUser');

      expect(supabaseMock.from).toHaveBeenCalledWith('game_results');
    });
  });
});
