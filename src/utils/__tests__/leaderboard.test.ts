import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLeaderboard } from '../social/leaderboard';

// getLeaderboard aggregates server-side via the get_leaderboard RPC
const { mockSupabase } = vi.hoisted(() => {
  const sb = {
    rpc: vi.fn(),
    from: vi.fn(),
  };
  return { mockSupabase: sb };
});

vi.mock('../../services/supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('../social', () => ({
  updateUserGameStats: vi.fn(),
}));

vi.mock('../dailyChallenge', () => ({
  getTodaySeed: () => 20240101,
}));

describe('Leaderboard Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeaderboard', () => {
    it('should fetch via the get_leaderboard RPC and transform rows', async () => {
      const mockRows = [
        { username: 'User1', score: 1800, avg_time: 8.0, games_count: 2 },
        { username: '@User2', score: 1700, avg_time: null, games_count: 1 },
      ];
      mockSupabase.rpc.mockResolvedValue({ data: mockRows, error: null });

      const result = await getLeaderboard('all');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_leaderboard', {
        p_period: 'all',
        p_limit: expect.any(Number),
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'User1',
        username: '@User1',
        score: 1800,
        time: 8.0,
        gamesCount: 2,
      });
      // null avg_time falls back to 0; @-prefixed usernames stay as-is
      expect(result[1]!.time).toBe(0);
      expect(result[1]!.username).toBe('@User2');
    });

    it('should handle Supabase errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const result = await getLeaderboard('all');
      expect(result).toEqual([]);
    });

    it('should pass the requested period to the RPC', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      await getLeaderboard('daily');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_leaderboard', {
        p_period: 'daily',
        p_limit: expect.any(Number),
      });
    });
  });
});
