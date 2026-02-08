/**
 * useAuthHandlers Hook
 *
 * Handles all authentication logic for Google and Email auth flows via Supabase Auth.
 */

import { STORAGE_KEYS } from '../../../config/constants';
import { supabase } from '../../../services/supabase';
import { ensureUserProfile, getUserByEmail, getUserByUid } from '../../../utils/social';
import { storage } from '../../../utils/storage';

import {
  generateHandle,
  getAuthErrorMessage,
  getRandomAvatarId,
  validateUsername,
} from '../utils/authUtils';
import type { FormAction, PendingGoogleUser } from './useRegisterForm';

import type { User } from '@supabase/supabase-js';

export interface AuthHandlersConfig {
  dispatch: React.Dispatch<FormAction>;
  onRegister?: (handle: string) => void;
  t: (key: string) => string;
}

export interface AuthHandlersState {
  isSignUp: boolean;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  district: string;
  pendingGoogleUser: PendingGoogleUser | null;
}

export function createAuthHandlers(config: AuthHandlersConfig, state: AuthHandlersState) {
  const { dispatch, onRegister, t } = config;
  const { isSignUp, firstName, lastName, email, password, district, pendingGoogleUser } = state;

  const handlePostLogin = async (handle: string, isExisting: boolean) => {
    console.warn('[AuthDebug] handlePostLogin called for:', handle, 'Existing:', isExisting);
    const referrer = storage.get('girify_referrer', '');
    if (referrer && referrer !== handle && !isExisting) {
      const { recordReferral } = await import('../../../utils/social');
      await recordReferral(referrer, handle);
      storage.remove('girify_referrer');
    }

    if (!storage.get('girify_joined', null)) {
      storage.set('girify_joined', new Date().toLocaleDateString());
    }
    if (onRegister) {
      onRegister(handle);
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const processGoogleUser = async (user: User) => {
    try {
      let handle = user.user_metadata?.full_name || user.user_metadata?.name || '';
      let avatarId = getRandomAvatarId();
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User';

      let existingProfile = (await getUserByUid(user.id)) as any;

      if (!existingProfile) {
        existingProfile = (await getUserByEmail(user.email || '')) as any;
      }

      if (existingProfile) {
        handle = existingProfile.username;
        if (!handle.startsWith('@')) {
          handle = `@${handle}`;
        }
        avatarId = existingProfile.avatarId || avatarId;
      } else {
        handle = generateHandle(fullName);
        if (!handle.startsWith('@')) {
          handle = `@${handle}`;
        }
        // Update user metadata with handle
        await supabase.auth.updateUser({ data: { display_name: handle } });
      }

      if (!existingProfile?.district) {
        dispatch({
          type: 'SET_PENDING_GOOGLE_USER',
          payload: { user, handle, fullName, avatarId, email: user.email || null },
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      await ensureUserProfile(handle, user.id, {
        realName: fullName,
        avatarId,
        email: user.email || undefined,
        district: existingProfile.district,
      });

      await handlePostLogin(handle, true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[Auth] Login processing failed:', error.message);
      dispatch({ type: 'SET_ERROR', payload: 'Login processing failed. Please try again.' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'RESET_ERROR' });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      // The page will redirect to Google, then back to the app.
      // onAuthStateChange in useAuth will pick up the session.
      // processGoogleUser will be called via useAuthRedirect.
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      dispatch({
        type: 'SET_ERROR',
        payload: getAuthErrorMessage(error.code || 'auth/error', error.message),
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const completeGoogleSignup = async () => {
    if (!pendingGoogleUser || !district) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await ensureUserProfile(pendingGoogleUser.handle, pendingGoogleUser.user.id, {
        realName: pendingGoogleUser.fullName,
        avatarId: pendingGoogleUser.avatarId,
        email: pendingGoogleUser.email || undefined,
        district,
      });

      await handlePostLogin(pendingGoogleUser.handle, false);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      dispatch({ type: 'SET_ERROR', payload: getAuthErrorMessage('auth/error', error.message) });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      dispatch({ type: 'SET_ERROR', payload: t('enterEmailAndPassword') });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'RESET_ERROR' });

      if (isSignUp) {
        if (!firstName || !lastName || !district) {
          dispatch({
            type: 'SET_ERROR',
            payload: t('fillAllFields') || 'Please enter all fields including district',
          });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        const validation = validateUsername(firstName, t);
        if (!validation.valid) {
          dispatch({ type: 'SET_ERROR', payload: validation.error || 'Invalid username' });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        const handle = generateHandle(firstName);
        const avatarId = getRandomAvatarId();
        const realName = `${firstName} ${lastName}`.trim();

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: handle, full_name: realName },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.user) {
          await ensureUserProfile(handle, data.user.id, {
            realName,
            avatarId,
            email,
            district,
          });

          const referrer = storage.get('girify_referrer', '');
          if (referrer && referrer !== handle) {
            const { recordReferral } = await import('../../../utils/social');
            await recordReferral(referrer, handle);
            storage.remove('girify_referrer');
          }
        }

        // Supabase sends verification email automatically if configured
        await supabase.auth.signOut();
        dispatch({
          type: 'SET_ERROR',
          payload: t('verificationSent') || 'Verification email sent! Please check your inbox.',
        });
        dispatch({ type: 'SET_MODE', payload: false });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Sign in flow
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const user = data.user;
      if (user && !user.email_confirmed_at) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            'Please verify your email address before signing in. Check your inbox for the verification link.',
        });
        await supabase.auth.signOut();
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || '';
      const storedUsername = storage.get(STORAGE_KEYS.USERNAME, '');

      if (!storedUsername && displayName) {
        storage.set(STORAGE_KEYS.USERNAME, displayName);
      }

      let handle = storedUsername || displayName || 'User';
      if (!handle.startsWith('@')) {
        handle = `@${handle}`;
      }

      await handlePostLogin(handle, true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      dispatch({
        type: 'SET_ERROR',
        payload: getAuthErrorMessage((error as any).code || 'auth/error'),
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return {
    handleGoogleLogin,
    handleEmailAuth,
    completeGoogleSignup,
    processGoogleUser,
  };
}
