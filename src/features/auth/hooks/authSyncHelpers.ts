import { STORAGE_KEYS, TIME } from '../../../config/constants';
import { FeedbackReward, GameHistory, UserProfile } from '../../../types/user';
import { logger } from '../../../utils/logger';
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
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../services/supabase';

/**
 * Link existing user row to Supabase Auth by setting supabase_uid.
 * Matches by email on first login after migration.
 */
export async function linkSupabaseUid(user: User): Promise<void> {
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

/**
 * Sync user profile data with Supabase
 */
export async function syncUserProfile(
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
