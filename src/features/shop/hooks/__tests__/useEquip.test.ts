import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShopItem } from '../../../../utils/shop';
import * as giurosUtils from '../../../../utils/shop/giuros';
import { useEquip } from '../useEquip';
import type { EquippedCosmetics } from '../useShopData';

vi.mock('../../../../utils/shop/giuros');
vi.mock('../../../../hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));
vi.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({
    t: (key: string) => key,
    theme: 'dark',
  }),
}));

const makeItem = (overrides: Partial<ShopItem> = {}): ShopItem => ({
  id: 'avatar_test',
  name: 'Test Avatar',
  cost: 100,
  price: 100,
  type: 'avatar',
  url: '/test.png',
  ...overrides,
});

describe('useEquip', () => {
  const defaultEquipped: EquippedCosmetics = {
    avatarId: undefined,
    frameId: undefined,
    titleId: undefined,
  };

  const defaultProps = {
    username: 'testuser',
    equipped: defaultEquipped,
    setEquipped: vi.fn(),
    purchased: ['avatar_test', 'frame_gold', 'title_hero'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(giurosUtils, 'setEquippedCosmetics').mockResolvedValue(undefined as any);
  });

  it('equips an owned avatar and calls setEquipped with updated cosmetics', async () => {
    const item = makeItem({ id: 'avatar_test', type: 'avatar' });
    const { result } = renderHook(() => useEquip(defaultProps));

    let equip: boolean | undefined;
    await act(async () => {
      equip = await result.current.handleEquip(item);
    });

    expect(equip).toBe(true);
    expect(defaultProps.setEquipped).toHaveBeenCalledWith(
      expect.objectContaining({ avatarId: 'avatar_test' })
    );
    expect(giurosUtils.setEquippedCosmetics).toHaveBeenCalledWith(
      'testuser',
      expect.objectContaining({ avatarId: 'avatar_test' })
    );
  });

  it('equips an owned frame and updates frameId', async () => {
    const item = makeItem({ id: 'frame_gold', type: 'frame' });
    const { result } = renderHook(() => useEquip(defaultProps));

    let equip: boolean | undefined;
    await act(async () => {
      equip = await result.current.handleEquip(item);
    });

    expect(equip).toBe(true);
    expect(defaultProps.setEquipped).toHaveBeenCalledWith(
      expect.objectContaining({ frameId: 'frame_gold' })
    );
  });

  it('equips an owned title and updates titleId', async () => {
    const item = makeItem({ id: 'title_hero', type: 'title' });
    const { result } = renderHook(() => useEquip(defaultProps));

    let equip: boolean | undefined;
    await act(async () => {
      equip = await result.current.handleEquip(item);
    });

    expect(equip).toBe(true);
    expect(defaultProps.setEquipped).toHaveBeenCalledWith(
      expect.objectContaining({ titleId: 'title_hero' })
    );
  });

  it('blocks equipping a paid item not in purchased list and returns false', async () => {
    const item = makeItem({ id: 'avatar_not_owned', type: 'avatar', cost: 200 });
    const propsNotOwned = { ...defaultProps, purchased: [] };
    const { result } = renderHook(() => useEquip(propsNotOwned));

    let equip: boolean | undefined;
    await act(async () => {
      equip = await result.current.handleEquip(item);
    });

    expect(equip).toBe(false);
    expect(defaultProps.setEquipped).not.toHaveBeenCalled();
    expect(giurosUtils.setEquippedCosmetics).not.toHaveBeenCalled();
  });

  it('allows equipping a free item (cost=0) even if not in purchased list', async () => {
    const freeItem = makeItem({ id: 'avatar_default', type: 'avatar', cost: 0 });
    const propsNoPurchases = { ...defaultProps, purchased: [] };
    const { result } = renderHook(() => useEquip(propsNoPurchases));

    let equip: boolean | undefined;
    await act(async () => {
      equip = await result.current.handleEquip(freeItem);
    });

    expect(equip).toBe(true);
    expect(propsNoPurchases.setEquipped).toHaveBeenCalled();
  });

  it('returns false for item type that does not match avatar/frame/title', async () => {
    const unknownItem = makeItem({ id: 'unknown_item', type: 'unknown' as any, cost: 0 });
    const { result } = renderHook(() => useEquip(defaultProps));

    let equip: boolean | undefined;
    await act(async () => {
      equip = await result.current.handleEquip(unknownItem);
    });

    expect(equip).toBe(false);
    expect(defaultProps.setEquipped).not.toHaveBeenCalled();
  });
});
