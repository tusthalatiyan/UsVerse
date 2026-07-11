export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Views: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          emoji_identity: string;
          avatar_key: string;
          theme_preference: Database["public"]["Enums"]["theme_preference"];
          bio: string | null;
          active_couple_id: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          emoji_identity: string;
          avatar_key: string;
          theme_preference?: Database["public"]["Enums"]["theme_preference"];
          bio?: string | null;
          active_couple_id?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nickname?: string;
          emoji_identity?: string;
          avatar_key?: string;
          theme_preference?: Database["public"]["Enums"]["theme_preference"];
          bio?: string | null;
          active_couple_id?: string | null;
          last_seen_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          created_by: string;
          partner_one_id: string;
          partner_two_id: string | null;
          invite_code: string;
          status: Database["public"]["Enums"]["couple_status"];
          paired_at: string | null;
          unlinked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          partner_one_id: string;
          partner_two_id?: string | null;
          invite_code: string;
          status?: Database["public"]["Enums"]["couple_status"];
          paired_at?: string | null;
          unlinked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          partner_two_id?: string | null;
          invite_code?: string;
          status?: Database["public"]["Enums"]["couple_status"];
          paired_at?: string | null;
          unlinked_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          description: string | null;
          category: string;
          emoji: string;
          tags: string[];
          image_url: string | null;
          priority_weight: number;
          status: Database["public"]["Enums"]["idea_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          category: string;
          emoji?: string;
          tags?: string[];
          image_url?: string | null;
          priority_weight?: number;
          status?: Database["public"]["Enums"]["idea_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string;
          emoji?: string;
          tags?: string[];
          image_url?: string | null;
          priority_weight?: number;
          status?: Database["public"]["Enums"]["idea_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          idea_id: string | null;
          prompt: string;
          mode: Database["public"]["Enums"]["vote_mode"];
          status: Database["public"]["Enums"]["vote_status"];
          options: Json;
          closes_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          idea_id?: string | null;
          prompt: string;
          mode: Database["public"]["Enums"]["vote_mode"];
          status?: Database["public"]["Enums"]["vote_status"];
          options?: Json;
          closes_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          idea_id?: string | null;
          prompt?: string;
          mode?: Database["public"]["Enums"]["vote_mode"];
          status?: Database["public"]["Enums"]["vote_status"];
          options?: Json;
          closes_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      vote_responses: {
        Row: {
          id: string;
          couple_id: string;
          vote_id: string;
          user_id: string;
          response_value: string | null;
          rating_value: number | null;
          emoji_value: string | null;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          vote_id: string;
          user_id: string;
          response_value?: string | null;
          rating_value?: number | null;
          emoji_value?: string | null;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          response_value?: string | null;
          rating_value?: number | null;
          emoji_value?: string | null;
          comment?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          couple_id: string;
          sender_id: string;
          content: string;
          read_by: string[];
          reaction_map: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          sender_id: string;
          content: string;
          read_by?: string[];
          reaction_map?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          read_by?: string[];
          reaction_map?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      moods: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          mood: Database["public"]["Enums"]["mood_name"];
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          mood: Database["public"]["Enums"]["mood_name"];
          note?: string | null;
          created_at?: string;
        };
        Update: {
          mood?: Database["public"]["Enums"]["mood_name"];
          note?: string | null;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          related_idea_id: string | null;
          related_vote_id: string | null;
          title: string;
          description: string | null;
          memory_type: string;
          celebration_level: number;
          cover_url: string | null;
          metadata: Json;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          related_idea_id?: string | null;
          related_vote_id?: string | null;
          title: string;
          description?: string | null;
          memory_type: string;
          celebration_level?: number;
          cover_url?: string | null;
          metadata?: Json;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          related_idea_id?: string | null;
          related_vote_id?: string | null;
          title?: string;
          description?: string | null;
          memory_type?: string;
          celebration_level?: number;
          cover_url?: string | null;
          metadata?: Json;
          occurred_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string;
          actor_id: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string;
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          couple_id: string;
          actor_id?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          game_type: Database["public"]["Enums"]["game_type"];
          prompt: string;
          state: Json;
          winner_id: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          game_type: Database["public"]["Enums"]["game_type"];
          prompt: string;
          state?: Json;
          winner_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          prompt?: string;
          state?: Json;
          winner_id?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Enums: {
      couple_status: "active" | "unlinked";
      theme_preference:
        | "rosewater"
        | "peach-fizz"
        | "mint-meringue"
        | "starlit-lagoon";
      idea_status: "pending" | "shortlisted" | "completed";
      vote_mode: "yes_no" | "emoji" | "rating" | "vibe";
      vote_status: "active" | "closed" | "cancelled";
      notification_type:
        | "idea_added"
        | "vote_started"
        | "surprise_unlocked"
        | "message_received"
        | "system";
      mood_name:
        | "hungry"
        | "bored"
        | "romantic"
        | "adventurous"
        | "tired"
        | "movie_mood"
        | "lazy"
        | "excited";
      game_type:
        | "this_or_that"
        | "would_you_rather"
        | "spin_the_wheel"
        | "partner_quiz"
        | "emoji_guessing";
    };
    Functions: {
      create_couple_invite: {
        Args: Record<PropertyKey, never>;
        Returns: {
          couple_id: string;
          invite_code: string;
        }[];
      };
      join_couple_with_code: {
        Args: {
          invite_code_input: string;
        };
        Returns: {
          couple_id: string;
          invite_code: string;
        }[];
      };
      unlink_couple: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
        get_active_couple_id: {
          Args: {
            user_id_input?: string;
          };
          Returns: string | null;
        };
        get_space_members: {
          Args: {
            user_id_input?: string;
          };
          Returns: Database["public"]["Tables"]["profiles"]["Row"][];
        };
      };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type TableName = keyof PublicSchema["Tables"];
export type EnumName = keyof PublicSchema["Enums"];

export type Tables<T extends TableName> = PublicSchema["Tables"][T]["Row"];
export type Inserts<T extends TableName> = PublicSchema["Tables"][T]["Insert"];
export type Updates<T extends TableName> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends EnumName> = PublicSchema["Enums"][T];
