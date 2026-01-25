/**
 * Type definitions for admin API
 */

export interface AdminPromoteRequest {
  adminKey: string;
  username: string;
}

export interface AdminPromoteResponse {
  success: boolean;
  uid?: string;
  error?: string;
}

export interface FirebaseUser {
  uid: string;
  email?: string;
  displayName?: string;
}

export interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}
