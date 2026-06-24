/**
 * Focused tests for claimQuestReward.
 * Uses the same vi.doMock / resetModules pattern as db_suite.test.ts to isolate
 * the supabase mock per test.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Quests Service – claimQuestReward', () => {
  let supabaseMock: { rpc: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();

    supabaseMock = {
      rpc: vi.fn(),
    };

    vi.doMock('../../supabase', () => ({
      supabase: supabaseMock,
    }));

    vi.doMock('../../../utils/auth', () => ({
      assertCurrentUser: vi.fn().mockResolvedValue(undefined),
      getCurrentUsername: vi.fn().mockResolvedValue('testuser'),
      requireAuth: vi.fn().mockResolvedValue('test-uid'),
    }));
  });

  it('calls the claim_quest_reward RPC with normalized username and quest id', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: { success: true, reward: 50 },
      error: null,
    });

    const { claimQuestReward } = await import('../quests');
    await claimQuestReward(42, '@TestUser');

    expect(supabaseMock.rpc).toHaveBeenCalledWith('claim_quest_reward', {
      p_username: 'testuser', // normalizeUsername strips '@'
      p_quest_id: 42,
    });
  });

  it('returns success=true and the reward amount on success', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: { success: true, reward: 75 },
      error: null,
    });

    const { claimQuestReward } = await import('../quests');
    const result = await claimQuestReward(1, 'testuser');

    expect(result.success).toBe(true);
    expect(result.reward).toBe(75);
  });

  it('returns success=false when the RPC returns a Supabase error', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });

    const { claimQuestReward } = await import('../quests');
    const result = await claimQuestReward(1, 'testuser');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns success=false when the RPC data reports failure', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: { success: false, error: 'Quest not completed' },
      error: null,
    });

    const { claimQuestReward } = await import('../quests');
    const result = await claimQuestReward(1, 'testuser');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quest not completed');
  });

  it('returns success=false on unexpected exception', async () => {
    supabaseMock.rpc.mockRejectedValue(new Error('network failure'));

    const { claimQuestReward } = await import('../quests');
    const result = await claimQuestReward(1, 'testuser');

    expect(result.success).toBe(false);
  });
});
