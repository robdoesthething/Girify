/**
 * @deprecated Import UserProfile and NotificationSettings directly from
 * '../../utils/social/types' (or the relevant relative path). This file
 * re-exports them for backward compatibility and also defines the types
 * that live only here (GameHistory, LeaderboardEntry, FeedbackReward).
 */
export type { NotificationSettings, UserProfile } from '../utils/social/types';

export interface GameHistory {
  date: string;
  score: number;
  avgTime: string;
  timestamp: number;
  username: string;
  incomplete?: boolean;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  avgTime: string | number; // sometimes string in display, number in calculation?
  isBonus?: boolean;
  correctAnswers?: number;
  questionCount?: number;
}

export interface FeedbackReward {
  id: string;
  username: string;
  status: string;
  reward?: number;
  message?: string;
  timestamp?: number;
  notified?: boolean;
}
