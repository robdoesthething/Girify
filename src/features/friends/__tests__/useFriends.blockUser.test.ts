/**
 * Focused tests for blockUser behavior in useFriends.
 * blockUser is not covered in useFriends.test.ts.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as friendsUtils from '../../../utils/social/friends';
import { useFriends } from '../hooks/useFriends';

vi.mock('../../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

vi.mock('../../../utils/social/friends');

describe('useFriends – blockUser', () => {
  const mockUsername = 'testuser';

  beforeEach(() => {
    vi.clearAllMocks();
    // Prevent unhandled errors from background reloads
    vi.spyOn(friendsUtils, 'getFriendFeed').mockResolvedValue([]);
    vi.spyOn(friendsUtils, 'getFriends').mockResolvedValue([]);
  });

  it('calls blockUser util with correct arguments', async () => {
    vi.spyOn(friendsUtils, 'blockUser').mockResolvedValue(undefined);
    vi.spyOn(friendsUtils, 'removeFriend').mockResolvedValue({ success: true });

    const { result } = renderHook(() => useFriends(mockUsername));

    await act(async () => {
      await result.current.blockUser('badactor');
    });

    expect(friendsUtils.blockUser).toHaveBeenCalledWith(mockUsername, 'badactor');
  });

  it('also calls removeFriend after blocking (to remove from friend list)', async () => {
    vi.spyOn(friendsUtils, 'blockUser').mockResolvedValue(undefined);
    vi.spyOn(friendsUtils, 'removeFriend').mockResolvedValue({ success: true });

    const { result } = renderHook(() => useFriends(mockUsername));

    await act(async () => {
      await result.current.blockUser('badactor');
    });

    expect(friendsUtils.removeFriend).toHaveBeenCalledWith(mockUsername, 'badactor');
  });

  it('reloads friends list after blocking', async () => {
    vi.spyOn(friendsUtils, 'blockUser').mockResolvedValue(undefined);
    vi.spyOn(friendsUtils, 'removeFriend').mockResolvedValue({ success: true });
    const getFriendsSpy = vi.spyOn(friendsUtils, 'getFriends').mockResolvedValue([]);

    const { result } = renderHook(() => useFriends(mockUsername));

    await act(async () => {
      await result.current.blockUser('badactor');
    });

    // getFriends is called to refresh the list after blocking
    expect(getFriendsSpy).toHaveBeenCalled();
  });
});
