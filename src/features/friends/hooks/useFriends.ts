import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  acceptFriendRequest,
  blockUser,
  declineFriendRequest,
  getFriendFeed,
  getFriends,
  getIncomingRequests,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from '../../../utils/social/friends';
import { type FeedItem, type Friend, friendsReducer, initialState } from './friendsReducer';

// Re-export types for consumers
export type { FeedItem, Friend } from './friendsReducer';

export function useFriends(username: string) {
  const [state, dispatch] = useReducer(friendsReducer, initialState);
  const feedOffsetRef = useRef(0);
  const friendsRef = useRef<Friend[]>([]);

  useEffect(() => {
    feedOffsetRef.current = state.feedOffset;
  }, [state.feedOffset]);

  useEffect(() => {
    friendsRef.current = state.friends;
  }, [state.friends]);

  const loadFriends = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      if (!username || username.trim() === '') {
        console.warn('[Friends] Cannot load friends: username is empty');
        dispatch({ type: 'SET_ERROR', payload: 'Please log in to view friends' });
        dispatch({ type: 'SET_FRIENDS', payload: [] });
        return;
      }
      const list = (await getFriends(username)) as Friend[];
      dispatch({ type: 'SET_FRIENDS', payload: list });
    } catch (e) {
      console.error('[Friends] Error loading friends:', e);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load friends. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [username]);

  const loadRequests = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      if (!username || username.trim() === '') {
        console.warn('[Friends] Cannot load requests: username is empty');
        dispatch({ type: 'SET_ERROR', payload: 'Please log in to view friend requests' });
        dispatch({ type: 'SET_REQUESTS', payload: [] });
        return;
      }
      const list = await getIncomingRequests(username);
      dispatch({ type: 'SET_REQUESTS', payload: list });
    } catch (e) {
      console.error('[Friends] Error loading requests:', e);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load friend requests. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [username]);

  const loadFeed = useCallback(
    async (loadMore = false) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      try {
        if (!username || username.trim() === '') {
          console.warn('[Friends] Cannot load feed: username is empty');
          dispatch({ type: 'SET_ERROR', payload: 'Please log in to view activity feed' });
          dispatch({ type: 'SET_FEED', payload: [] });
          return;
        }
        console.warn(`[Friends] Loading feed for ${username}`);
        // Reuse already-loaded friends list to avoid redundant fetch
        const list =
          friendsRef.current.length > 0
            ? friendsRef.current
            : ((await getFriends(username)) as Friend[]);
        console.warn(
          `[Friends] Found ${list.length} friends:`,
          list.map(f => f.username)
        );
        const currentOffset = loadMore ? feedOffsetRef.current : 0;
        const activity = await getFriendFeed(list, 20, currentOffset);
        console.warn(`[Friends] Loaded ${activity.length} feed items`);

        if (loadMore) {
          dispatch({ type: 'APPEND_FEED', payload: activity as unknown as FeedItem[] });
        } else {
          dispatch({ type: 'SET_FEED', payload: activity as unknown as FeedItem[] });
        }
      } catch (e) {
        console.error('[Friends] Error loading feed:', e);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load activity feed. Please try again.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [username]
  );

  const search = useCallback(
    async (query: string) => {
      if (!query) {
        return;
      }
      dispatch({ type: 'SET_SEARCHING', payload: true });
      try {
        const results = await searchUsers(query);
        dispatch({
          type: 'SET_SEARCH_RESULTS',
          payload: results.filter((r: { username: string }) => r.username !== username),
        });
      } catch (e) {
        console.error(e);
      } finally {
        dispatch({ type: 'SET_SEARCHING', payload: false });
      }
    },
    [username]
  );

  const sendRequest = useCallback(
    async (targetUser: string) => {
      try {
        const res = await sendFriendRequest(username, targetUser);
        if (res.success) {
          dispatch({ type: 'ADD_SUCCESSFUL_REQUEST', payload: targetUser });
          // Clear success message after 3 seconds
          setTimeout(() => {
            dispatch({ type: 'REMOVE_SUCCESSFUL_REQUEST', payload: targetUser });
          }, 3000);
          return { success: true };
        }
        return { success: false, error: res.error };
      } catch (e) {
        console.error(e);
        return { success: false, error: 'Unknown error' };
      }
    },
    [username]
  );

  const acceptRequest = useCallback(
    async (requester: string) => {
      dispatch({ type: 'SET_ACCEPTING_REQUEST', payload: requester });
      try {
        const res = await acceptFriendRequest(username, requester);
        if (res.success) {
          loadRequests();
          loadFriends();
          loadFeed();
        }
        return res;
      } finally {
        dispatch({ type: 'SET_ACCEPTING_REQUEST', payload: null });
      }
    },
    [username, loadRequests, loadFriends, loadFeed]
  );

  const declineRequest = useCallback(
    async (requester: string) => {
      dispatch({ type: 'SET_DECLINING_REQUEST', payload: requester });
      try {
        const res = await declineFriendRequest(username, requester);
        if (res.success) {
          loadRequests();
        }
        return res;
      } finally {
        dispatch({ type: 'SET_DECLINING_REQUEST', payload: null });
      }
    },
    [username, loadRequests]
  );

  const removeValue = useCallback(
    async (friendName: string) => {
      const success = await removeFriend(username, friendName);
      if (success) {
        loadFriends();
        loadFeed();
      }
    },
    [username, loadFriends, loadFeed]
  );

  const blockValue = useCallback(
    async (friendName: string) => {
      await blockUser(username, friendName);
      // Assuming void or boolean.
      await removeFriend(username, friendName);
      loadFriends();
      loadFeed();
    },
    [username, loadFriends, loadFeed]
  );

  return {
    ...state,
    loadFriends,
    loadRequests,
    loadFeed,
    search,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend: removeValue,
    blockUser: blockValue,
  };
}
