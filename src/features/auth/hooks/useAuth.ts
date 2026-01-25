import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Dispatch, useCallback, useEffect, useState } from 'react';
import { MIGRATION, STORAGE_KEYS, TIME } from '../../../config/constants';
import { auth } from '../../../firebase';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { useNotification } from '../../../hooks/useNotification';
import { UserMigrationService } from '../../../services/userMigration';
import { FeedbackReward, GameHistory, UserProfile } from '../../../types/user';
import { logger } from '../../../utils/logger';
import { sanitizeInput } from '../../../utils/security';
import { claimDailyLoginBonus } from '../../../utils/shop/giuros';
import {
  checkUnseenFeedbackRewards,
  ensureUserProfile,
  getUserGameHistory,
  getUserProfile,
  healMigration,
  markFeedbackRewardSeen,
  saveUserGameResult,
  updateUserProfile,
} from '../../../utils/social';
import { storage } from '../../../utils/storage';

export interface UseAuthResult {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { notify } = useNotification();
  const { execute } = useAsyncOperation(); // [NEW] Use async loader

  // Parse referral code from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && !storage.get(STORAGE_KEYS.REFERRER, '')) {
      storage.set(STORAGE_KEYS.REFERRER, ref);
    }
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      // Logic for initial load isn't easily wrapped in atomic async op because it's an event listener,
      // but we can wrap the syncUserProfile part.
      setUser(user);

      // Skip user profile setup if redirect is being processed (AppRoutes handles this case)
      // This prevents race conditions where useAuth creates a profile with random district
      // before the redirect handler can show the district selection modal
      const isRedirectProcessing = sessionStorage.getItem('girify_processing_redirect');
      if (isRedirectProcessing) {
        console.warn('[useAuth] Skipping profile sync - redirect is being processed');
        setIsLoading(false);
        return;
      }

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

        // CRITICAL: Check for existing username FIRST (set by handleRegister callback during login)
        // Re-check storage in case it was updated by redirect handler
        const existingUsername = storage.get(STORAGE_KEYS.USERNAME, '');

        let displayName = sanitizeInput(
          user.displayName || user.email?.split('@')[0] || 'User'
        ).toLowerCase();

        // Handle format migration
        displayName = await UserMigrationService.migrateToNewFormat(user, displayName);

        // Use stored username if available (from handleRegister), otherwise use derived displayName
        const usernameToUse = existingUsername || displayName;

        // Ensure Firestore profile and sync data - Wrapped in execute for global loading
        await execute(
          async () => {
            await syncUserProfile(usernameToUse, user, dispatch, onAnnouncementsCheck, notify);
          },
          { loadingKey: 'profile-sync', errorMessage: undefined } // Suppress annoying error on load if passive
        );

        // Update React state with the correct username
        dispatch({ type: 'SET_USERNAME', payload: usernameToUse });

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

  return { user, emailVerified, isLoading, handleLogout };
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
    // First, get existing profile to preserve district
    const existingProfile = await getUserProfile(displayName);
    const profile = (await ensureUserProfile(displayName, user.uid, {
      email: user.email || undefined,
      // Preserve existing district if user already has one so we don't overwrite with random
      district: existingProfile?.district,
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
  if (storage.get(STORAGE_KEYS.HISTORY_SYNCED, false)) {
    return;
  }

  try {
    const localHistory = storage.get(STORAGE_KEYS.HISTORY, []);
    if (Array.isArray(localHistory) && localHistory.length > 0) {
      const existing = await getUserGameHistory(displayName);
      if (existing.length === 0) {
        logger.info(`[Migration] Syncing ${localHistory.length} games to Firestore...`);
        const toUpload = localHistory.slice(-MIGRATION.MAX_HISTORY_UPLOAD);
        toUpload.forEach((game: GameHistory) =>
          saveUserGameResult(displayName, {
            ...game,
            date: typeof game.date === 'string' ? new Date(game.date).getTime() : game.date || 0,
            timestamp:
              typeof game.timestamp === 'number'
                ? { seconds: Math.floor(game.timestamp / 1000) }
                : game.timestamp || undefined,
          } as any)
        );
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
      (giuros !== undefined && giuros > 10) // giuros is number from storage.get if stored as number/JSON
    ) {
      logger.info('[Migration] Syncing cosmetics and giuros to Firestore...');
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
    // Handle both Firebase Timestamp and Date objects
    if (profile.joinedAt instanceof Date) {
      profileDate = profile.joinedAt;
    } else if (typeof profile.joinedAt === 'object' && 'toDate' in profile.joinedAt) {
      profileDate = profile.joinedAt.toDate();
    } else if (typeof profile.joinedAt === 'object' && 'seconds' in profile.joinedAt) {
      profileDate = new Date((profile.joinedAt as { seconds: number }).seconds * 1000);
    }
  }

  if (earliestDate && (!profileDate || earliestDate < profileDate)) {
    logger.info('[Migration] Backfilling registry date from history:', earliestDate);
    // Cast to any to bypass strict Timestamp check for now, or convert if possible.
    // Ideally we import Timestamp from firebase/firestore but user helper handles conversion usually.
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
