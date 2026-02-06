/**
 * useAuthHandlers Hook
 *
 * Handles all authentication logic for Google and Email auth flows.
 */

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from 'firebase/auth';
import { STORAGE_KEYS } from '../../../config/constants';
import { auth, googleProvider } from '../../../firebase';
import { ensureUserProfile, getUserByEmail, recordReferral } from '../../../utils/social';
import { storage } from '../../../utils/storage';

import {
  generateHandle,
  getAuthErrorMessage,
  getRandomAvatarId,
  validateUsername,
} from '../utils/authUtils';
import type { FormAction, PendingGoogleUser } from './useRegisterForm';

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
      let handle = user.displayName || '';
      let avatarId = getRandomAvatarId();
      const fullName = user.displayName || user.email?.split('@')[0] || 'User';

      const { getUserByUid } = await import('../../../utils/social');
      let existingProfile = (await getUserByUid(user.uid)) as any;

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
        if (user.displayName !== handle) {
          await updateProfile(user, { displayName: handle });
        }
      }

      if (!existingProfile?.district) {
        dispatch({
          type: 'SET_PENDING_GOOGLE_USER',
          payload: { user, handle, fullName, avatarId, email: user.email || null },
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      await ensureUserProfile(handle, user.uid, {
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

      const result = await signInWithPopup(auth, googleProvider);
      await processGoogleUser(result.user);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      dispatch({
        type: 'SET_ERROR',
        payload: getAuthErrorMessage(firebaseError.code || 'auth/error', firebaseError.message),
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
      await ensureUserProfile(pendingGoogleUser.handle, pendingGoogleUser.user.uid, {
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

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: handle });
        await sendEmailVerification(userCredential.user);

        await ensureUserProfile(handle, userCredential.user.uid, {
          realName,
          avatarId,
          email,
          district,
        });

        const referrer = storage.get('girify_referrer', '');
        if (referrer && referrer !== handle) {
          await recordReferral(referrer, handle);
          storage.remove('girify_referrer');
        }

        await auth.signOut();
        dispatch({
          type: 'SET_ERROR',
          payload: t('verificationSent') || 'Verification email sent! Please check your inbox.',
        });
        dispatch({ type: 'SET_MODE', payload: false });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Sign in flow
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            'Please verify your email address before signing in. Check your inbox for the verification link.',
        });
        await auth.signOut();
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const displayName = userCredential.user.displayName || '';
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
  };
}
