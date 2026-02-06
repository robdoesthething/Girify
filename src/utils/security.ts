/**
 * Security Utilities
 * Handles input sanitization and validation
 */

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize HTML content for safe rendering via dangerouslySetInnerHTML.
 * Escapes all HTML entities, then converts newlines to <br />.
 */
export const sanitizeHtml = (input: string): string => {
  return escapeHtml(input).replace(/\n/g, '<br />');
};

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
  // Remove dangerous URI protocols
  clean = clean
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');
  // Remove event handler attributes (on*=)
  clean = clean.replace(/\bon\w+\s*=/gi, '');
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
