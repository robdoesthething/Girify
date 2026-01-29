import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { useState } from 'react';
import { auth, db, getMessagingLazy } from '../firebase';
import { isIOS as checkIsIOS, getPlatform } from '../utils/platform';

interface UseNotificationsReturn {
  isSupported: boolean;
  isIOS: boolean;
  permission: NotificationPermission | 'default';
  requestPermission: () => Promise<boolean>;
}

/**
 * Hook to manage notification permissions and FCM token retrieval.
 * Handles platform detection (iOS vs others) and saves token to Firestore.
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');

  // Lazy initialization to avoid effect side-effects
  const [isIOS] = useState<boolean>(() => checkIsIOS());

  const [isSupported] = useState<boolean>(() => {
    if (!('Notification' in window)) {
      return false;
    }
    return !checkIsIOS(); // Disable if iOS
  });

  /**
   * Save the FCM token to Firestore under the current user's document.
   */
  const saveToken = async (token: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    try {
      const platform = getPlatform();

      const tokenRef = doc(db, 'users', user.uid, 'fcmTokens', token);
      await setDoc(tokenRef, {
        token: token,
        platform: platform,
        lastUpdated: serverTimestamp(),
        userAgent: navigator.userAgent,
      });

      if (import.meta.env.DEV) {
        console.warn('[Notifications] Token saved:', token);
      }
    } catch (e) {
      console.error('Error saving token:', e);
    }
  };

  /**
   * Request notification permission from the browser.
   * If granted, retrieves the FCM token and saves it to Firestore.
   */
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Lazy-load messaging only when permission is granted
        const messaging = await getMessagingLazy();
        const currentToken = await getToken(messaging, {});

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

  return { isSupported, isIOS, permission, requestPermission };
};
