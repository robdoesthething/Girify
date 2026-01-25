/**
 * Firebase Admin authentication utilities
 */

import * as admin from 'firebase-admin';
import { BEARER_PREFIX, BEARER_PREFIX_LENGTH } from './constants';
import type { FirebaseUser } from './types';

// Initialize Firebase Admin SDK
let app: admin.app.App;

function getFirebaseAdmin(): admin.app.App {
  if (app) {
    return app;
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return app;
  }

  // Initialize with service account from env var
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('[Auth] FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
  }

  try {
    // Decode base64-encoded service account JSON
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('[Auth] Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('[Auth] Error initializing Firebase Admin:', error);
    throw new Error('[Auth] Failed to initialize Firebase Admin SDK');
  }
}

/**
 * Verify Firebase ID token and return user info
 * @param idToken Firebase ID token from client
 * @returns Verified user information
 * @throws Error if token is invalid
 */

export interface AuthExtractionResult {
  token?: string;
  error?: string;
}

/**
 * Extract Bearer token from authorization header
 * @param authHeader Authorization header value
 * @returns Extracted token or error
 */
export function extractBearerToken(authHeader?: string): AuthExtractionResult {
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return { error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(BEARER_PREFIX_LENGTH);
  if (!token) {
    return { error: 'Empty token' };
  }

  return { token };
}

/**
 * Verify Firebase ID token and return user info
 * @param idToken Firebase ID token from client
 * @returns Verified user information
 * @throws Error if token is invalid
 */
export async function verifyFirebaseToken(idToken: string): Promise<FirebaseUser> {
  try {
    const app = getFirebaseAdmin();
    const decodedToken = await app.auth().verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
    };
  } catch (error) {
    console.error('[Auth] Error verifying Firebase token:', error);
    throw new Error('Invalid or expired authentication token');
  }
}

/**
 * Get Firebase user by UID
 * @param uid User ID
 * @returns User information
 */
export async function getFirebaseUser(uid: string): Promise<FirebaseUser | null> {
  try {
    const app = getFirebaseAdmin();
    const userRecord = await app.auth().getUser(uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    };
  } catch (error) {
    console.error('[Auth] Error fetching Firebase user:', error);
    return null;
  }
}
