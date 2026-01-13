/**
 * Security Utilities
 * Handles input sanitization and validation
 */

/**
 * Sanitize user input by stripping HTML tags and dangerous characters
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
/**
 * Sanitize user input by stripping HTML tags and dangerous characters
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove HTML tags
  let clean = input.replace(/<[^>]*>?/gm, '');
  // Remove potential script injection patterns (basic)
  clean = clean.replace(/javascript:/gi, '').replace(/data:/gi, '');
  return clean.trim();
};

/**
 * Validate username format
 * @param {string} username
 * @returns {boolean}
 */
export const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9@_]+$/.test(username);
};
