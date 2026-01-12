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
