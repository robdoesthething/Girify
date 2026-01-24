/**
 * Authentication Utilities
 *
 * Shared validation, generation, and error handling for authentication.
 */

// Constants
export const MAX_USERNAME_LENGTH = 20;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const DEFAULT_AVATAR_COUNT = 20;

export const BLOCKED_WORDS = [
  'admin',
  'moderator',
  'girify',
  'support',
  'official',
  'fuck',
  'shit',
  'ass',
  'bitch',
  'dick',
  'cock',
  'pussy',
  'nazi',
  'hitler',
  'nigger',
  'faggot',
  'retard',
];

/**
 * Validate username against rules
 */
export const validateUsername = (
  username: string,
  t: (key: string) => string
): { valid: boolean; error: string | null } => {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: t('usernameRequired') };
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: t('usernameTooLong') };
  }
  if (username.length < 3) {
    return { valid: false, error: t('usernameShort') };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: t('usernameInvalid') };
  }

  const lowerName = username.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lowerName.includes(word)) {
      return { valid: false, error: t('usernameNotAllowed') };
    }
  }

  return { valid: true, error: null };
};

/**
 * Generate a unique handle from a base name
 */
export const generateHandle = (baseName: string): string => {
  const cleanName = (baseName.split(' ')[0] || 'User').replace(/[^a-zA-Z0-9]/g, '');
  const randomId = Math.floor(1000 + Math.random() * 9000);
  return `@${cleanName}${randomId}`;
};

/**
 * Get a random avatar ID
 */
export const getRandomAvatarId = (): number => Math.floor(Math.random() * DEFAULT_AVATAR_COUNT) + 1;

/**
 * Map Firebase auth error codes to user-friendly messages
 */
export const getAuthErrorMessage = (code: string, message?: string): string => {
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Multiple sign-in attempts detected. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-blocked':
      return message
        ? `Google sign-in failed: ${message}`
        : 'Popup blocked by browser. Please allow popups and try again.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact support.';
    case 'auth/internal-error':
      return message
        ? `Authentication error: ${message}`
        : 'An internal error occurred. Please try again.';
    default:
      return message
        ? `Authentication failed: ${message}`
        : 'Authentication failed. Please try again.';
  }
};
