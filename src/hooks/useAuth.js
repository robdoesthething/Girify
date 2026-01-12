import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import {
  ensureUserProfile,
  migrateUser,
  healMigration,
  updateUserProfile,
  getUserGameHistory,
  saveUserGameResult,
  checkUnseenFeedbackRewards,
  markFeedbackRewardSeen,
} from '../utils/social';
import { claimDailyLoginBonus } from '../utils/giuros';

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

  // Parse referral code from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && !localStorage.getItem('girify_referrer')) {
      localStorage.setItem('girify_referrer', ref);
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

        let displayName = (user.displayName || user.email?.split('@')[0] || 'User').toLowerCase();

        // Handle format migration
        const migrationResult = await handleUserMigration(user, displayName);
        if (migrationResult.migrated) {
          displayName = migrationResult.newHandle;
        }

        // Ensure Firestore profile and sync data
        await syncUserProfile(displayName, user, dispatch, onAnnouncementsCheck);

        // Update local storage and state
        const currentUsername = localStorage.getItem('girify_username');
        if (currentUsername !== displayName) {
          localStorage.setItem('girify_username', displayName);
          dispatch({ type: 'SET_USERNAME', payload: displayName });
          if (currentGameState === 'register') {
            dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentGameState, dispatch, onAnnouncementsCheck]);

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(
    navigate => {
      signOut(auth)
        .then(() => {
          // eslint-disable-next-line no-alert
          alert('You have been logged out successfully. See you soon!');
        })
        .catch(err => console.error('Sign out error', err));

      localStorage.removeItem('girify_username');
      localStorage.removeItem('lastPlayedDate');
      dispatch({ type: 'LOGOUT' });
      navigate('/');
    },
    [dispatch]
  );

  return { emailVerified, isLoading, handleLogout };
};

/**
 * Handle username format migration
 */
async function handleUserMigration(user, displayName) {
  const oldFormatRegex = /.*#\d{4}$/;
  const newFormatRegex = /^@[a-zA-Z0-9]+\d{4}$/;
  const hasExcessiveDigits = /\d{5,}$/.test(displayName);
  const isTooLong = displayName.length > 20;

  let shouldMigrate = false;
  let newHandle = displayName;

  if (oldFormatRegex.test(displayName)) {
    // Convert Name#1234 -> @Name1234
    newHandle = '@' + displayName.replace('#', '');
    shouldMigrate = true;
  } else if (!newFormatRegex.test(displayName) || hasExcessiveDigits || isTooLong) {
    // Generate new handle if invalid format
    const randomId = Math.floor(1000 + Math.random() * 9000);
    let coreName = displayName.replace(/^@/, '').split(/\d/)[0];
    coreName = coreName.replace(/[^a-zA-Z]/g, '').slice(0, 10) || 'User';
    newHandle = `@${coreName}${randomId}`;
    shouldMigrate = true;
  }

  if (shouldMigrate) {
    try {
      // eslint-disable-next-line no-console
      console.log(`[Migration] Update handle: ${displayName} -> ${newHandle}`);
      await updateProfile(user, { displayName: newHandle });
      await migrateUser(displayName, newHandle);
      // eslint-disable-next-line no-console
      console.log('[Migration] Success! New handle:', newHandle);
      return { migrated: true, newHandle };
    } catch (e) {
      console.error('[Migration] Failed to migrate user:', e);
    }
  }

  return { migrated: false, newHandle: displayName };
}

/**
 * Sync user profile data with Firestore
 */
async function syncUserProfile(displayName, user, dispatch, onAnnouncementsCheck) {
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
        // eslint-disable-next-line no-alert
        alert(
          `🎉 Your feedback has been approved!\n\nYou earned ${total} Giuros for helping us improve Girify!`
        );
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
  if (localStorage.getItem('girify_history_synced')) return;

  try {
    const localHistoryStr = localStorage.getItem('girify_history');
    if (localHistoryStr) {
      const localHistory = JSON.parse(localHistoryStr);
      if (Array.isArray(localHistory) && localHistory.length > 0) {
        const existing = await getUserGameHistory(displayName);
        if (existing.length === 0) {
          // eslint-disable-next-line no-console
          console.log(`[Migration] Syncing ${localHistory.length} games to Firestore...`);
          const toUpload = localHistory.slice(-500);
          toUpload.forEach(game => saveUserGameResult(displayName, game));
        }
      }
    }
    localStorage.setItem('girify_history_synced', 'true');
  } catch (e) {
    console.error('History sync failed', e);
  }
}

/**
 * One-time sync of local cosmetics/currency to Firestore
 */
async function syncLocalCosmetics(displayName) {
  if (localStorage.getItem('girify_cosmetics_synced')) return;

  try {
    const purchasedStr = localStorage.getItem('girify_purchased');
    const equippedStr = localStorage.getItem('girify_equipped');
    const giurosStr = localStorage.getItem('girify_giuros');

    if (purchasedStr || equippedStr || giurosStr) {
      const purchased = purchasedStr ? JSON.parse(purchasedStr) : undefined;
      const equipped = equippedStr ? JSON.parse(equippedStr) : undefined;
      const giuros = giurosStr ? parseInt(giurosStr, 10) : undefined;

      if (
        (purchased && purchased.length > 0) ||
        (equipped && Object.keys(equipped).length > 0) ||
        (giuros !== undefined && giuros > 10)
      ) {
        // eslint-disable-next-line no-console
        console.log('[Migration] Syncing cosmetics and giuros to Firestore...');
        await updateUserProfile(displayName, {
          purchasedCosmetics: purchased,
          equippedCosmetics: equipped,
          giuros: giuros,
        });
      }
    }
    localStorage.setItem('girify_cosmetics_synced', 'true');
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
    const history = JSON.parse(localStorage.getItem('girify_history') || '[]');
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
    localStorage.setItem('girify_joined', earliestDate.toLocaleDateString());
  }

  if (!localStorage.getItem('girify_joined')) {
    if (profileDate) {
      localStorage.setItem('girify_joined', profileDate.toLocaleDateString());
    } else {
      localStorage.setItem('girify_joined', new Date().toLocaleDateString());
    }
  }
}

export default useAuth;
