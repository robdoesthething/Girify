import { useState, useEffect, useCallback, Dispatch } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
// @ts-ignore
import { auth } from '../firebase';
// @ts-ignore
import { storage } from '../utils/storage';
import {
  ensureUserProfile,
  healMigration,
  updateUserProfile,
  getUserGameHistory,
  saveUserGameResult,
  checkUnseenFeedbackRewards,
  markFeedbackRewardSeen,
  // @ts-ignore
} from '../utils/social';
// @ts-ignore
import { claimDailyLoginBonus } from '../utils/giuros';
import { useNotification } from './useNotification';
import { useAsyncOperation } from './useAsyncOperation'; // [NEW] Import loading hook
// @ts-ignore
import { sanitizeInput } from '../utils/security';
// @ts-ignore
import { UserMigrationService } from '../services/userMigration';
// @ts-ignore
import { STORAGE_KEYS, MIGRATION, TIME } from '../config/constants';
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
export const useAuth = (
  dispatch: Dispatch<any>,
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
          { loadingKey: 'profile-sync', errorMessage: null } // Sppress annoying error on load if passive
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
      ).catch((err: any) => logger.error('Sign out error', err));
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
  dispatch: Dispatch<any>,
  onAnnouncementsCheck: (() => void) | undefined,
  notify: any
) {
  try {
    const profile = await ensureUserProfile(displayName, user.uid, { email: user.email });

    if (profile) {
      if (profile.realName) {
        dispatch({ type: 'SET_REAL_NAME', payload: profile.realName });
      }
      if (profile.streak) {
        dispatch({ type: 'SET_STREAK', payload: profile.streak });
      }
      dispatch({ type: 'SET_PROFILE_LOADED' });

      // Self-heal any broken migration links
      healMigration(displayName).catch((err: any) => console.error(err));

      // Claim daily login bonus
      const bonusResult = await claimDailyLoginBonus(displayName);
      if (bonusResult.claimed) {
        // eslint-disable-next-line no-console
        console.log(`[Giuros] Daily login bonus claimed: +${bonusResult.bonus}`);
      }

      // Check for feedback rewards
      const rewards = await checkUnseenFeedbackRewards(displayName);
      if (rewards && rewards.length > 0) {
        const total = rewards.reduce((acc: number, r: any) => acc + (r.reward || 0), 0);
        if (notify) {
          notify(
            `🎉 Your feedback has been approved! +${total} Giuros`,
            'success',
            5 * TIME.ONE_SECOND
          );
        }
        rewards.forEach((r: any) => markFeedbackRewardSeen(r.id));
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
  if (storage.get(STORAGE_KEYS.HISTORY_SYNCED)) return;

  try {
    const localHistory = storage.get(STORAGE_KEYS.HISTORY, []);
    if (Array.isArray(localHistory) && localHistory.length > 0) {
      const existing = await getUserGameHistory(displayName);
      if (existing.length === 0) {
        // eslint-disable-next-line no-console
        console.log(`[Migration] Syncing ${localHistory.length} games to Firestore...`);
        const toUpload = localHistory.slice(-MIGRATION.MAX_HISTORY_UPLOAD);
        toUpload.forEach((game: any) => saveUserGameResult(displayName, game));
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
  if (storage.get(STORAGE_KEYS.COSMETICS_SYNCED)) return;

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
async function backfillJoinDate(displayName: string, profile: any) {
  let earliestDate: Date | null = null;

  try {
    const history = storage.get(STORAGE_KEYS.HISTORY, []);
    if (history.length > 0) {
      const sorted = [...history].sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
      if (sorted[0].timestamp) {
        earliestDate = new Date(sorted[0].timestamp);
      }
    }
  } catch (e) {
    console.warn('History parse error', e);
  }

  let profileDate: Date | null = null;
  if (profile && profile.joinedAt) {
    profileDate = profile.joinedAt.toDate
      ? profile.joinedAt.toDate()
      : new Date(profile.joinedAt.seconds * 1000);
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
