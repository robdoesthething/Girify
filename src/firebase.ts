/// <reference types='vite/client' />
import { initializeApp } from 'firebase/app';
import { FacebookAuthProvider, getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
// The modular SDK is tree-shakable by default when using these imports.
// We just need to make sure we don't import 'firebase/compat/*' anywhere.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Explicitly set persistence to local to allow session survival across reloads/redirects
import { browserLocalPersistence, setPersistence } from 'firebase/auth';
setPersistence(auth, browserLocalPersistence).catch(e => console.error('Persistence error:', e));
const db = getFirestore(app);

// Lazy-loaded messaging - only initializes when first accessed
// This saves ~100KB from initial bundle
let _messaging: Messaging | null = null;
export const getMessagingLazy = async (): Promise<Messaging> => {
  if (_messaging) {
    return _messaging;
  }
  const { getMessaging } = await import('firebase/messaging');
  _messaging = getMessaging(app);
  return _messaging;
};

// Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
const facebookProvider = new FacebookAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export { appleProvider, auth, db, facebookProvider, googleProvider };
