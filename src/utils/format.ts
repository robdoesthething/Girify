/**
 * Username Format Convention:
 * - Storage/State: WITH @ prefix, lowercase (e.g., "@john1234")
 * - Database: WITHOUT @ prefix, lowercase (e.g., "john1234")
 * - Display: Context-dependent, use displayUsername() for UI
 */

/**
 * Normalizes a username for database operations.
 * Removes @ prefix and converts to lowercase.
 * Use this for ALL database queries and storage operations.
 *
 * @param username The username to normalize (may have @ prefix)
 * @returns normalized username without @ prefix, lowercase
 *
 * @example
 * normalizeUsername('@John1234') // returns 'john1234'
 * normalizeUsername('john1234')  // returns 'john1234'
 */
export const normalizeUsername = (username: string | undefined | null): string => {
  if (!username) {
    return '';
  }
  return username.toLowerCase().trim().replace(/^@/, '');
};

/**
 * Formats a username for storage/state (ensures @ prefix).
 * Use this when storing username in localStorage or React state.
 *
 * @param username The username to format
 * @returns formatted username with @ prefix, lowercase
 *
 * @example
 * formatUsername('john1234')  // returns '@john1234'
 * formatUsername('@John1234') // returns '@john1234'
 */
export const formatUsername = (username: string | undefined | null): string => {
  if (!username) {
    return '@unknown';
  }
  const clean = username.toLowerCase().trim();
  return clean.startsWith('@') ? clean : `@${clean}`;
};

/**
 * Formats a username for display in the UI.
 * Returns username without @ prefix for cleaner display.
 *
 * @param username The username to display
 * @returns display-ready username without @ prefix
 *
 * @example
 * displayUsername('@john1234') // returns 'john1234'
 * displayUsername('john1234')  // returns 'john1234'
 */
export const displayUsername = (username: string | undefined | null): string => {
  if (!username) {
    return 'unknown';
  }
  return username.toLowerCase().trim().replace(/^@/, '');
};

/**
 * Compares two usernames for equality (case-insensitive, ignores @ prefix).
 *
 * @param username1 First username
 * @param username2 Second username
 * @returns true if usernames match
 *
 * @example
 * usernamesMatch('@John1234', 'john1234') // returns true
 */
export const usernamesMatch = (
  username1: string | undefined | null,
  username2: string | undefined | null
): boolean => {
  return normalizeUsername(username1) === normalizeUsername(username2);
};

/**
 * Compact relative time for feed items (seconds-based timestamps).
 * Returns strings like "Just now", "5m ago", "3h ago", "2d ago", or a locale date.
 */
export function formatCompactRelativeTime(seconds: number, t: (key: string) => string): string {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) {
    return t('justNow');
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)}${t('minuteSuffix')}`;
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}${t('hourSuffix')}`;
  }
  if (diff < 604800) {
    return `${Math.floor(diff / 86400)}${t('daySuffix')}`;
  }
  return new Date(seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Day-precision relative date for game history (milliseconds-based timestamps).
 * Returns strings like "Today", "Yesterday", "3 days ago", "2 weeks ago", or a locale date.
 */
export function formatRelativeDate(ms: number, t: (key: string) => string): string {
  const days = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (days === 0) {
    return t('today');
  }
  if (days === 1) {
    return t('yesterday');
  }
  if (days < 7) {
    return `${days} ${t('daysAgo')}`;
  }
  if (days < 30) {
    return `${Math.floor(days / 7)} ${t('weeksAgo')}`;
  }
  return new Date(ms).toLocaleDateString();
}
