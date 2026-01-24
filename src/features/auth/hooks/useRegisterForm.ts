/**
 * useRegisterForm Hook
 *
 * Manages form state for the RegisterPanel component.
 */

import type { User } from 'firebase/auth';
import { useEffect, useReducer } from 'react';

// Types
export interface PendingGoogleUser {
  user: User;
  handle: string;
  fullName: string;
  avatarId: number;
  email: string | null;
}

export interface FormState {
  isSignUp: boolean;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  district: string;
  error: string;
  loading: boolean;
  pendingGoogleUser: PendingGoogleUser | null;
}

export type FormAction =
  | { type: 'SET_MODE'; payload: boolean }
  | {
      type: 'SET_FIELD';
      field: 'firstName' | 'lastName' | 'email' | 'password' | 'district';
      value: string;
    }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PENDING_GOOGLE_USER'; payload: PendingGoogleUser | null }
  | { type: 'RESET_ERROR' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, isSignUp: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PENDING_GOOGLE_USER':
      return { ...state, pendingGoogleUser: action.payload };
    case 'RESET_ERROR':
      return { ...state, error: '' };
    default:
      return state;
  }
}

export interface UseRegisterFormOptions {
  initialMode?: 'signin' | 'signup';
}

export function useRegisterForm(options: UseRegisterFormOptions = {}) {
  const { initialMode = 'signin' } = options;

  const [state, dispatch] = useReducer(formReducer, {
    isSignUp: initialMode === 'signup',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    district: '',
    error: '',
    loading: false,
    pendingGoogleUser: null,
  });

  useEffect(() => {
    dispatch({ type: 'SET_MODE', payload: initialMode === 'signup' });
  }, [initialMode]);

  return { state, dispatch };
}

export default useRegisterForm;
