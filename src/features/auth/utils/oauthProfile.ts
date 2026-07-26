/**
 * OAuth Profile Resolution
 *
 * Shared post-OAuth profile lookup and handle derivation used by both the
 * hash-redirect flow (useAuthRedirect) and the register panel (useAuthHandlers).
 * Callers keep their site-specific side effects (modals, navigation,
 * sessionStorage, dispatch).
 */

import { getRandomAvatarId } from '../../../config/appConstants';
import { getUserByEmail, getUserByUid } from '../../../utils/social';
import type { UserProfile } from '../../../utils/social/types';
import { generateHandle } from './authUtils';
import { getMetadataFullName } from './displayName';

import type { User } from '@supabase/supabase-js';

export interface ResolvedOAuthProfile {
  /** Existing users-table profile, if one was found by uid or email. */
  existingProfile: UserProfile | null;
  /** The person's real name (never the generated handle). */
  fullName: string;
  /** Preserves the existing profile's avatar, otherwise a random one. */
  avatarId: number;
  /** '@'-prefixed handle for the user. */
  handle: string;
}

export const resolveOAuthProfile = async (user: User): Promise<ResolvedOAuthProfile> => {
  let avatarId = getRandomAvatarId();
  const fullName = getMetadataFullName(user);

  let existingProfile = await getUserByUid(user.id);
  if (!existingProfile) {
    existingProfile = await getUserByEmail(user.email || '');
  }

  let handle: string;
  if (existingProfile) {
    handle = existingProfile.username || fullName;
    avatarId = existingProfile.avatarId || avatarId;
  } else {
    handle = generateHandle(fullName);
  }
  if (!handle.startsWith('@')) {
    handle = `@${handle}`;
  }

  return { existingProfile, fullName, avatarId, handle };
};
