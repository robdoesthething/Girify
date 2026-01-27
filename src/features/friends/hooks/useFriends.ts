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
  | { type: 'SET_ERROR'; payload: string | null };

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
    default:
      return state;
  }
}

export function useFriends(username: string) {
  const [state, dispatch] = useReducer(friendsReducer, initialState);
  const feedOffsetRef = useRef(0);

  useEffect(() => {
    feedOffsetRef.current = state.feedOffset;
  }, [state.feedOffset]);

  const loadFriends = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const list = (await getFriends(username)) as Friend[];
      dispatch({ type: 'SET_FRIENDS', payload: list });
    } catch (e) {
      console.error(e);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [username]);

  const loadRequests = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const list = await getIncomingRequests(username);
      dispatch({ type: 'SET_REQUESTS', payload: list });
    } catch (e) {
      console.error(e);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [username]);

  const loadFeed = useCallback(
    async (loadMore = false) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const list = await getFriends(username);
        const currentOffset = loadMore ? feedOffsetRef.current : 0;
        const activity = await getFriendFeed(list, 20, currentOffset);

        if (loadMore) {
          dispatch({ type: 'APPEND_FEED', payload: activity as unknown as FeedItem[] });
        } else {
          dispatch({ type: 'SET_FEED', payload: activity as unknown as FeedItem[] });
        }
      } catch (e) {
        console.error(e);
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
      const res = await acceptFriendRequest(username, requester);
      if (res.success) {
        loadRequests();
        loadFriends();
        loadFeed();
      }
      return res;
    },
    [username, loadRequests, loadFriends, loadFeed]
  );

  const declineRequest = useCallback(
    async (requester: string) => {
      const res = await declineFriendRequest(username, requester);
      if (res.success) {
        loadRequests();
      }
      return res;
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
