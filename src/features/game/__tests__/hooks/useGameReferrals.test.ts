import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameReferrals } from '../../hooks/useGameReferrals';

vi.mock('../../../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useGameReferrals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it('should do nothing if no username provided', async () => {
    const { result } = renderHook(() => useGameReferrals());
    await result.current.processReferrals('');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should do nothing if no session', async () => {
    const { supabase } = await import('../../../../services/supabase');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useGameReferrals());
    await result.current.processReferrals('testuser');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should call /api/referral when session exists', async () => {
    const { supabase } = await import('../../../../services/supabase');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    } as any);

    const { result } = renderHook(() => useGameReferrals());
    await result.current.processReferrals('testuser');

    expect(mockFetch).toHaveBeenCalledWith('/api/referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ referredUsername: 'testuser' }),
    });
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('../../../../services/supabase');
    vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGameReferrals());
    // Should not throw
    await result.current.processReferrals('testuser');
  });
});
