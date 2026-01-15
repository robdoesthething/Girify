import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { useState } from 'react';
import { auth, db, messaging } from '../firebase';

interface MSStreamWindow extends Window {
  MSStream?: unknown;
}

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
  const [isIOS] = useState<boolean>(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as MSStreamWindow).MSStream;
  });

  const [isSupported] = useState<boolean>(() => {
    if (!('Notification' in window)) {
      return false;
    }
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as MSStreamWindow).MSStream;
    return !ios; // Disable if iOS
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
