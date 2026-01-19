import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLeaderboard } from '../leaderboard';

// Mock Supabase using vi.hoisted to ensure accessibility in vi.mock
const { mockSupabase, mockQueryBuilder } = vi.hoisted(() => {
  const qb: any = {
    select: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    gte: vi.fn(),
    then: vi.fn(),
  };
  // Chain setup
  qb.select.mockReturnValue(qb);
  qb.order.mockReturnValue(qb);
  qb.limit.mockReturnValue(qb);
  qb.gte.mockReturnValue(qb);

  const sb = {
    from: vi.fn(() => qb),
  };
  return { mockSupabase: sb, mockQueryBuilder: qb };
});

vi.mock('../../services/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock Firestore (still imported by leaderboard.ts, even if unused in simple getLeaderboard)
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: { now: () => ({ seconds: 12345 }) },
}));

vi.mock('../social', () => ({
  updateUserGameStats: vi.fn(),
}));

vi.mock('../../firebase', () => ({
  db: {},
}));

vi.mock('../dailyChallenge', () => ({
  getTodaySeed: () => 20240101,
}));

describe('Leaderboard Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset call chain
    mockSupabase.from.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.gte.mockReturnValue(mockQueryBuilder);
  });

  describe('getLeaderboard', () => {
    it('should fetch from Supabase and transform scores', async () => {
      const mockData = [
        {
          id: '1',
          user_id: 'User1',
          score: 1800,
          time_taken: 8.0,
          played_at: '2024-01-01T10:00:00Z',
          platform: 'web',
        },
        {
          id: '2',
          user_id: 'User1',
          score: 1700,
          time_taken: 9.0,
          played_at: '2024-01-01T09:00:00Z',
          platform: 'web',
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve: any, _reject: any) => {
        resolve({ data: mockData, error: null });
      });

      const result = await getLeaderboard('all');

      expect(mockSupabase.from).toHaveBeenCalledWith('game_results');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');

      // Deduplication logic: Both scores are same day, should take best (1800)
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(1800);
      expect(result[0].username).toBe('@User1');
    });

    it('should handle Supabase errors gracefully', async () => {
      // Mock error response
      mockQueryBuilder.then.mockImplementation((resolve: any, _reject: any) => {
        resolve({ data: null, error: { message: 'Connection failed' } });
      });

      const result = await getLeaderboard('all');
      expect(result).toEqual([]);
    });

    it('should filter by date for daily period', async () => {
      mockQueryBuilder.then.mockImplementation((resolve: any) =>
        resolve({ data: [], error: null })
      );

      await getLeaderboard('daily');

      // Check if .gte was called (filtering by played_at)
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('played_at', expect.any(String));
    });
  });
});
