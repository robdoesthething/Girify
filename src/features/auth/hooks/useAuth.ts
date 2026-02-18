import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS, TIME } from '../../../config/constants';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { useNotification } from '../../../hooks/useNotification';
import { UserMigrationService } from '../../../services/userMigration';
import { supabase } from '../../../services/supabase';
import { FeedbackReward, GameHistory, UserProfile } from '../../../types/user';
import { logger } from '../../../utils/logger';
import { sanitizeInput } from '../../../utils/security';
import {
  checkUnseenFeedbackRewards,
  ensureUserProfile,
  getUserGameHistory,
  getUserProfile,
  healMigration,
  markFeedbackRewardSeen,
  updateUserProfile,
} from '../../../utils/social';
import { storage } from '../../../utils/storage';

import type { Session, User } from '@supabase/supabase-js';

/**
 * Link existing user row to Supabase Auth by setting supabase_uid.
 * Matches by email on first login after migration.
 */
async function linkSupabaseUid(user: User): Promise<void> {
  if (!user.email) {
    return;
  }

  try {
    // Check if already linked
    const { data: existing } = await supabase
      .from('users')
      .select('supabase_uid')
      .eq('email', user.email)
      .single();

    if (existing && !existing.supabase_uid) {
      await supabase.from('users').update({ supabase_uid: user.id }).eq('email', user.email);
      logger.info('[Auth] Linked supabase_uid for', user.email);
    }
  } catch (e) {
    console.warn('[Auth] Failed to link supabase_uid:', e);
  }
}

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

/**
 * Sync user profile data with Supabase
 */
async function syncUserProfile(
  displayName: string,
  user: User,
  onAnnouncementsCheck: (() => void) | undefined,
  notify:
    | ((
        message: string,
        type?: 'success' | 'error' | 'info' | 'warning',
        duration?: number
      ) => void)
    | null
): Promise<UserProfile | null> {
  try {
    // First, get existing profile to preserve district
    const existingProfile = await getUserProfile(displayName);
    const profile = (await ensureUserProfile(displayName, user.id, {
      email: user.email || undefined,
      // Preserve existing district if user already has one
      district: existingProfile?.district,
    })) as unknown as UserProfile;

    if (profile) {
      // Self-heal any broken migration links
      healMigration(displayName).catch((err: Error) => console.error(err));

      // Claim daily login bonus
      const { claimDailyLoginBonus } = await import('../../../utils/shop/giuros');
      const bonusResult = await claimDailyLoginBonus(displayName);
      if (bonusResult.claimed) {
        logger.info(`[Giuros] Daily login bonus claimed: +${bonusResult.bonus}`);
      }

      // Check for feedback rewards
      const rewards = (await checkUnseenFeedbackRewards(displayName)) as FeedbackReward[];
      if (rewards && rewards.length > 0) {
        const total = rewards.reduce((acc: number, r: FeedbackReward) => acc + (r.reward || 0), 0);
        if (notify) {
          notify(
            `🎉 Your feedback has been approved! +${total} Giuros`,
            'success',
            5 * TIME.ONE_SECOND
          );
        }
        rewards.forEach((r: FeedbackReward) => markFeedbackRewardSeen(r.id));
      }

      // Check for announcements
      if (onAnnouncementsCheck) {
        onAnnouncementsCheck();
      }

      // Sync local history (one-time migration)
      await syncLocalHistory(displayName);
      await syncLocalCosmetics(displayName);
      await backfillJoinDate(displayName, profile);

      return profile;
    }
    return null;
  } catch (e) {
    console.error('[Auth] Profile sync error:', e);
    throw e;
  }
}

/**
 * One-time sync of local game history
 */
async function syncLocalHistory(displayName: string) {
  if (storage.get(STORAGE_KEYS.HISTORY_SYNCED, false)) {
    return;
  }

  try {
    const localHistory = storage.get(STORAGE_KEYS.HISTORY, []);
    if (Array.isArray(localHistory) && localHistory.length > 0) {
      const existing = await getUserGameHistory(displayName);
      if (existing.length === 0) {
        logger.info(
          `[Migration] Legacy history sync skipped - games now saved directly to game_results table`
        );
      }
    }
    storage.set(STORAGE_KEYS.HISTORY_SYNCED, 'true');
  } catch (e) {
    console.error('History sync failed', e);
  }
}

/**
 * One-time sync of local cosmetics/currency
 */
async function syncLocalCosmetics(displayName: string) {
  if (storage.get(STORAGE_KEYS.COSMETICS_SYNCED, false)) {
    return;
  }

  try {
    const purchased = storage.get<string[]>(STORAGE_KEYS.PURCHASED, []);
    const equipped = storage.get<Record<string, string>>(STORAGE_KEYS.EQUIPPED, {});
    const giuros = storage.get<number>(STORAGE_KEYS.GIUROS, 0);

    if (
      (purchased && purchased.length > 0) ||
      (equipped && Object.keys(equipped).length > 0) ||
      (giuros !== undefined && giuros > 10)
    ) {
      logger.info('[Migration] Syncing cosmetics and giuros...');
      await updateUserProfile(displayName, {
        purchasedCosmetics: purchased,
        equippedCosmetics: equipped,
        giuros: giuros,
      });
    }
    storage.set(STORAGE_KEYS.COSMETICS_SYNCED, 'true');
  } catch (e) {
    console.error('[Migration] Failed to sync cosmetics:', e);
  }
}

/**
 * Backfill join date from local history if older
 */
async function backfillJoinDate(displayName: string, profile: UserProfile | null) {
  let earliestDate: Date | null = null;

  try {
    const history = storage.get<GameHistory[]>(STORAGE_KEYS.HISTORY, []);
    if (history.length > 0) {
      const sorted = [...history].sort(
        (a: GameHistory, b: GameHistory) => (a.timestamp || 0) - (b.timestamp || 0)
      );
      if (sorted[0]?.timestamp) {
        earliestDate = new Date(sorted[0].timestamp);
      }
    }
  } catch (e) {
    console.warn('History parse error', e);
  }

  let profileDate: Date | null = null;
  if (profile && profile.joinedAt) {
    if (profile.joinedAt instanceof Date) {
      profileDate = profile.joinedAt;
    } else if (typeof profile.joinedAt === 'string') {
      profileDate = new Date(profile.joinedAt);
    } else if (typeof profile.joinedAt === 'object' && 'seconds' in profile.joinedAt) {
      profileDate = new Date((profile.joinedAt as { seconds: number }).seconds * 1000);
    }
  }

  if (earliestDate && (!profileDate || earliestDate < profileDate)) {
    logger.info('[Migration] Backfilling registry date from history:', earliestDate);
    await updateUserProfile(displayName, { joinedAt: earliestDate } as any);
    storage.set(STORAGE_KEYS.JOINED, earliestDate!.toLocaleDateString());
  }

  if (!storage.get(STORAGE_KEYS.JOINED, '')) {
    if (profileDate) {
      storage.set(STORAGE_KEYS.JOINED, profileDate.toLocaleDateString());
    } else {
      storage.set(STORAGE_KEYS.JOINED, new Date().toLocaleDateString());
    }
  }
}

export default useAuth;
