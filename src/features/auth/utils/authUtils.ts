/**
 * Authentication Utilities
 *
 * Shared validation, generation, and error handling for authentication.
 */

// Constants
export const MAX_USERNAME_LENGTH = 20;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

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
 * Map Supabase Auth error codes/messages to user-friendly messages
 */
export const getAuthErrorMessage = (code: string, message?: string): string => {
  const msg = message?.toLowerCase() ?? '';

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox.';
  }
  if (code === 'user_already_exists' || msg.includes('already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }
  if (code === 'weak_password' || msg.includes('weak password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (code === 'validation_failed' || msg.includes('invalid email')) {
    return 'Invalid email address format.';
  }
  if (code === 'user_banned') {
    return 'This account has been disabled. Please contact support.';
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  return message ? `Authentication failed: ${message}` : 'Authentication failed. Please try again.';
};
