/**
 * Social Module Type Definitions
 *
 * Shared types used across all social utility modules.
 */

import { Timestamp } from 'firebase/firestore';

export interface NotificationSettings {
  dailyReminder: boolean;
  friendActivity: boolean;
  newsUpdates: boolean;
}

export interface UserProfile {
  id?: string;
  username: string;
  uid?: string | null;
  email?: string | null;
  realName?: string;
  avatarId?: number;
  joinedAt?: Timestamp | string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  friendCount?: number;
  banned?: boolean;
  gamesPlayed?: number;
  bestScore?: number;
  totalScore?: number;
  referralCode?: string;
  streak?: number;
  maxStreak?: number;
  lastPlayDate?: string | null;
  giuros?: number;
  purchasedCosmetics?: string[];
  equippedCosmetics?: Record<string, string>;
  equippedBadges?: string[];
  lastLoginDate?: string | null;
  language?: string;
  theme?: 'dark' | 'light' | 'auto';
  notificationSettings?: NotificationSettings;
  migratedTo?: string | null;
  migratedFrom?: string | null;
  referredBy?: string | null;
  district?: string;
  team?: string;
}

export interface FeedbackItem {
  id: string;
  username: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  reward?: number | null;
  createdAt?: Timestamp | string;
  approvedAt?: Timestamp | string;
  rejectedAt?: Timestamp | string;
  notified?: boolean;
}

export interface GameData {
  score: number;
  date?: number | string;
  timestamp?: Timestamp | { seconds: number } | number;
  time?: number;
  [key: string]: unknown;
}

export interface OperationResult {
  success: boolean;
  error?: string;
  username?: string;
  reward?: number;
  count?: number;
}

export interface AdditionalProfileData {
  email?: string;
  realName?: string;
  avatarId?: number;
  language?: string;
  district?: string;
}

export interface GameStatsUpdate {
  streak: number;
  totalScore: number;
  lastPlayDate: string;
  currentScore?: number;
}
