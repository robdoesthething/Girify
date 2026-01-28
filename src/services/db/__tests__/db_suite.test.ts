import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../supabase';
import { createFriendRequest } from '../friends';
import { getLeaderboardScores, getUserGameHistory, insertGameResult } from '../games';
import { checkAndProgressQuests, getDailyQuests } from '../quests';
import { getShopItems } from '../shop';
import { getUserByUsername, updateUser } from '../users';

// 1. Create a chainable builder using vi.hoisted so it's available in vi.mock
const { mockBuilder } = vi.hoisted(() => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn(resolve => resolve({ data: [], error: null })),
  };
  return { mockBuilder: builder };
});

// 2. Mock the supabase module
vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn(() => mockBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

describe('Database Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish defaults in case tests overrode them
    mockBuilder.then.mockImplementation((resolve: any) => resolve({ data: [], error: null }));

    // Explicitly ensure 'this' returns the builder for all methods
    // (mockReturnThis() typically persists, but good to be safe)
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Users Service', () => {
    it('getUserByUsername should fetch user with normalized username', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      mockBuilder.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: mockUser, error: null })
      );

      const result = await getUserByUsername('@TestUser');

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockBuilder.eq).toHaveBeenCalledWith('username', 'testuser');
      expect(result).toEqual(mockUser);
    });

    it('updateUser should return true on success', async () => {
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve({ error: null }));
      const result = await updateUser('TestUser', { real_name: 'New Name' });
      expect(result).toBe(true);
    });
  });

  describe('Friends Service', () => {
    it('createFriendRequest should return true on success', async () => {
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve({ error: null }));
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
      mockBuilder.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: mockItems, error: null })
      );

      const result = await getShopItems();
      expect(mockBuilder.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockItems);
    });
  });

  describe('Games Service', () => {
    it('insertGameResult should success', async () => {
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve({ error: null }));
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
      // 1. Fetch active quests
      const mockQuests = [{ id: 1, title: 'Quest 1' }];
      // 2. Fetch user progress
      const mockProgress = [{ quest_id: 1, progress: 10, is_claimed: false }];

      mockBuilder.then
        .mockImplementationOnce((resolve: any) => resolve({ data: mockQuests, error: null }))
        .mockImplementationOnce((resolve: any) => resolve({ data: mockProgress, error: null }));

      const result = await getDailyQuests('User1');
      expect(result.length).toBe(1);
      expect(result[0]?.progress?.progress).toBe(10);
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

      // checkAndProgressQuests calls:
      // 1. getDailyQuests (2 queries)
      mockBuilder.then
        .mockImplementationOnce((resolve: any) => resolve({ data: mockQuests, error: null })) // get quests
        .mockImplementationOnce((resolve: any) => resolve({ data: [], error: null })); // get progress (empty)

      // 2. upsert progress
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve({ error: null }));

      await checkAndProgressQuests('User1', mockState);

      expect(mockBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'user1',
          quest_id: 1,
          is_completed: true,
          progress: 1000, // capped at criteria value
        }),
        expect.anything()
      );
    });
  });

  describe('Games Service - Extended', () => {
    it('getLeaderboardScores should fetch scores', async () => {
      const mockResponse = { data: [{ id: 1, score: 100 }], error: null };
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve(mockResponse));

      const scores = await getLeaderboardScores('all');
      expect(mockBuilder.order).toHaveBeenCalledWith('score', { ascending: false });
      expect(scores).toHaveLength(1);
    });

    it('getUserGameHistory should fetch history with normalization', async () => {
      mockBuilder.then.mockImplementationOnce((resolve: any) => resolve({ data: [], error: null }));
      await getUserGameHistory('TestUser');
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'testuser');
    });
  });
});
