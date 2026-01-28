/**
 * Supabase Database Types
 *
 * Re-exported from auto-generated types.
 * To regenerate: npx supabase gen types typescript --project-id xshzjlxsmhodnhxsajdi > src/types/supabase-generated.ts
 */

// Re-export everything from the generated file
export type { Database, Json } from './supabase-generated';
import type { Database } from './supabase-generated';

// Convenience type aliases matching the old naming convention
type Tables = Database['public']['Tables'];

// User types
export type UserRow = Tables['users']['Row'];
export type UserInsert = Tables['users']['Insert'];
export type UserUpdate = Tables['users']['Update'];

// Badge stats types
export type BadgeStatsRow = Tables['badge_stats']['Row'];
export type BadgeStatsUpdate = Tables['badge_stats']['Update'];

// Friend types
export type FriendRequestRow = Tables['friend_requests']['Row'];
export type FriendshipRow = Tables['friendships']['Row'];

// User games (personal history)
export type UserGameRow = Tables['user_games']['Row'];

// Purchased badges
export type PurchasedBadgeRow = Tables['purchased_badges']['Row'];

// Shop items
export type ShopItemRow = Tables['shop_items']['Row'];

// Achievements
export type AchievementRow = Tables['achievements']['Row'];

// Quests
export type QuestRow = Tables['quests']['Row'];

// Announcements
export type AnnouncementRow = Tables['announcements']['Row'];
export type UserReadAnnouncementRow = Tables['user_read_announcements']['Row'];

// Feedback
export type FeedbackRow = Tables['feedback']['Row'];

// Blocks
export type BlockRow = Tables['blocks']['Row'];

// Referrals
export type ReferralRow = Tables['referrals']['Row'];

// Activity Feed
export type ActivityFeedRow = Tables['activity_feed']['Row'];

// Districts
export type DistrictRow = Tables['districts']['Row'];

// Game Results (leaderboard scores)
export type GameResultRow = Tables['game_results']['Row'];

// Admins
export type AdminRow = Tables['admins']['Row'];

// Quests (QuestRow already defined above)
// export type QuestRow = Tables['quests']['Row'];

// User Quests (Manual definition until codegen update)
export interface UserQuestRow {
  id: number;
  username: string;
  quest_id: number;
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  updated_at: string | null;
}
