import { Achievement } from '../data/achievements';
import { GameHistory, UserProfile } from '../types/user';
import { ShopItem } from '../utils/shop';

// Profile state types
export interface ProfileState {
  // UI State
  isEditing: boolean;
  showGiurosInfo: boolean;
  selectedAchievement: Achievement | null;

  // Data State
  profileData: UserProfile | null;
  allHistory: GameHistory[];
  friendCount: number;
  giuros: number;
  equippedCosmetics: Record<string, string>;
  joinedDate: string;
  loading: boolean;
  shopAvatars: ShopItem[];
  shopFrames: ShopItem[];
  shopTitles: ShopItem[];
}

// Action types
export type ProfileAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROFILE_DATA'; payload: UserProfile }
  | { type: 'SET_HISTORY'; payload: GameHistory[] }
  | { type: 'SET_FRIEND_COUNT'; payload: number }
  | { type: 'SET_GIUROS'; payload: number }
  | { type: 'SET_EQUIPPED_COSMETICS'; payload: Record<string, string> }
  | { type: 'SET_JOINED_DATE'; payload: string }
  | {
      type: 'SET_SHOP_ITEMS';
      payload: {
        avatars: ShopItem[];
        frames: ShopItem[];
        titles: ShopItem[];
      };
    }
  | { type: 'TOGGLE_EDITING' }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'TOGGLE_GIUROS_INFO' }
  | { type: 'SET_SELECTED_ACHIEVEMENT'; payload: Achievement | null }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | {
      type: 'LOAD_PROFILE_DATA';
      payload: {
        profileData: UserProfile;
        allHistory: GameHistory[];
        friendCount: number;
        giuros: number;
        equippedCosmetics: Record<string, string>;
        joinedDate: string;
        shopAvatars: ShopItem[];
        shopFrames: ShopItem[];
        shopTitles: ShopItem[];
      };
    };

export const initialProfileState: ProfileState = {
  // UI State
  isEditing: false,
  showGiurosInfo: false,
  selectedAchievement: null,

  // Data State
  profileData: null,
  allHistory: [],
  friendCount: 0,
  giuros: 0,
  equippedCosmetics: {},
  joinedDate: '',
  loading: true,
  shopAvatars: [],
  shopFrames: [],
  shopTitles: [],
};

export function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_PROFILE_DATA':
      return {
        ...state,
        profileData: action.payload,
      };

    case 'SET_HISTORY':
      return {
        ...state,
        allHistory: action.payload,
      };

    case 'SET_FRIEND_COUNT':
      return {
        ...state,
        friendCount: action.payload,
      };

    case 'SET_GIUROS':
      return {
        ...state,
        giuros: action.payload,
      };

    case 'SET_EQUIPPED_COSMETICS':
      return {
        ...state,
        equippedCosmetics: action.payload,
      };

    case 'SET_JOINED_DATE':
      return {
        ...state,
        joinedDate: action.payload,
      };

    case 'SET_SHOP_ITEMS':
      return {
        ...state,
        shopAvatars: action.payload.avatars,
        shopFrames: action.payload.frames,
        shopTitles: action.payload.titles,
      };

    case 'TOGGLE_EDITING':
      return {
        ...state,
        isEditing: !state.isEditing,
      };

    case 'SET_EDITING':
      return {
        ...state,
        isEditing: action.payload,
      };

    case 'TOGGLE_GIUROS_INFO':
      return {
        ...state,
        showGiurosInfo: !state.showGiurosInfo,
      };

    case 'SET_SELECTED_ACHIEVEMENT':
      return {
        ...state,
        selectedAchievement: action.payload,
      };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        profileData: state.profileData ? { ...state.profileData, ...action.payload } : null,
      };

    case 'LOAD_PROFILE_DATA':
      return {
        ...state,
        profileData: action.payload.profileData,
        allHistory: action.payload.allHistory,
        friendCount: action.payload.friendCount,
        giuros: action.payload.giuros,
        equippedCosmetics: action.payload.equippedCosmetics,
        joinedDate: action.payload.joinedDate,
        shopAvatars: action.payload.shopAvatars,
        shopFrames: action.payload.shopFrames,
        shopTitles: action.payload.shopTitles,
        loading: false,
      };

    default:
      return state;
  }
}
