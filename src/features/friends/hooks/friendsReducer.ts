import type { FriendRequest, UserSearchResult } from '../../../utils/social/friends';

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

export interface FriendsState {
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

export type FriendsAction =
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

export const initialState: FriendsState = {
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

export function friendsReducer(state: FriendsState, action: FriendsAction): FriendsState {
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
      };
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
