/**
 * Button Classes Utility
 *
 * Centralized logic for generating button class names based on state and theme.
 * Reduces duplication in ShopScreen, SettingsScreen, and other components.
 */

import { themeClasses } from './themeUtils';

/**
 * Get classes for tab navigation buttons
 */
export const getTabButtonClass = (
  theme: 'light' | 'dark',
  isActive: boolean,
  activeClass: string = 'bg-sky-500 text-white shadow-lg'
): string => {
  if (isActive) {
    return activeClass;
  }
  return themeClasses(
    theme,
    'bg-slate-800 text-slate-300 hover:bg-slate-700',
    'bg-slate-100 text-slate-600 hover:bg-slate-200'
  );
};

/**
 * Get classes for item/grid cards (like in Shop)
 */
export const getItemCardClass = (theme: 'light' | 'dark', isActive: boolean): string => {
  if (isActive) {
    return 'border-4 border-sky-500 bg-sky-500/10 shadow-sky-500/20 shadow-xl';
  }
  return themeClasses(
    theme,
    'border-4 border-slate-700 bg-slate-800',
    'border-4 border-slate-200 bg-white/50 backdrop-blur-sm shadow-lg'
  );
};

/**
 * Get classes for action/equip buttons
 */
export const getActionButtonClass = (
  theme: 'light' | 'dark',
  isActive: boolean,
  activeClass: string = 'bg-sky-500 text-white'
): string => {
  if (isActive) {
    return activeClass;
  }
  return themeClasses(theme, 'bg-slate-700 hover:bg-slate-600', 'bg-slate-100 hover:bg-slate-200');
};

/**
 * Get classes for simple toggle buttons (like language/theme selectors)
 */
export const getToggleButtonClass = (
  theme: 'light' | 'dark',
  isActive: boolean,
  activeClass: string = 'bg-sky-500 text-white shadow-md'
): string => {
  if (isActive) {
    return activeClass;
  }
  return themeClasses(
    theme,
    'bg-slate-700 hover:bg-slate-600 text-slate-300',
    'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
  );
};
