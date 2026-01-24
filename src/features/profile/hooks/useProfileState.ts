import { useCallback, useReducer } from 'react';
import { Achievement } from '../../../data/achievements';
import { UserProfile } from '../../../types/user';
import {
  initialProfileState,
  ProfileAction,
  profileReducer,
  ProfileState,
} from '../../../reducers/profileReducer';
import { UseProfileDataResult } from './useProfileData';

export interface UseProfileStateResult {
  state: ProfileState;
  dispatch: React.Dispatch<ProfileAction>;
  actions: {
    setEditing: (value: boolean) => void;
    toggleGiurosInfo: () => void;
    setSelectedAchievement: (achievement: Achievement | null) => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    loadProfileData: (data: UseProfileDataResult) => void;
  };
}

/**
 * Hook for managing profile state with reducer pattern
 */
export const useProfileState = (): UseProfileStateResult => {
  const [state, dispatch] = useReducer(profileReducer, initialProfileState);

  const setEditing = useCallback((value: boolean) => {
    dispatch({ type: 'SET_EDITING', payload: value });
  }, []);

  const toggleGiurosInfo = useCallback(() => {
    dispatch({ type: 'TOGGLE_GIUROS_INFO' });
  }, []);

  const setSelectedAchievement = useCallback((achievement: Achievement | null) => {
    dispatch({ type: 'SET_SELECTED_ACHIEVEMENT', payload: achievement });
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: updates });
  }, []);

  const loadProfileData = useCallback((data: UseProfileDataResult) => {
    if (data.profileData) {
      dispatch({
        type: 'LOAD_PROFILE_DATA',
        payload: {
          profileData: data.profileData,
          allHistory: data.allHistory,
          friendCount: data.friendCount,
          giuros: data.giuros,
          equippedCosmetics: data.equippedCosmetics,
          joinedDate: data.joinedDate,
          shopAvatars: data.shopAvatars,
          shopFrames: data.shopFrames,
          shopTitles: data.shopTitles,
        },
      });
    }
  }, []);

  return {
    state,
    dispatch,
    actions: {
      setEditing,
      toggleGiurosInfo,
      setSelectedAchievement,
      updateProfile,
      loadProfileData,
    },
  };
};
