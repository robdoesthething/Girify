import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTeamLeaderboard } from '../social/leaderboard';

// getTeamLeaderboard calls supabase.from('users') AND the getLeaderboard RPC.
// We build both mocks with vi.hoisted so factory closures can use them.
const { mockRpc, mockFromUsers, mockFromDistricts } = vi.hoisted(() => {
  const mockRpc = vi.fn();

  // Mock for the from('users').select(...).not(...).returns(...)  chain
  const mockFromUsers = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnValue({
      returns: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  });

  // Alias (same fn, reused for district lookup inside getLeaderboard)
  const mockFromDistricts = mockFromUsers;

  return { mockRpc, mockFromUsers, mockFromDistricts };
});

vi.mock('../../services/supabase', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFromUsers,
  },
}));

vi.mock('../social', () => ({
  updateUserGameStats: vi.fn(),
}));

vi.mock('../dailyChallenge', () => ({
  getTodaySeed: () => 20240101,
}));

describe('Team Leaderboard – getTeamLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset defaults: no users, no individual scores
    mockFromUsers.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnValue({
        returns: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    mockRpc.mockResolvedValue({ data: [], error: null });
  });

  it('calls the get_leaderboard RPC to fetch individual scores', async () => {
    await getTeamLeaderboard('all');

    expect(mockRpc).toHaveBeenCalledWith(
      'get_leaderboard',
      expect.objectContaining({ p_period: 'all' })
    );
  });

  it('forwards the period argument to the underlying getLeaderboard call', async () => {
    await getTeamLeaderboard('monthly');

    expect(mockRpc).toHaveBeenCalledWith(
      'get_leaderboard',
      expect.objectContaining({ p_period: 'monthly' })
    );
  });

  it('returns an array (possibly empty) on success', async () => {
    const result = await getTeamLeaderboard('all');
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns an empty array when the users query returns an error', async () => {
    mockFromUsers.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnValue({
        returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await getTeamLeaderboard('weekly');

    expect(result).toEqual([]);
  });

  it('returns an empty array when individual scores RPC fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC fail' } });

    const result = await getTeamLeaderboard('daily');

    expect(result).toEqual([]);
  });

  it('aggregates scores per team and sorts descending', async () => {
    // Two users in eixample, one in gracia (using actual district id/teamName from DISTRICTS)
    const usersData = [
      { username: 'alice', team: 'eixample', district: 'eixample' },
      { username: 'bob', team: 'eixample', district: 'eixample' },
      { username: 'carol', team: 'gracia', district: 'gracia' },
    ];

    mockFromUsers.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnValue({
        returns: vi.fn().mockResolvedValue({ data: usersData, error: null }),
      }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    // getLeaderboard RPC returns individual scores
    const individualScores = [
      { username: 'alice', score: 1000, avg_time: 5, games_count: 1 },
      { username: 'bob', score: 800, avg_time: 8, games_count: 1 },
      { username: 'carol', score: 1500, avg_time: 4, games_count: 1 },
    ];
    mockRpc.mockResolvedValue({ data: individualScores, error: null });

    const result = await getTeamLeaderboard('all');

    // Should have at most 2 teams (Eixample + Gràcia)
    expect(result.length).toBeGreaterThan(0);
    // Sorted by score descending
    if (result.length >= 2) {
      expect(result[0]!.score).toBeGreaterThanOrEqual(result[1]!.score);
    }
    // Each entry has the TeamScoreEntry shape
    expect(result[0]).toMatchObject({
      id: expect.any(String),
      teamName: expect.any(String),
      score: expect.any(Number),
      memberCount: expect.any(Number),
      avgScore: expect.any(Number),
    });
  });
});
