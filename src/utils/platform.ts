/**
 * Platform detection utilities
 * Centralizes browser/device detection to avoid duplication
 */

interface MSStreamWindow extends Window {
  MSStream?: unknown;
}

/**
 * Check if the current device is an iOS device (iPhone, iPad, iPod)
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as MSStreamWindow).MSStream;
};

/**
 * Check if the current browser is Mobile Safari
 * Used for auth redirect handling since Safari blocks popups
 */
export const isMobileSafari = (): boolean => {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    /Safari/.test(navigator.userAgent) &&
    !/CriOS|FxiOS/.test(navigator.userAgent)
  );
};

/**
 * Check if the current device is a mobile device
 */
export const isMobile = (): boolean => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

/**
 * Get the current platform type
 */
export const getPlatform = (): 'mobile' | 'desktop' => {
  return isMobile() ? 'mobile' : 'desktop';
};
