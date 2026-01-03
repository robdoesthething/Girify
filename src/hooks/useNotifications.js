import { useState } from 'react';
import { messaging, db, auth } from '../firebase';
import { getToken } from 'firebase/messaging'; // Import from SDK
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Hook to manage notification permissions and FCM token retrieval.
 * Handles platform detection (iOS vs others) and saves token to Firestore.
 *
 * @returns {Object} Hook state and methods
 * @property {boolean} isSupported - Whether notifications are supported on this device/browser
 * @property {boolean} isIOS - Whether the current device is iOS (where we disabled notifications)
 * @property {string} permission - Current notification permission status
 * @property {Function} requestPermission - Function to request permission and save token
 */
export const useNotifications = () => {
  const [permission, setPermission] = useState('default');

  // Lazy initialization to avoid effect side-effects
  const [isIOS] = useState(() => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  const [isSupported] = useState(() => {
    if (!('Notification' in window)) return false;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    return !ios; // Disable if iOS
  });

  // Initial check is handled by state initialization
  // We only update permission when user interacts

  /**
   * Request notification permission from the browser.
   * If granted, retrieves the FCM token and saves it to Firestore.
   *
   * @returns {Promise<boolean>} True if permission granted and token saved
   */
  const requestPermission = async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const currentToken = await getToken(messaging, {
          // VAPID key is optional if config is good, but let's try basic get first.
        });

        if (currentToken) {
          await saveToken(currentToken);
          return true;
        }
      }
    } catch (err) {
      console.error('Notification permission error:', err);
    }
    return false;
  };

  /**
   * Save the FCM token to Firestore under the current user's document.
   *
   * @param {string} token - The FCM token to save
   */
  const saveToken = async token => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Platform detection
      const platform = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

      const tokenRef = doc(db, 'users', user.uid, 'fcmTokens', token);
      await setDoc(tokenRef, {
        token: token,
        platform: platform,
        lastUpdated: serverTimestamp(),
        userAgent: navigator.userAgent,
      });

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('Token saved:', token);
      }
    } catch (e) {
      console.error('Error saving token:', e);
    }
  };

  return { isSupported, isIOS, permission, requestPermission };
};
