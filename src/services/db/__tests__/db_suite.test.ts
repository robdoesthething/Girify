import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../supabase';
import { createFriendRequest } from '../friends';
import { getLeaderboardScores, getUserGameHistory, insertGameResult } from '../games';
import { checkAndProgressQuests, getDailyQuests } from '../quests';
import { getShopItems } from '../shop';
import { getUserByUsername, updateUser } from '../users';

// Global Mocks
vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Database Integration Suite', () => {
  const mockBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    gte: vi.fn(),
    gt: vi.fn(),
    lte: vi.fn(),
    lt: vi.fn(),
    in: vi.fn(),
    single: vi.fn(),
    then: vi.fn(resolve => resolve({ data: [], error: null })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup builder methods to return self
    Object.keys(mockBuilder).forEach(key => {
      if (key !== 'then') {
        (mockBuilder as any)[key].mockReturnValue(mockBuilder);
      }
    });

    // Setup the mock client return values
    // Since we mocked the module, 'supabase' object IS the mock object with vi.fn() methods
    (supabase.from as any).mockReturnValue(mockBuilder);
    (supabase.rpc as any).mockResolvedValue({ data: null, error: null } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Users Service', () => {
    it('getUserByUsername should fetch user with normalized username', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      mockBuilder.then.mockImplementation(resolve => resolve({ data: mockUser, error: null }));
      // Note: executeQuery wrapper might handle single().
      // If getUserByUsername uses .single(), result is the user object, not { data }.
      // But implementation awaits query.
      // If query.single() was called, Supabase returns { data: T, error }.
      // So mock resolving { data: mockUser } is correct.

      // Implementation calls returns executeQuery(...)
      // executeQuery awaits query.
      // executeQuery implementation returns { data, error }.data ??
      // Wait. Real executeQuery returns T | null.
      // It does: `const { data, error } = await query; if (error) return null; return data;`

      // So if we mock query to resolve `{ data: mockUser, error: null }`.
      // executeQuery returns `mockUser`.

      const result = await getUserByUsername('@TestUser');

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockBuilder.eq).toHaveBeenCalledWith('username', 'testuser');
      expect(result).toEqual(mockUser);
    });

    it('updateUser should return true on success', async () => {
      mockBuilder.then.mockImplementation(resolve => resolve({ error: null }));
      const result = await updateUser('TestUser', { real_name: 'New Name' });
      expect(result).toBe(true);
    });
  });

  describe('Friends Service', () => {
    it('createFriendRequest should return true on success', async () => {
      mockBuilder.then.mockImplementation(resolve => resolve({ error: null }));
      const result = await createFriendRequest('Alice', 'Bob');
      expect(mockBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          from_user: 'alice',
          to_user: 'bob',
        })
      );
      expect(result).toBe(true);
    });
  });

  describe('Shop Service', () => {
    it('getShopItems should fetch active items', async () => {
      const mockItems = [{ id: '1', name: 'Item', cost: 100 }];
      mockBuilder.then.mockImplementation(resolve => resolve({ data: mockItems, error: null }));

      const result = await getShopItems();
      expect(mockBuilder.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockItems);
    });
  });

  describe('Games Service', () => {
    it('insertGameResult should success', async () => {
      mockBuilder.then.mockImplementation(resolve => resolve({ error: null }));
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
      expect(mockBuilder.insert).toHaveBeenCalled();
    });
  });

  describe('Quests Service', () => {
    it('getDailyQuests should fetch quests and progress', async () => {
      const mockQuests = [{ id: 1, title: 'Quest 1' }];
      const mockProgress = [{ quest_id: 1, progress: 10 }];

      mockBuilder.then
        .mockImplementationOnce(resolve => resolve({ data: mockQuests, error: null }))
        .mockImplementationOnce(resolve => resolve({ data: mockProgress, error: null }));

      const result = await getDailyQuests('User1');
      expect(result.length).toBe(1);
      expect((result[0]?.progress as any)?.progress).toBe(10);
    });

    it('checkAndProgressQuests should update progress', async () => {
      const mockState = {
        // Partial<GameStateObject>
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

      // 1. getDailyQuests (2 queries)
      mockBuilder.then
        .mockImplementationOnce(resolve => resolve({ data: mockQuests, error: null }))
        .mockImplementationOnce(resolve => resolve({ data: [], error: null }));

      // 2. upsert progress
      mockBuilder.then.mockImplementationOnce(resolve => resolve({ error: null }));

      await checkAndProgressQuests('User1', mockState);

      expect(mockBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'user1',
          quest_id: 1,
          is_completed: true,
          progress: 1000,
        }),
        expect.anything()
      );
    });
  });

  describe('Games Service - Extended', () => {
    it('getLeaderboardScores should fetch scores', async () => {
      const mockResponse = { data: [{ id: 1, score: 100 }], error: null };
      mockBuilder.then.mockImplementation(resolve => resolve(mockResponse));

      const scores = await getLeaderboardScores('all');
      expect(mockBuilder.order).toHaveBeenCalledWith('score', { ascending: false });
      expect(scores).toHaveLength(1);
    });

    it('getUserGameHistory should fetch history with normalization', async () => {
      mockBuilder.then.mockImplementation(resolve => resolve({ data: [], error: null }));
      await getUserGameHistory('TestUser');
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'testuser');
    });
  });
});
