/**
 * Display Name Utilities
 *
 * Shared derivation of display names and handles from Supabase Auth user metadata.
 */

import type { User } from '@supabase/supabase-js';

/**
 * Resolve the best available display name from user metadata.
 * Includes `display_name` — which we set to the user's handle during OAuth
 * onboarding — so this is suitable for handle/identity derivation,
 * not for the person's real name.
 */
export const getMetadataDisplayName = (user: User | null | undefined): string =>
  user?.user_metadata?.display_name ||
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split('@')[0] ||
  'User';

/**
 * Same metadata chain as getMetadataDisplayName, but returns undefined when
 * nothing is set instead of falling back to the email prefix or 'User'.
 */
export const getMetadataDisplayNameOrUndefined = (
  user: User | null | undefined
): string | undefined =>
  user?.user_metadata?.display_name ||
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  undefined;

/**
 * Same chain as getMetadataFullName, but returns undefined when nothing is
 * set instead of falling back to the email prefix or 'User'.
 */
export const getMetadataFullNameOrUndefined = (user: User | null | undefined): string | undefined =>
  user?.user_metadata?.full_name || user?.user_metadata?.name || undefined;

/**
 * Resolve the person's real name from user metadata.
 * Deliberately excludes `display_name` because we store the generated handle
 * (e.g. '@foo1234') there during OAuth onboarding — it is not a real name.
 */
export const getMetadataFullName = (user: User | null | undefined): string =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split('@')[0] ||
  'User';
