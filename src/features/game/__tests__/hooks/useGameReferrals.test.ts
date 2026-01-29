import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as giurosUtils from '../../../../utils/shop/giuros';
import * as socialUtils from '../../../../utils/social/referrals';
import { useGameReferrals } from '../../hooks/useGameReferrals';

// Mock dependencies
vi.mock('../../../../utils/social/referrals', () => ({
  getReferrer: vi.fn(),
  updateUserGameStats: vi.fn(),
}));

vi.mock('../../../../utils/shop/giuros', () => ({
  awardReferralBonus: vi.fn(),
}));

vi.mock('../../../../hooks/useNotification', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}));

describe('useGameReferrals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do nothing if no referrer found', async () => {
    vi.mocked(socialUtils.getReferrer).mockResolvedValue(null);

    const { result } = renderHook(() => useGameReferrals());
    await result.current.processReferrals('testuser');

    expect(socialUtils.getReferrer).toHaveBeenCalledWith('testuser');
    expect(giurosUtils.awardReferralBonus).not.toHaveBeenCalled();
  });

  it('should award bonus if referrer found', async () => {
    vi.mocked(socialUtils.getReferrer).mockResolvedValue('referrer');
    vi.mocked(giurosUtils.awardReferralBonus).mockResolvedValue({
      success: true,
      newBalance: 100,
    });

    const { result } = renderHook(() => useGameReferrals());
    await result.current.processReferrals('testuser');

    expect(socialUtils.getReferrer).toHaveBeenCalledWith('testuser');
    expect(giurosUtils.awardReferralBonus).toHaveBeenCalledWith('referrer');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(socialUtils.getReferrer).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGameReferrals());
    // Should not throw
    await result.current.processReferrals('testuser');

    expect(giurosUtils.awardReferralBonus).not.toHaveBeenCalled();
  });
});
