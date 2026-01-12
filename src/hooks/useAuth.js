import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { storage } from '../utils/storage';
import {
  ensureUserProfile,
  healMigration,
  updateUserProfile,
  getUserGameHistory,
  saveUserGameResult,
  checkUnseenFeedbackRewards,
  markFeedbackRewardSeen,
} from '../utils/social';
import { claimDailyLoginBonus } from '../utils/giuros';
import { useNotification } from './useNotification';
import { sanitizeInput } from '../utils/security';
import { UserMigrationService } from '../services/userMigration';
import { STORAGE_KEYS, MIGRATION, TIME } from '../config/constants';
import { logger } from '../utils/logger';

/**
 * Hook for Firebase authentication and user profile management
 * @param {Function} dispatch - State dispatch function
 * @param {string} currentGameState - Current game state
 * @param {Function} onAnnouncementsCheck - Callback to check announcements
 * @returns {Object} Auth state and handlers
 */
export const useAuth = (dispatch, currentGameState, onAnnouncementsCheck) => {
  const [emailVerified, setEmailVerified] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { notify } = useNotification();

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
    const unsubscribe = onAuthStateChanged(auth, async user => {
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

        // Ensure Firestore profile and sync data
        await syncUserProfile(displayName, user, dispatch, onAnnouncementsCheck, notify);

        // Update state
        dispatch({ type: 'SET_USERNAME', payload: displayName });
        if (currentGameState === 'register') {
          dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentGameState, dispatch, onAnnouncementsCheck, notify]);

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(
    navigate => {
      signOut(auth)
        .then(() => {
          notify('You have been logged out successfully.', 'success');
        })
        .catch(err => logger.error('Sign out error', err));

      storage.remove(STORAGE_KEYS.USERNAME);
      storage.remove('lastPlayedDate');
      dispatch({ type: 'LOGOUT' });
      navigate('/');
    },
    [dispatch, notify]
  );

  return { emailVerified, isLoading, handleLogout };
};

/**
 * Sync user profile data with Firestore
 */
async function syncUserProfile(displayName, user, dispatch, onAnnouncementsCheck, notify) {
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
      healMigration(displayName).catch(err => console.error(err));

      // Claim daily login bonus
      const bonusResult = await claimDailyLoginBonus(displayName);
      if (bonusResult.claimed) {
        // eslint-disable-next-line no-console
        console.log(`[Giuros] Daily login bonus claimed: +${bonusResult.bonus}`);
      }

      // Check for feedback rewards
      const rewards = await checkUnseenFeedbackRewards(displayName);
      if (rewards && rewards.length > 0) {
        const total = rewards.reduce((acc, r) => acc + (r.reward || 0), 0);
        if (notify) {
          notify(
            `🎉 Your feedback has been approved! +${total} Giuros`,
            'success',
            5 * TIME.ONE_SECOND
          );
        }
        rewards.forEach(r => markFeedbackRewardSeen(r.id));
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
  }
}

/**
 * One-time sync of local game history to Firestore
 */
async function syncLocalHistory(displayName) {
  if (storage.get(STORAGE_KEYS.HISTORY_SYNCED)) return;

  try {
    const localHistory = storage.get(STORAGE_KEYS.HISTORY, []);
    if (Array.isArray(localHistory) && localHistory.length > 0) {
      const existing = await getUserGameHistory(displayName);
      if (existing.length === 0) {
        // eslint-disable-next-line no-console
        console.log(`[Migration] Syncing ${localHistory.length} games to Firestore...`);
        const toUpload = localHistory.slice(-MIGRATION.MAX_HISTORY_UPLOAD);
        toUpload.forEach(game => saveUserGameResult(displayName, game));
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
async function syncLocalCosmetics(displayName) {
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
async function backfillJoinDate(displayName, profile) {
  let earliestDate = null;

  try {
    const history = storage.get(STORAGE_KEYS.HISTORY, []);
    if (history.length > 0) {
      const sorted = [...history].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      if (sorted[0].timestamp) {
        earliestDate = new Date(sorted[0].timestamp);
      }
    }
  } catch (e) {
    console.warn('History parse error', e);
  }

  let profileDate = null;
  if (profile && profile.joinedAt) {
    profileDate = profile.joinedAt.toDate
      ? profile.joinedAt.toDate()
      : new Date(profile.joinedAt.seconds * 1000);
  }

  if (earliestDate && (!profileDate || earliestDate < profileDate)) {
    // eslint-disable-next-line no-console
    console.log('[Migration] Backfilling registry date from history:', earliestDate);
    await updateUserProfile(displayName, { joinedAt: earliestDate });
    storage.set(STORAGE_KEYS.JOINED, earliestDate.toLocaleDateString());
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
