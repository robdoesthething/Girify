import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  acceptFriendRequest,
  blockUser,
  declineFriendRequest,
  FriendRequest,
  getFriendFeed,
  getFriends,
  getIncomingRequests,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  UserSearchResult,
} from '../../../utils/social/friends';
// import { FeedItem, Friend } from '../types'; // Removed to avoid redeclaration if defining locally

// Define types locally for now or move to types file
export interface Friend {
  username: string;
  avatarId?: number;
  badges?: string[];
  todayGames?: number;
  equippedCosmetics?: {
    avatarId?: string;
    frameId?: string;
    titleId?: string;
  };
}

export interface FeedItem {
  id: string;
  type: string;
  username: string;
  oldUsername?: string;
  badge?: { name: string; emoji: string };
  itemName?: string;
  score?: number;
  timestamp?: { seconds: number };
  avatarId?: number;
}

interface FriendsState {
  friends: Friend[];
  requests: FriendRequest[];
  feed: FeedItem[];
  searchResults: UserSearchResult[];
  searching: boolean;
  loading: boolean;
  successfulRequests: Set<string>;
  error: string | null;
  feedOffset: number;
  hasMoreFeed: boolean;
  acceptingRequest: string | null;
  decliningRequest: string | null;
}

type FriendsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FRIENDS'; payload: Friend[] }
  | { type: 'SET_REQUESTS'; payload: FriendRequest[] }
  | { type: 'SET_FEED'; payload: FeedItem[] }
  | { type: 'APPEND_FEED'; payload: FeedItem[] }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SET_SEARCH_RESULTS'; payload: UserSearchResult[] }
  | { type: 'ADD_SUCCESSFUL_REQUEST'; payload: string }
  | { type: 'REMOVE_SUCCESSFUL_REQUEST'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACCEPTING_REQUEST'; payload: string | null }
  | { type: 'SET_DECLINING_REQUEST'; payload: string | null };

const initialState: FriendsState = {
  friends: [],
  requests: [],
  feed: [],
  searchResults: [],
  searching: false,
  loading: false,
  successfulRequests: new Set(),
  error: null,
  feedOffset: 0,
  hasMoreFeed: true,
  acceptingRequest: null,
  decliningRequest: null,
};

function friendsReducer(state: FriendsState, action: FriendsAction): FriendsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_FRIENDS':
      return { ...state, friends: action.payload };
    case 'SET_REQUESTS':
      return { ...state, requests: action.payload };
    case 'SET_FEED':
      return {
        ...state,
        feed: action.payload,
        feedOffset: action.payload.length,
        hasMoreFeed: action.payload.length >= 20,
      }; // Assuming default limit 50? Wait, I set default 50. Let's assume > 0 checks.
    case 'APPEND_FEED':
      return {
        ...state,
        feed: [...state.feed, ...action.payload],
        feedOffset: state.feedOffset + action.payload.length,
        hasMoreFeed: action.payload.length > 0,
      };
    case 'SET_SEARCHING':
      return { ...state, searching: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'ADD_SUCCESSFUL_REQUEST':
      return {
        ...state,
        successfulRequests: new Set(state.successfulRequests).add(action.payload),
      };
    case 'REMOVE_SUCCESSFUL_REQUEST': {
      const newSet = new Set(state.successfulRequests);
      newSet.delete(action.payload);
      return { ...state, successfulRequests: newSet };
    }
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACCEPTING_REQUEST':
      return { ...state, acceptingRequest: action.payload };
    case 'SET_DECLINING_REQUEST':
      return { ...state, decliningRequest: action.payload };
    default:
      return state;
  }
}

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
