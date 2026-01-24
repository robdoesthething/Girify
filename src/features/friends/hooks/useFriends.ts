import { useCallback, useReducer } from 'react';
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
} from '../../../utils/friends';
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
  requests: any[]; // refined type needed
  feed: FeedItem[];
  searchResults: any[];
  searching: boolean;
  loading: boolean;
  successfulRequests: Set<string>;
  error: string | null;
}

type FriendsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FRIENDS'; payload: Friend[] }
  | { type: 'SET_REQUESTS'; payload: any[] }
  | { type: 'SET_FEED'; payload: FeedItem[] }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SET_SEARCH_RESULTS'; payload: any[] }
  | { type: 'ADD_SUCCESSFUL_REQUEST'; payload: string }
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
      return { ...state, feed: action.payload };
    case 'SET_SEARCHING':
      return { ...state, searching: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'ADD_SUCCESSFUL_REQUEST':
      return {
        ...state,
        successfulRequests: new Set(state.successfulRequests).add(action.payload),
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function useFriends(username: string) {
  const [state, dispatch] = useReducer(friendsReducer, initialState);

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

  const loadFeed = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const list = await getFriends(username);
      const activity = await getFriendFeed(list);
      dispatch({ type: 'SET_FEED', payload: activity as unknown as FeedItem[] });
    } catch (e) {
      console.error(e);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [username]);

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
      await acceptFriendRequest(username, requester);
      loadRequests();
    },
    [username, loadRequests]
  );

  const declineRequest = useCallback(
    async (requester: string) => {
      await declineFriendRequest(username, requester);
      loadRequests();
    },
    [username, loadRequests]
  );

  const removeValue = useCallback(
    async (friendName: string) => {
      await removeFriend(username, friendName);
      loadFriends();
      loadFeed(); // Refresh feed as well
    },
    [username, loadFriends, loadFeed]
  );

  const blockValue = useCallback(
    async (friendName: string) => {
      await blockUser(username, friendName);
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
