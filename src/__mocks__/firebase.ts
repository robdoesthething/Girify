/**
 * Firebase mock for testing environments
 * Used when VITE_FIREBASE_API_KEY is not available (e.g., CI)
 */
import { vi } from 'vitest';

// Mock Firebase Auth
export const auth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(callback => {
    callback(null);
    return vi.fn(); // unsubscribe
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
};

// Mock Firebase App
export const app = {
  name: '[DEFAULT]',
  options: {},
};

// Mock Firestore
export const db = {
  collection: vi.fn(),
  doc: vi.fn(),
};

// Mock Storage
export const storage = {};

// Mock providers
export const googleProvider = {};
export const facebookProvider = {};
export const appleProvider = {};

// Lazy messaging getter (always returns mock)
export const getMessagingLazy = vi.fn().mockResolvedValue({
  getToken: vi.fn().mockResolvedValue('mock-token'),
});

export default app;
