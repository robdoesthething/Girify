import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  username: string;
  uid: string;
  email?: string;
  realName?: string;
  streak: number;
  totalScore: number;
  lastPlayDate: string;
  joinedAt: Date | Timestamp;
  purchasedCosmetics?: string[];
  equippedCosmetics?: Record<string, string>;
  giuros?: number;
  referrer?: string;
  friends?: string[];
  // Legacy migration fields?
  migrationStatus?: string;
  gamesPlayed?: number;
  bestScore?: number;
  friendCount?: number;
  maxStreak?: number;
  avatarId?: number;
  notificationSettings?: NotificationSettings;
  banned?: boolean;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  friendActivity: boolean;
  newsUpdates: boolean;
}

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
