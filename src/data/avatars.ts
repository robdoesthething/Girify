/**
 * Centralized avatar constants and utilities
 */

export const AVATARS = [
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',
  '🐔',
  '🐧',
  '🐦',
  '🦆',
  '🦅',
];

export const DEFAULT_AVATAR = '🐼';

/**
 * Get avatar emoji by avatarId (1-indexed in database)
 * @param avatarId - 1-indexed avatar ID from database
 * @returns Avatar emoji string
 */
export const getAvatar = (avatarId?: number): string => {
  if (!avatarId || avatarId <= 0) {
    return AVATARS[0];
  }
  const index = Math.max(0, Math.min(avatarId - 1, AVATARS.length - 1));
  return AVATARS[index];
};
