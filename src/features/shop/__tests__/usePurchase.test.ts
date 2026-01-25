import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShopItem } from '../../../utils/shop';
import * as giurosUtils from '../../../utils/shop/giuros';
import { usePurchase } from '../hooks/usePurchase';

// Mock dependencies
vi.mock('../../../utils/giuros');
vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  }),
}));
vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    t: (key: string) => key,
    theme: 'dark',
  }),
}));

describe('usePurchase Integration Tests', () => {
  const mockItem: ShopItem = {
    id: 'avatar_test',
    name: 'Test Avatar',
    cost: 100,
    price: 100,
    type: 'avatar',
    url: '/test.png',
  };

  const defaultProps = {
    username: 'testuser',
    balance: 500,
    purchased: [],
    setBalance: vi.fn(),
    setPurchased: vi.fn(),
    userStats: {
      gamesPlayed: 10,
      bestScore: 1000,
      totalScore: 5000,
      streak: 3,
      maxStreak: 5,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully purchase an item with sufficient balance', async () => {
    // Mock successful purchase
    vi.spyOn(giurosUtils, 'spendGiuros').mockResolvedValue({
      success: true,
      newBalance: 400,
    });

    const { result } = renderHook(() => usePurchase(defaultProps));

    let purchaseResult;
    await act(async () => {
      purchaseResult = await result.current.handlePurchase(mockItem);
    });

    expect(purchaseResult).toBe(true);
    expect(giurosUtils.spendGiuros).toHaveBeenCalledWith('testuser', 100, 'avatar_test');
    expect(defaultProps.setBalance).toHaveBeenCalledWith(400);
    expect(defaultProps.setPurchased).toHaveBeenCalled();
  });

  it('should reject purchase when balance is insufficient', async () => {
    const lowBalanceProps = { ...defaultProps, balance: 50 };
    const { result } = renderHook(() => usePurchase(lowBalanceProps));

    let purchaseResult;
    await act(async () => {
      purchaseResult = await result.current.handlePurchase(mockItem);
    });

    expect(purchaseResult).toBe(false);
    expect(giurosUtils.spendGiuros).not.toHaveBeenCalled();
  });

  it('should reject purchase if item already owned', async () => {
    const ownedProps = { ...defaultProps, purchased: ['avatar_test'] };
    const { result } = renderHook(() => usePurchase(ownedProps));

    let purchaseResult;
    await act(async () => {
      purchaseResult = await result.current.handlePurchase(mockItem);
    });

    expect(purchaseResult).toBe(false);
    expect(giurosUtils.spendGiuros).not.toHaveBeenCalled();
  });

  it('should handle purchase failure from backend', async () => {
    vi.spyOn(giurosUtils, 'spendGiuros').mockResolvedValue({
      success: false,
      error: 'Database error',
    });

    const { result } = renderHook(() => usePurchase(defaultProps));

    let purchaseResult;
    await act(async () => {
      purchaseResult = await result.current.handlePurchase(mockItem);
    });

    expect(purchaseResult).toBe(false);
    expect(defaultProps.setBalance).not.toHaveBeenCalled();
  });

  it('should reject locked items based on unlock conditions', async () => {
    const lockedItem: ShopItem = {
      ...mockItem,
      id: 'avatar_special',
      unlockCondition: {
        type: 'bestScore',
        value: 10000,
      },
    };

    const { result } = renderHook(() => usePurchase(defaultProps));

    let purchaseResult;
    await act(async () => {
      purchaseResult = await result.current.handlePurchase(lockedItem);
    });

    expect(purchaseResult).toBe(false);
    expect(giurosUtils.spendGiuros).not.toHaveBeenCalled();
  });
});
