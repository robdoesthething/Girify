/**
 * Theme Utilities
 *
 * Centralized theme-aware class name generation.
 * Replaces repeated ternary conditionals for dark/light themes.
 */

export type Theme = 'light' | 'dark';

/**
 * Creates theme-aware class strings.
 *
 * @example
 * // Before (repeated everywhere):
 * className={`p-4 ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
 *
 * // After:
 * className={`p-4 ${themeClasses(theme, 'bg-slate-800 text-white', 'bg-white text-slate-900')}`}
 */
export function themeClasses(theme: Theme, darkClasses: string, lightClasses: string): string {
  return theme === 'dark' ? darkClasses : lightClasses;
}

/**
 * Returns a value based on the current theme.
 * Useful for non-class values like image sources, canvas colors, or inline styles.
 *
 * @example
 * const color = themeValue(theme, '#000', '#fff');
 * const image = themeValue(theme, darkImg, lightImg);
 */
export function themeValue<T>(theme: Theme, darkValue: T, lightValue: T): T {
  return theme === 'dark' ? darkValue : lightValue;
}

/**
 * Common theme class presets for consistent styling.
 */
export const themePresets = {
  /** Card/panel backgrounds */
  card: (theme: Theme) =>
    themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-200'),

  /** Page/container backgrounds */
  container: (theme: Theme) =>
    themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900'),

  /** Text colors */
  text: (theme: Theme) => themeClasses(theme, 'text-white', 'text-slate-900'),

  /** Muted/secondary text */
  textMuted: (theme: Theme) => themeClasses(theme, 'text-slate-400', 'text-slate-500'),

  /** Input fields */
  input: (theme: Theme) =>
    themeClasses(
      theme,
      'bg-slate-800 border-slate-700 text-white placeholder-slate-500',
      'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
    ),

  /** Dividers/borders */
  border: (theme: Theme) => themeClasses(theme, 'border-slate-700', 'border-slate-200'),

  /** Table headers */
  tableHeader: (theme: Theme) => themeClasses(theme, 'bg-slate-800', 'bg-slate-100'),

  /** Hover states for rows */
  hoverRow: (theme: Theme) => themeClasses(theme, 'hover:bg-slate-800/50', 'hover:bg-slate-50'),

  /** Modal/overlay backgrounds */
  modal: (theme: Theme) =>
    themeClasses(theme, 'bg-slate-800 text-white', 'bg-white text-slate-900'),

  /** Subtle backgrounds */
  subtle: (theme: Theme) => themeClasses(theme, 'bg-slate-800/50', 'bg-slate-100'),

  /** Interactive element hover scale */
  hoverScale: 'transition-transform cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
};

/**
 * Utility for conditional class concatenation.
 * Similar to clsx but simpler.
 *
 * @example
 * cn('base-class', isActive && 'active', theme === 'dark' && 'dark-mode')
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default themePresets;
