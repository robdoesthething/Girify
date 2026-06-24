import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as giurosUtils from '../../utils/shop/giuros';
import { useUpdateModal } from '../useUpdateModal';

vi.mock('../../utils/shop/giuros');

// Helpers to manage localStorage between tests
const SEEN_KEY_PREFIX = 'girify_update_v0.2_seen_';

describe('useUpdateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('does not show the modal when username is empty', async () => {
    const { result } = renderHook(() => useUpdateModal(''));
    await act(async () => {});

    expect(result.current.showUpdateModal).toBe(false);
    expect(giurosUtils.awardGiuros).not.toHaveBeenCalled();
  });

  it('shows the modal and awards giuros when the seen key is absent', async () => {
    vi.spyOn(giurosUtils, 'awardGiuros').mockResolvedValue({ success: true } as any);

    const { result } = renderHook(() => useUpdateModal('testuser'));

    await act(async () => {
      // Let promise resolve
    });

    expect(giurosUtils.awardGiuros).toHaveBeenCalledWith('testuser', 25);
    expect(result.current.showUpdateModal).toBe(true);
    expect(result.current.giurosAwarded).toBe(25);
  });

  it('does NOT show the modal when the seen key is already set in localStorage', async () => {
    localStorage.setItem(`${SEEN_KEY_PREFIX}testuser`, '1');

    const { result } = renderHook(() => useUpdateModal('testuser'));
    await act(async () => {});

    expect(result.current.showUpdateModal).toBe(false);
    expect(giurosUtils.awardGiuros).not.toHaveBeenCalled();
  });

  it('dismissUpdateModal hides the modal', async () => {
    vi.spyOn(giurosUtils, 'awardGiuros').mockResolvedValue({ success: true } as any);

    const { result } = renderHook(() => useUpdateModal('testuser'));

    await act(async () => {});

    expect(result.current.showUpdateModal).toBe(true);

    act(() => {
      result.current.dismissUpdateModal();
    });

    expect(result.current.showUpdateModal).toBe(false);
  });

  it('dismissUpdateModal sets the seen key in localStorage', async () => {
    vi.spyOn(giurosUtils, 'awardGiuros').mockResolvedValue({ success: true } as any);

    const { result } = renderHook(() => useUpdateModal('testuser'));
    await act(async () => {});

    act(() => {
      result.current.dismissUpdateModal();
    });

    expect(localStorage.getItem(`${SEEN_KEY_PREFIX}testuser`)).toBe('1');
  });

  it('sets giurosAwarded to 0 when awardGiuros fails', async () => {
    vi.spyOn(giurosUtils, 'awardGiuros').mockResolvedValue({ success: false } as any);

    const { result } = renderHook(() => useUpdateModal('testuser'));

    await act(async () => {});

    expect(result.current.giurosAwarded).toBe(0);
    // Modal still shows even if awarding giuros failed
    expect(result.current.showUpdateModal).toBe(true);
  });
});
