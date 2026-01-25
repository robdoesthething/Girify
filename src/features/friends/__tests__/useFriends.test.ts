import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as friendsUtils from '../../../utils/social/friends';
import { useFriends } from '../hooks/useFriends';

// Mock dependencies
vi.mock('../../../utils/social/friends');

describe('useFriends Integration Tests', () => {
  const mockUsername = 'testuser';

  const mockFriends = [
    {
      username: 'friend1',
      avatarId: 1,
      badges: [],
      todayGames: 2,
    },
    {
      username: 'friend2',
      avatarId: 2,
      badges: ['badge1'],
      todayGames: 5,
    },
  ];

  const mockRequests = [
    {
      id: 1,
      from: 'requester1',
      to: 'testuser',
      status: 'pending',
      username: 'requester1',
      avatarId: 3,
      timestamp: { seconds: Date.now() / 1000 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load friends list successfully', async () => {
    vi.spyOn(friendsUtils, 'getFriends').mockResolvedValue(mockFriends);

    const { result } = renderHook(() => useFriends(mockUsername));

    await act(async () => {
      await result.current.loadFriends();
    });

    await waitFor(() => {
      expect(result.current.friends).toEqual(mockFriends);
      expect(result.current.loading).toBe(false);
    });

    expect(friendsUtils.getFriends).toHaveBeenCalledWith(mockUsername);
  });

  it('should load incoming friend requests', async () => {
    vi.spyOn(friendsUtils, 'getIncomingRequests').mockResolvedValue(mockRequests as any);

    const { result } = renderHook(() => useFriends(mockUsername));

    await act(async () => {
      await result.current.loadRequests();
    });

    await waitFor(() => {
      expect(result.current.requests).toEqual(mockRequests);
      expect(result.current.loading).toBe(false);
    });

    expect(friendsUtils.getIncomingRequests).toHaveBeenCalledWith(mockUsername);
  });

  it('should send friend request successfully', async () => {
    const targetUsername = 'newFriend';
    vi.spyOn(friendsUtils, 'sendFriendRequest').mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useFriends(mockUsername));

    let requestResult;
    await act(async () => {
      requestResult = await result.current.sendRequest(targetUsername);
    });

    expect((requestResult as any).success).toBe(true);
    expect(friendsUtils.sendFriendRequest).toHaveBeenCalledWith(mockUsername, targetUsername);
    expect(result.current.successfulRequests.has(targetUsername)).toBe(true);
  });

  it('should handle failed friend request', async () => {
    const targetUsername = 'blockedUser';
    vi.spyOn(friendsUtils, 'sendFriendRequest').mockResolvedValue({
      success: false,
      error: 'User has blocked friend requests',
    });

    const { result } = renderHook(() => useFriends(mockUsername));

    let requestResult;
    await act(async () => {
      requestResult = await result.current.sendRequest(targetUsername);
    });

    expect((requestResult as any).success).toBe(false);
    expect(result.current.successfulRequests.has(targetUsername)).toBe(false);
  });

  it('should accept friend request and update lists', async () => {
    const requesterUsername = 'requester1';
    vi.spyOn(friendsUtils, 'acceptFriendRequest').mockResolvedValue({ success: true });
    vi.spyOn(friendsUtils, 'getFriends').mockResolvedValue(mockFriends);
    vi.spyOn(friendsUtils, 'getIncomingRequests').mockResolvedValue([]);

    const { result } = renderHook(() => useFriends(mockUsername));

    await act(async () => {
      await result.current.acceptRequest(requesterUsername);
    });

    expect(friendsUtils.acceptFriendRequest).toHaveBeenCalledWith(mockUsername, requesterUsername);
    expect(friendsUtils.getIncomingRequests).toHaveBeenCalled();
  });

  it('should decline friend request', async () => {
    const requesterUsername = 'requester1';
    vi.spyOn(friendsUtils, 'declineFriendRequest').mockResolvedValue({ success: true });
    vi.spyOn(friendsUtils, 'getIncomingRequests').mockResolvedValue([]);

    const { result } = renderHook(() => useFriends(mockUsername));

    await act(async () => {
      await result.current.declineRequest(requesterUsername);
    });

    expect(friendsUtils.declineFriendRequest).toHaveBeenCalledWith(mockUsername, requesterUsername);
    expect(friendsUtils.getIncomingRequests).toHaveBeenCalled();
  });

  it('should remove friend successfully', async () => {
    const friendUsername = 'friend1';
    vi.spyOn(friendsUtils, 'removeFriend').mockResolvedValue({ success: true });
    vi.spyOn(friendsUtils, 'getFriends').mockResolvedValue([]);

    const { result } = renderHook(() => useFriends(mockUsername));

    await act(async () => {
      await result.current.removeFriend(friendUsername);
    });

    expect(friendsUtils.removeFriend).toHaveBeenCalledWith(mockUsername, friendUsername);
    expect(friendsUtils.getFriends).toHaveBeenCalled();
  });

  it('should search users and exclude current user', async () => {
    const searchQuery = 'test';
    const searchResults = [
      { username: 'testuser', bestScore: 0 }, // Should be filtered out
      { username: 'testuser2', bestScore: 100 },
      { username: 'tester', bestScore: 200 },
    ];

    vi.spyOn(friendsUtils, 'searchUsers').mockResolvedValue(searchResults as any);

    const { result } = renderHook(() => useFriends(mockUsername));

    await act(async () => {
      await result.current.search(searchQuery);
    });

    await waitFor(() => {
      expect(result.current.searchResults).toHaveLength(2);
      expect(result.current.searchResults).not.toContainEqual(
        expect.objectContaining({ username: 'testuser' })
      );
      expect(result.current.searching).toBe(false);
    });
  });

  it('should handle loading state correctly during async operations', async () => {
    vi.spyOn(friendsUtils, 'getFriends').mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockFriends), 100))
    );

    const { result } = renderHook(() => useFriends(mockUsername));

    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.loadFriends();
    });

    // Should be loading immediately after call
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Should finish loading after promise resolves
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 200 }
    );
  });
});
