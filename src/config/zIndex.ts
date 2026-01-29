/**
 * Standardized Z-Index Scale
 *
 * Per CODING_STANDARDS.md, use only these z-index values:
 * - z-10: Overlays on content (sticky headers, floating elements)
 * - z-20: Navigation (TopBar, fixed navs)
 * - z-30: Modal backdrops (dimmed backgrounds)
 * - z-40: Modals and dialogs
 * - z-50: Critical alerts, toasts, notifications
 *
 * These correspond to Tailwind's built-in z-10/20/30/40/50 classes.
 */

export const Z_INDEX = {
  // Base layer - sticky elements within content
  OVERLAY: 'z-10',

  // Navigation layer - TopBar, fixed headers
  NAVIGATION: 'z-20',

  // Modal backdrop layer
  BACKDROP: 'z-30',

  // Modal/dialog content layer
  MODAL: 'z-40',

  // Critical notifications, toasts, loading indicators
  CRITICAL: 'z-50',
} as const;

// For inline styles where Tailwind classes can't be used
export const Z_INDEX_VALUES = {
  OVERLAY: 10,
  NAVIGATION: 20,
  BACKDROP: 30,
  MODAL: 40,
  CRITICAL: 50,
} as const;
