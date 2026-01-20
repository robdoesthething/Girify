/**
 * Supabase Database Types
 *
 * These types mirror the Supabase PostgreSQL schema.
 * They are used for type-safe database operations.
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          username: string;
          uid: string | null;
          email: string | null;
          real_name: string | null;
          avatar_id: number;
          joined_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          friend_count: number;
          games_played: number;
          best_score: number;
          total_score: number;
          referral_code: string | null;
          streak: number;
          max_streak: number;
          last_play_date: string | null;
          last_login_date: string | null;
          giuros: number;
          purchased_cosmetics: string[];
          equipped_cosmetics: Record<string, string>;
          equipped_badges: string[];
          language: string;
          theme: string;
          notification_settings: {
            dailyReminder: boolean;
            friendActivity: boolean;
            newsUpdates: boolean;
          };
          migrated_to: string | null;
          migrated_from: string | null;
          referred_by: string | null;
          district: string | null;
          team: string | null;
          banned: boolean;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']> & {
          username: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      badge_stats: {
        Row: {
          username: string;
          games_played: number;
          best_score: number;
          streak: number;
          wrong_streak: number;
          total_pan_km: number;
          consecutive_days: number;
          games_without_quitting: number;
          eixample_corners: number;
          gothic_streak: number;
          born_guesses: number;
          poblenou_guesses: number;
          night_play: boolean;
          ramblas_quick_guess: boolean;
          precision_guess: boolean;
          food_streets_perfect: number;
          fast_loss: boolean;
          speed_mode_high_score: boolean;
          invite_count: number;
          last_play_date: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['badge_stats']['Row']> & {
          username: string;
        };
        Update: Partial<Database['public']['Tables']['badge_stats']['Row']>;
      };
      friendships: {
        Row: {
          id: number;
          user_a: string;
          user_b: string;
          created_at: string;
        };
        Insert: {
          user_a: string;
          user_b: string;
          created_at?: string;
        };
        Update: never;
      };
      friend_requests: {
        Row: {
          id: number;
          from_user: string;
          to_user: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: {
          from_user: string;
          to_user: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'rejected';
        };
      };
      user_games: {
        Row: {
          id: number;
          username: string;
          date: string;
          score: number;
          avg_time: number | null;
          played_at: string;
          incomplete: boolean;
          correct_answers: number | null;
          question_count: number | null;
        };
        Insert: {
          username: string;
          date: string;
          score: number;
          avg_time?: number | null;
          played_at?: string;
          incomplete?: boolean;
          correct_answers?: number | null;
          question_count?: number | null;
        };
        Update: Partial<Database['public']['Tables']['user_games']['Insert']>;
      };
      purchased_badges: {
        Row: {
          id: number;
          username: string;
          badge_id: string;
          purchased_at: string;
        };
        Insert: {
          username: string;
          badge_id: string;
          purchased_at?: string;
        };
        Update: never;
      };
      shop_items: {
        Row: {
          id: string;
          type: 'frame' | 'title' | 'special' | 'avatar' | 'avatars';
          name: string;
          cost: number;
          rarity: string | null;
          color: string | null;
          description: string | null;
          image: string | null;
          emoji: string | null;
          css_class: string | null;
          flavor_text: string | null;
          prefix: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shop_items']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['shop_items']['Insert']>;
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          emoji: string | null;
          criteria: string | null;
          rarity: string | null;
          category: string | null;
          unlock_condition: Record<string, unknown> | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
      };
      quests: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          criteria_type: 'find_street' | 'score_attack' | 'district_explorer' | 'login_streak';
          criteria_value: string | null;
          reward_giuros: number;
          active_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quests']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['quests']['Insert']>;
      };
      announcements: {
        Row: {
          id: number;
          title: string;
          body: string;
          publish_date: string;
          expiry_date: string | null;
          is_active: boolean;
          priority: 'low' | 'normal' | 'high' | 'urgent';
          target_audience: 'all' | 'new_users' | 'returning';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
      user_read_announcements: {
        Row: {
          username: string;
          announcement_id: number;
          read_at: string;
        };
        Insert: {
          username: string;
          announcement_id: number;
          read_at?: string;
        };
        Update: never;
      };
      feedback: {
        Row: {
          id: number;
          username: string;
          text: string;
          status: 'pending' | 'approved' | 'rejected';
          reward: number | null;
          notified: boolean;
          created_at: string;
          approved_at: string | null;
          rejected_at: string | null;
        };
        Insert: {
          username: string;
          text: string;
          status?: 'pending' | 'approved' | 'rejected';
          reward?: number | null;
          notified?: boolean;
        };
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>;
      };
      blocks: {
        Row: {
          blocker: string;
          blocked: string;
          created_at: string;
        };
        Insert: {
          blocker: string;
          blocked: string;
          created_at?: string;
        };
        Update: never;
      };
      referrals: {
        Row: {
          id: number;
          referrer: string;
          referred: string;
          referrer_email: string | null;
          referred_email: string | null;
          bonus_awarded: boolean;
          created_at: string;
        };
        Insert: {
          referrer: string;
          referred: string;
          referrer_email?: string | null;
          referred_email?: string | null;
          bonus_awarded?: boolean;
        };
        Update: {
          bonus_awarded?: boolean;
        };
      };
      activity_feed: {
        Row: {
          id: number;
          username: string;
          type: 'daily_score' | 'badge_earned' | 'username_changed' | 'cosmetic_purchased';
          created_at: string;
          score: number | null;
          time_taken: number | null;
          badge_id: string | null;
          badge_name: string | null;
          old_username: string | null;
          item_id: string | null;
          item_name: string | null;
          item_type: string | null;
          metadata: Record<string, unknown>;
        };
        Insert: Omit<Database['public']['Tables']['activity_feed']['Row'], 'id'>;
        Update: never;
      };
      districts: {
        Row: {
          id: string;
          name: string;
          team_name: string | null;
          score: number;
          member_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          team_name?: string | null;
          score?: number;
          member_count?: number;
        };
        Update: Partial<Database['public']['Tables']['districts']['Insert']>;
      };
      game_results: {
        Row: {
          id: string;
          user_id: string | null;
          score: number;
          time_taken: number;
          played_at: string;
          platform: string;
          correct_answers: number | null;
          question_count: number | null;
          streak_at_play: number | null;
          is_bonus: boolean;
        };
        Insert: Omit<Database['public']['Tables']['game_results']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['game_results']['Insert']>;
      };
    };
    Functions: {
      get_friends: {
        Args: { user_username: string };
        Returns: Array<{ friend_username: string; since: string }>;
      };
      are_friends: {
        Args: { user1: string; user2: string };
        Returns: boolean;
      };
      add_friendship: {
        Args: { user1: string; user2: string };
        Returns: boolean;
      };
      remove_friendship: {
        Args: { user1: string; user2: string };
        Returns: boolean;
      };
    };
  };
}

// Convenience type aliases
export type Tables = Database['public']['Tables'];
export type UserRow = Tables['users']['Row'];
export type UserInsert = Tables['users']['Insert'];
export type UserUpdate = Tables['users']['Update'];

export type BadgeStatsRow = Tables['badge_stats']['Row'];
export type BadgeStatsInsert = Tables['badge_stats']['Insert'];
export type BadgeStatsUpdate = Tables['badge_stats']['Update'];

export type FriendshipRow = Tables['friendships']['Row'];
export type FriendRequestRow = Tables['friend_requests']['Row'];
export type UserGameRow = Tables['user_games']['Row'];
export type PurchasedBadgeRow = Tables['purchased_badges']['Row'];

export type ShopItemRow = Tables['shop_items']['Row'];
export type AchievementRow = Tables['achievements']['Row'];
export type QuestRow = Tables['quests']['Row'];
export type AnnouncementRow = Tables['announcements']['Row'];

export type FeedbackRow = Tables['feedback']['Row'];
export type BlockRow = Tables['blocks']['Row'];
export type ReferralRow = Tables['referrals']['Row'];
export type ActivityFeedRow = Tables['activity_feed']['Row'];
export type DistrictRow = Tables['districts']['Row'];
export type GameResultRow = Tables['game_results']['Row'];
