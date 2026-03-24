import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../../config/constants';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { useNotification } from '../../../hooks/useNotification';
import { UserMigrationService } from '../../../services/userMigration';
import { supabase } from '../../../services/supabase';
import { UserProfile } from '../../../types/user';
import { logger } from '../../../utils/logger';
import { sanitizeInput } from '../../../utils/security';
import { storage } from '../../../utils/storage';
import { linkSupabaseUid, syncUserProfile } from './authSyncHelpers';

import type { Session, User } from '@supabase/supabase-js';

export interface UseAuthResult {
  user: User | null;
  profile: UserProfile | null;
  emailVerified: boolean | null;
  isLoading: boolean;
  handleLogout: (navigate: (path: string) => void) => void;
}

/**
 * Hook for Supabase authentication and user profile management
 */
export const useAuth = (onAnnouncementsCheck?: () => void): UseAuthResult => {
  const [emailVerified, setEmailVerified] = useState<boolean | null>(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { notify } = useNotification();
  const { execute } = useAsyncOperation();

  // Parse referral code from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^[a-zA-Z0-9_]{2,20}$/.test(ref) && !storage.get(STORAGE_KEYS.REFERRER, '')) {
      storage.set(STORAGE_KEYS.REFERRER, ref);
    }
  }, []);

  // Supabase Auth Listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthUser(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
      if (session?.user) {
        handleAuthUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAnnouncementsCheck, notify, execute]);

  const handleAuthUser = async (authUser: User) => {
    setUser(authUser);

    // Skip user profile setup if redirect is being processed
    const isRedirectProcessing = sessionStorage.getItem('girify_processing_redirect');
    if (isRedirectProcessing) {
      console.warn('[useAuth] Skipping profile sync - redirect is being processed');
      setIsLoading(false);
      return;
    }

    // Email verification check
    setEmailVerified(authUser.email_confirmed_at !== null);

    // Determine username
    const existingUsername = storage.get(STORAGE_KEYS.USERNAME, '');

    let displayName = sanitizeInput(
      authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'User'
    ).toLowerCase();

    // Handle format migration
    displayName = await UserMigrationService.migrateToNewFormat(displayName);

    const usernameToUse = existingUsername || displayName;

    // Sync user profile
    await execute(
      async () => {
        const fetchedProfile = await syncUserProfile(
          usernameToUse,
          authUser,
          onAnnouncementsCheck,
          notify
        );
        if (fetchedProfile) {
          setProfile(fetchedProfile);
        }

        // Link supabase_uid for migrated users (after profile exists in DB)
        await linkSupabaseUid(authUser);
      },
      { loadingKey: 'profile-sync', errorMessage: undefined }
    );

    setIsLoading(false);
  };

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(
    (navigate: (path: string) => void) => {
      execute(
        async () => {
          await supabase.auth.signOut();
          storage.remove(STORAGE_KEYS.USERNAME);
          storage.remove('lastPlayedDate');
          setProfile(null);
          navigate('/');
        },
        {
          loadingKey: 'logout',
          successMessage: 'You have been logged out successfully.',
          errorMessage: 'Failed to sign out. Please try again.',
        }
      ).catch((err: Error) => logger.error('Sign out error', err));
    },
    [execute]
  );

  return { user, profile, emailVerified, isLoading, handleLogout };
};

export default useAuth;
