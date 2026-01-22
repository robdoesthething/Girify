export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null;
          created_at: string | null;
          criteria: string | null;
          description: string | null;
          emoji: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          rarity: string | null;
          sort_order: number | null;
          unlock_condition: Json | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          criteria?: string | null;
          description?: string | null;
          emoji?: string | null;
          id: string;
          is_active?: boolean | null;
          name: string;
          rarity?: string | null;
          sort_order?: number | null;
          unlock_condition?: Json | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          criteria?: string | null;
          description?: string | null;
          emoji?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          rarity?: string | null;
          sort_order?: number | null;
          unlock_condition?: Json | null;
        };
        Relationships: [];
      };
      activity_feed: {
        Row: {
          badge_id: string | null;
          badge_name: string | null;
          created_at: string | null;
          id: number;
          item_id: string | null;
          item_name: string | null;
          item_type: string | null;
          metadata: Json | null;
          old_username: string | null;
          score: number | null;
          time_taken: number | null;
          type: string;
          username: string;
        };
        Insert: {
          badge_id?: string | null;
          badge_name?: string | null;
          created_at?: string | null;
          id?: number;
          item_id?: string | null;
          item_name?: string | null;
          item_type?: string | null;
          metadata?: Json | null;
          old_username?: string | null;
          score?: number | null;
          time_taken?: number | null;
          type: string;
          username: string;
        };
        Update: {
          badge_id?: string | null;
          badge_name?: string | null;
          created_at?: string | null;
          id?: number;
          item_id?: string | null;
          item_name?: string | null;
          item_type?: string | null;
          metadata?: Json | null;
          old_username?: string | null;
          score?: number | null;
          time_taken?: number | null;
          type?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_feed_username_fkey';
            columns: ['username'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      admins: {
        Row: {
          created_at: string | null;
          uid: string;
          username: string | null;
        };
        Insert: {
          created_at?: string | null;
          uid: string;
          username?: string | null;
        };
        Update: {
          created_at?: string | null;
          uid?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          body: string;
          created_at: string | null;
          expiry_date: string | null;
          id: number;
          is_active: boolean | null;
          priority: string | null;
          publish_date: string | null;
          target_audience: string | null;
          title: string;
        };
        Insert: {
          body: string;
          created_at?: string | null;
          expiry_date?: string | null;
          id?: number;
          is_active?: boolean | null;
          priority?: string | null;
          publish_date?: string | null;
          target_audience?: string | null;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string | null;
          expiry_date?: string | null;
          id?: number;
          is_active?: boolean | null;
          priority?: string | null;
          publish_date?: string | null;
          target_audience?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      badge_stats: {
        Row: {
          best_score: number | null;
          born_guesses: number | null;
          consecutive_days: number | null;
          eixample_corners: number | null;
          fast_loss: boolean | null;
          food_streets_perfect: number | null;
          games_played: number | null;
          games_without_quitting: number | null;
          gothic_streak: number | null;
          invite_count: number | null;
          last_play_date: string | null;
          night_play: boolean | null;
          poblenou_guesses: number | null;
          precision_guess: boolean | null;
          ramblas_quick_guess: boolean | null;
          speed_mode_high_score: boolean | null;
          streak: number | null;
          total_pan_km: number | null;
          updated_at: string | null;
          username: string;
          wrong_streak: number | null;
        };
        Insert: {
          best_score?: number | null;
          born_guesses?: number | null;
          consecutive_days?: number | null;
          eixample_corners?: number | null;
          fast_loss?: boolean | null;
          food_streets_perfect?: number | null;
          games_played?: number | null;
          games_without_quitting?: number | null;
          gothic_streak?: number | null;
          invite_count?: number | null;
          last_play_date?: string | null;
          night_play?: boolean | null;
          poblenou_guesses?: number | null;
          precision_guess?: boolean | null;
          ramblas_quick_guess?: boolean | null;
          speed_mode_high_score?: boolean | null;
          streak?: number | null;
          total_pan_km?: number | null;
          updated_at?: string | null;
          username: string;
          wrong_streak?: number | null;
        };
        Update: {
          best_score?: number | null;
          born_guesses?: number | null;
          consecutive_days?: number | null;
          eixample_corners?: number | null;
          fast_loss?: boolean | null;
          food_streets_perfect?: number | null;
          games_played?: number | null;
          games_without_quitting?: number | null;
          gothic_streak?: number | null;
          invite_count?: number | null;
          last_play_date?: string | null;
          night_play?: boolean | null;
          poblenou_guesses?: number | null;
          precision_guess?: boolean | null;
          ramblas_quick_guess?: boolean | null;
          speed_mode_high_score?: boolean | null;
          streak?: number | null;
          total_pan_km?: number | null;
          updated_at?: string | null;
          username?: string;
          wrong_streak?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'badge_stats_username_fkey';
            columns: ['username'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      blocks: {
        Row: {
          blocked: string;
          blocker: string;
          created_at: string | null;
        };
        Insert: {
          blocked: string;
          blocker: string;
          created_at?: string | null;
        };
        Update: {
          blocked?: string;
          blocker?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blocks_blocked_fkey';
            columns: ['blocked'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
          {
            foreignKeyName: 'blocks_blocker_fkey';
            columns: ['blocker'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      districts: {
        Row: {
          created_at: string | null;
          id: string;
          member_count: number | null;
          name: string;
          score: number | null;
          team_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          member_count?: number | null;
          name: string;
          score?: number | null;
          team_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          member_count?: number | null;
          name?: string;
          score?: number | null;
          team_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          approved_at: string | null;
          created_at: string | null;
          id: number;
          notified: boolean | null;
          rejected_at: string | null;
          reward: number | null;
          status: string | null;
          text: string;
          username: string;
        };
        Insert: {
          approved_at?: string | null;
          created_at?: string | null;
          id?: number;
          notified?: boolean | null;
          rejected_at?: string | null;
          reward?: number | null;
          status?: string | null;
          text: string;
          username: string;
        };
        Update: {
          approved_at?: string | null;
          created_at?: string | null;
          id?: number;
          notified?: boolean | null;
          rejected_at?: string | null;
          reward?: number | null;
          status?: string | null;
          text?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_username_fkey';
            columns: ['username'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      friend_requests: {
        Row: {
          created_at: string | null;
          from_user: string;
          id: number;
          status: string | null;
          to_user: string;
        };
        Insert: {
          created_at?: string | null;
          from_user: string;
          id?: number;
          status?: string | null;
          to_user: string;
        };
        Update: {
          created_at?: string | null;
          from_user?: string;
          id?: number;
          status?: string | null;
          to_user?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friend_requests_from_user_fkey';
            columns: ['from_user'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
          {
            foreignKeyName: 'friend_requests_to_user_fkey';
            columns: ['to_user'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      friendships: {
        Row: {
          created_at: string | null;
          id: number;
          user_a: string;
          user_b: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          user_a: string;
          user_b: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          user_a?: string;
          user_b?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_user_a_fkey';
            columns: ['user_a'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
          {
            foreignKeyName: 'friendships_user_b_fkey';
            columns: ['user_b'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      game_results: {
        Row: {
          correct_answers: number | null;
          id: number;
          is_bonus: boolean | null;
          platform: string | null;
          played_at: string | null;
          question_count: number | null;
          score: number;
          streak_at_play: number | null;
          time_taken: number | null;
          user_id: string | null;
        };
        Insert: {
          correct_answers?: number | null;
          id?: number;
          is_bonus?: boolean | null;
          platform?: string | null;
          played_at?: string | null;
          question_count?: number | null;
          score: number;
          streak_at_play?: number | null;
          time_taken?: number | null;
          user_id?: string | null;
        };
        Update: {
          correct_answers?: number | null;
          id?: number;
          is_bonus?: boolean | null;
          platform?: string | null;
          played_at?: string | null;
          question_count?: number | null;
          score?: number;
          streak_at_play?: number | null;
          time_taken?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'game_results_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      purchased_badges: {
        Row: {
          badge_id: string;
          id: number;
          purchased_at: string | null;
          username: string;
        };
        Insert: {
          badge_id: string;
          id?: number;
          purchased_at?: string | null;
          username: string;
        };
        Update: {
          badge_id?: string;
          id?: number;
          purchased_at?: string | null;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchased_badges_username_fkey';
            columns: ['username'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      quests: {
        Row: {
          active_date: string | null;
          created_at: string | null;
          criteria_type: string;
          criteria_value: string | null;
          description: string | null;
          id: number;
          is_active: boolean | null;
          reward_giuros: number | null;
          title: string;
        };
        Insert: {
          active_date?: string | null;
          created_at?: string | null;
          criteria_type: string;
          criteria_value?: string | null;
          description?: string | null;
          id?: number;
          is_active?: boolean | null;
          reward_giuros?: number | null;
          title: string;
        };
        Update: {
          active_date?: string | null;
          created_at?: string | null;
          criteria_type?: string;
          criteria_value?: string | null;
          description?: string | null;
          id?: number;
          is_active?: boolean | null;
          reward_giuros?: number | null;
          title?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          bonus_awarded: boolean | null;
          created_at: string | null;
          id: number;
          referred: string;
          referred_email: string | null;
          referrer: string;
          referrer_email: string | null;
        };
        Insert: {
          bonus_awarded?: boolean | null;
          created_at?: string | null;
          id?: number;
          referred: string;
          referred_email?: string | null;
          referrer: string;
          referrer_email?: string | null;
        };
        Update: {
          bonus_awarded?: boolean | null;
          created_at?: string | null;
          id?: number;
          referred?: string;
          referred_email?: string | null;
          referrer?: string;
          referrer_email?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
          {
            foreignKeyName: 'referrals_referrer_fkey';
            columns: ['referrer'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      shop_items: {
        Row: {
          color: string | null;
          cost: number;
          created_at: string | null;
          css_class: string | null;
          description: string | null;
          emoji: string | null;
          flavor_text: string | null;
          id: string;
          image: string | null;
          is_active: boolean | null;
          name: string;
          prefix: string | null;
          rarity: string | null;
          type: string;
        };
        Insert: {
          color?: string | null;
          cost: number;
          created_at?: string | null;
          css_class?: string | null;
          description?: string | null;
          emoji?: string | null;
          flavor_text?: string | null;
          id: string;
          image?: string | null;
          is_active?: boolean | null;
          name: string;
          prefix?: string | null;
          rarity?: string | null;
          type: string;
        };
        Update: {
          color?: string | null;
          cost?: number;
          created_at?: string | null;
          css_class?: string | null;
          description?: string | null;
          emoji?: string | null;
          flavor_text?: string | null;
          id?: string;
          image?: string | null;
          is_active?: boolean | null;
          name?: string;
          prefix?: string | null;
          rarity?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      user_games: {
        Row: {
          avg_time: number | null;
          correct_answers: number | null;
          date: string;
          id: number;
          incomplete: boolean | null;
          played_at: string | null;
          question_count: number | null;
          score: number;
          username: string;
        };
        Insert: {
          avg_time?: number | null;
          correct_answers?: number | null;
          date: string;
          id?: number;
          incomplete?: boolean | null;
          played_at?: string | null;
          question_count?: number | null;
          score: number;
          username: string;
        };
        Update: {
          avg_time?: number | null;
          correct_answers?: number | null;
          date?: string;
          id?: number;
          incomplete?: boolean | null;
          played_at?: string | null;
          question_count?: number | null;
          score?: number;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_games_username_fkey';
            columns: ['username'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      user_read_announcements: {
        Row: {
          announcement_id: number;
          read_at: string | null;
          username: string;
        };
        Insert: {
          announcement_id: number;
          read_at?: string | null;
          username: string;
        };
        Update: {
          announcement_id?: number;
          read_at?: string | null;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_read_announcements_announcement_id_fkey';
            columns: ['announcement_id'];
            isOneToOne: false;
            referencedRelation: 'announcements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_read_announcements_username_fkey';
            columns: ['username'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
      users: {
        Row: {
          avatar_id: number | null;
          banned: boolean | null;
          best_score: number | null;
          created_at: string | null;
          district: string | null;
          email: string | null;
          equipped_badges: string[] | null;
          equipped_cosmetics: Json | null;
          friend_count: number | null;
          games_played: number | null;
          giuros: number | null;
          joined_at: string | null;
          language: string | null;
          last_login_date: string | null;
          last_play_date: string | null;
          max_streak: number | null;
          migrated_from: string | null;
          migrated_to: string | null;
          notification_settings: Json | null;
          purchased_cosmetics: string[] | null;
          real_name: string | null;
          referral_code: string | null;
          referred_by: string | null;
          streak: number | null;
          team: string | null;
          theme: string | null;
          total_score: number | null;
          uid: string | null;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          avatar_id?: number | null;
          banned?: boolean | null;
          best_score?: number | null;
          created_at?: string | null;
          district?: string | null;
          email?: string | null;
          equipped_badges?: string[] | null;
          equipped_cosmetics?: Json | null;
          friend_count?: number | null;
          games_played?: number | null;
          giuros?: number | null;
          joined_at?: string | null;
          language?: string | null;
          last_login_date?: string | null;
          last_play_date?: string | null;
          max_streak?: number | null;
          migrated_from?: string | null;
          migrated_to?: string | null;
          notification_settings?: Json | null;
          purchased_cosmetics?: string[] | null;
          real_name?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          streak?: number | null;
          team?: string | null;
          theme?: string | null;
          total_score?: number | null;
          uid?: string | null;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          avatar_id?: number | null;
          banned?: boolean | null;
          best_score?: number | null;
          created_at?: string | null;
          district?: string | null;
          email?: string | null;
          equipped_badges?: string[] | null;
          equipped_cosmetics?: Json | null;
          friend_count?: number | null;
          games_played?: number | null;
          giuros?: number | null;
          joined_at?: string | null;
          language?: string | null;
          last_login_date?: string | null;
          last_play_date?: string | null;
          max_streak?: number | null;
          migrated_from?: string | null;
          migrated_to?: string | null;
          notification_settings?: Json | null;
          purchased_cosmetics?: string[] | null;
          real_name?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          streak?: number | null;
          team?: string | null;
          theme?: string | null;
          total_score?: number | null;
          uid?: string | null;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_referred_by_fkey';
            columns: ['referred_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['username'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_friendship: {
        Args: { user1: string; user2: string };
        Returns: boolean;
      };
      are_friends: { Args: { user1: string; user2: string }; Returns: boolean };
      get_friends: {
        Args: { user_username: string };
        Returns: {
          friend_username: string;
          since: string;
        }[];
      };
      is_admin: { Args: never; Returns: boolean };
      remove_friendship: {
        Args: { user1: string; user2: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
