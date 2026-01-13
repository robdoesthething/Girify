import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Dispatch, useCallback, useEffect, useState } from 'react';
// @ts-ignore
import { auth } from '../firebase';
// @ts-ignore
import {
  checkUnseenFeedbackRewards,
  ensureUserProfile,
  getUserGameHistory,
  healMigration,
  markFeedbackRewardSeen,
  saveUserGameResult,
  updateUserProfile,
} from '../utils/social';
import { storage } from '../utils/storage';
// @ts-ignore
import { FeedbackReward, GameHistory, UserProfile } from '../types/user';
import { claimDailyLoginBonus } from '../utils/giuros';
import { useAsyncOperation } from './useAsyncOperation';
import { useNotification } from './useNotification';
// @ts-ignore
import { sanitizeInput } from '../utils/security';
// @ts-ignore
import { UserMigrationService } from '../services/userMigration';
// @ts-ignore
import { MIGRATION, STORAGE_KEYS, TIME } from '../config/constants';
// @ts-ignore
import { logger } from '../utils/logger';

export interface UseAuthResult {
  emailVerified: boolean | null;
  isLoading: boolean;
  handleLogout: (navigate: (path: string) => void) => void;
}

/**
 * Hook for Firebase authentication and user profile management
 */
interface AppAction {
  type: string;
  payload?: string | number | boolean;
}

export const useAuth = (
  dispatch: Dispatch<AppAction>,
  currentGameState: string,
  onAnnouncementsCheck?: () => void
): UseAuthResult => {
  const [emailVerified, setEmailVerified] = useState<boolean | null>(true);
  const [isLoading, setIsLoading] = useState(true);
  const { notify } = useNotification();
  const { execute } = useAsyncOperation(); // [NEW] Use async loader

  // Parse referral code from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && !storage.get(STORAGE_KEYS.REFERRER)) {
      storage.set(STORAGE_KEYS.REFERRER, ref);
    }
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      // Logic for initial load isn't easily wrapped in atomic async op because it's an event listener,
      // but we can wrap the syncUserProfile part.
      if (user) {
        // Refresh user data to get latest emailVerified status
        try {
          await user.reload();
          const freshUser = auth.currentUser;
          setEmailVerified(freshUser?.emailVerified ?? false);
        } catch (e) {
          console.warn('[Auth] Failed to reload user:', e);
          setEmailVerified(user.emailVerified);
        }

        let displayName = sanitizeInput(
          user.displayName || user.email?.split('@')[0] || 'User'
        ).toLowerCase();

        // Handle format migration
        displayName = await UserMigrationService.migrateToNewFormat(user, displayName);

        // Ensure Firestore profile and sync data - Wrapped in execute for global loading
        await execute(
          async () => {
            await syncUserProfile(displayName, user, dispatch, onAnnouncementsCheck, notify);
          },
          { loadingKey: 'profile-sync', errorMessage: undefined } // Suppress annoying error on load if passive
        );

        // Update state
        dispatch({ type: 'SET_USERNAME', payload: displayName });
        if (currentGameState === 'register') {
          dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentGameState, dispatch, onAnnouncementsCheck, notify, execute]);

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(
    (navigate: (path: string) => void) => {
      execute(
        async () => {
          await signOut(auth);
          storage.remove(STORAGE_KEYS.USERNAME);
          storage.remove('lastPlayedDate');
          dispatch({ type: 'LOGOUT' });
          navigate('/');
        },
        {
          loadingKey: 'logout',
          successMessage: 'You have been logged out successfully.',
          errorMessage: 'Failed to sign out. Please try again.',
        }
      ).catch((err: Error) => logger.error('Sign out error', err));
    },
    [dispatch, execute] // Removed notify dependency as it's handled by execute
  );

  return { emailVerified, isLoading, handleLogout };
};

/**
 * Sync user profile data with Firestore
 */
async function syncUserProfile(
  displayName: string,
  user: User,
  dispatch: Dispatch<AppAction>,
  onAnnouncementsCheck: (() => void) | undefined,
  notify:
    | ((
        message: string,
        type?: 'success' | 'error' | 'info' | 'warning',
        duration?: number
      ) => void)
    | null
) {
  try {
    const profile = (await ensureUserProfile(displayName, user.uid, {
      email: user.email,
    })) as unknown as UserProfile;

    if (profile) {
      if (profile.realName) {
        dispatch({ type: 'SET_REAL_NAME', payload: profile.realName });
      }
      if (profile.streak) {
        dispatch({ type: 'SET_STREAK', payload: profile.streak });
      }
      dispatch({ type: 'SET_PROFILE_LOADED' });

      // Self-heal any broken migration links
      healMigration(displayName).catch((err: Error) => console.error(err));

      // Claim daily login bonus
      const bonusResult = await claimDailyLoginBonus(displayName);
      if (bonusResult.claimed) {
        // eslint-disable-next-line no-console
        console.log(`[Giuros] Daily login bonus claimed: +${bonusResult.bonus}`);
      }

      // Check for feedback rewards
      const rewards = await checkUnseenFeedbackRewards(displayName);
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
    }
  } catch (e) {
    console.error('[Auth] Profile sync error:', e);
    throw e; // Re-throw to let useAsyncOperation handle the error state if needed
  }
}

/**
 * One-time sync of local game history to Firestore
 */
async function syncLocalHistory(displayName: string) {
  if (storage.get(STORAGE_KEYS.HISTORY_SYNCED)) {
    return;
  }

  try {
    const localHistory = storage.get(STORAGE_KEYS.HISTORY, []);
    if (Array.isArray(localHistory) && localHistory.length > 0) {
      const existing = await getUserGameHistory(displayName);
      if (existing.length === 0) {
        // eslint-disable-next-line no-console
        console.log(`[Migration] Syncing ${localHistory.length} games to Firestore...`);
        const toUpload = localHistory.slice(-MIGRATION.MAX_HISTORY_UPLOAD);
        toUpload.forEach((game: GameHistory) => saveUserGameResult(displayName, game));
      }
    }
    storage.set(STORAGE_KEYS.HISTORY_SYNCED, 'true');
  } catch (e) {
    console.error('History sync failed', e);
  }
}

/**
 * One-time sync of local cosmetics/currency to Firestore
 */
async function syncLocalCosmetics(displayName: string) {
  if (storage.get(STORAGE_KEYS.COSMETICS_SYNCED)) {
    return;
  }

  try {
    const purchased = storage.get(STORAGE_KEYS.PURCHASED);
    const equipped = storage.get(STORAGE_KEYS.EQUIPPED);
    const giuros = storage.get(STORAGE_KEYS.GIUROS);

    if (
      (purchased && purchased.length > 0) ||
      (equipped && Object.keys(equipped).length > 0) ||
      (giuros !== undefined && giuros > 10) // giuros is number from storage.get if stored as number/JSON
    ) {
      // eslint-disable-next-line no-console
      console.log('[Migration] Syncing cosmetics and giuros to Firestore...');
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
    const history = storage.get(STORAGE_KEYS.HISTORY, []);
    if (history.length > 0) {
      const sorted = [...history].sort(
        (a: GameHistory, b: GameHistory) => (a.timestamp || 0) - (b.timestamp || 0)
      );
      if (sorted[0].timestamp) {
        earliestDate = new Date(sorted[0].timestamp);
      }
    }
  } catch (e) {
    console.warn('History parse error', e);
  }

  let profileDate: Date | null = null;
  if (profile && profile.joinedAt) {
    // Handle both Firebase Timestamp and Date objects
    if (profile.joinedAt instanceof Date) {
      profileDate = profile.joinedAt;
    } else if (typeof profile.joinedAt === 'object' && 'toDate' in profile.joinedAt) {
      profileDate = profile.joinedAt.toDate();
    } else if (typeof profile.joinedAt === 'object' && 'seconds' in profile.joinedAt) {
      profileDate = new Date((profile.joinedAt as any).seconds * 1000);
    }
  }

  if (earliestDate && (!profileDate || earliestDate < profileDate)) {
    // eslint-disable-next-line no-console
    console.log('[Migration] Backfilling registry date from history:', earliestDate);
    await updateUserProfile(displayName, { joinedAt: earliestDate });
    storage.set(STORAGE_KEYS.JOINED, earliestDate!.toLocaleDateString());
  }

  if (!storage.get(STORAGE_KEYS.JOINED)) {
    if (profileDate) {
      storage.set(STORAGE_KEYS.JOINED, profileDate.toLocaleDateString());
    } else {
      storage.set(STORAGE_KEYS.JOINED, new Date().toLocaleDateString());
    }
  }
}

export default useAuth;
