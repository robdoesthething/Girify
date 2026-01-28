import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as giurosUtils from '../../../../utils/shop/giuros';
import * as socialUtils from '../../../../utils/social';
import { useGameReferrals } from '../../hooks/useGameReferrals';

// Mock dependencies
vi.mock('../../../../utils/social', () => ({
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
    vi.spyOn(socialUtils, 'getReferrer').mockResolvedValue(null);

    const { result } = renderHook(() => useGameReferrals());
    await result.current.processReferrals('testuser');

    expect(socialUtils.getReferrer).toHaveBeenCalledWith('testuser');
    expect(giurosUtils.awardReferralBonus).not.toHaveBeenCalled();
  });

  it('should award bonus if referrer found', async () => {
    vi.spyOn(socialUtils, 'getReferrer').mockResolvedValue('referrer');
    vi.spyOn(giurosUtils, 'awardReferralBonus').mockResolvedValue({
      success: true,
      newBalance: 100,
    });

    const { result } = renderHook(() => useGameReferrals());
    await result.current.processReferrals('testuser');

    expect(socialUtils.getReferrer).toHaveBeenCalledWith('testuser');
    expect(giurosUtils.awardReferralBonus).toHaveBeenCalledWith('referrer');
  });

  it('should handle errors gracefully', async () => {
    vi.spyOn(socialUtils, 'getReferrer').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGameReferrals());
    // Should not throw
    await result.current.processReferrals('testuser');

    expect(giurosUtils.awardReferralBonus).not.toHaveBeenCalled();
  });
});
