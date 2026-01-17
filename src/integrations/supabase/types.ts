export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at: string
          details: string | null
          id: string
          target_user_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at?: string
          details?: string | null
          id?: string
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_user_id?: string
          created_at?: string
          details?: string | null
          id?: string
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      athletes: {
        Row: {
          birth_date: string | null
          created_at: string
          gender: string | null
          height: number | null
          id: string
          linked_user_id: string | null
          name: string
          notes: string | null
          pending_link_email: string | null
          photo_url: string | null
          position: string | null
          resting_hr: number | null
          sport: string | null
          updated_at: string
          user_id: string | null
          weight: number | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          gender?: string | null
          height?: number | null
          id?: string
          linked_user_id?: string | null
          name: string
          notes?: string | null
          pending_link_email?: string | null
          photo_url?: string | null
          position?: string | null
          resting_hr?: number | null
          sport?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          gender?: string | null
          height?: number | null
          id?: string
          linked_user_id?: string | null
          name?: string
          notes?: string | null
          pending_link_email?: string | null
          photo_url?: string | null
          position?: string | null
          resting_hr?: number | null
          sport?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      test_norms: {
        Row: {
          age_max: number | null
          age_min: number | null
          category: string
          gender: string | null
          id: string
          item: string
          lower_is_better: boolean | null
          score_1_max: number | null
          score_2_max: number | null
          score_3_max: number | null
          score_4_max: number | null
          score_5_max: number | null
          unit: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          category: string
          gender?: string | null
          id?: string
          item: string
          lower_is_better?: boolean | null
          score_1_max?: number | null
          score_2_max?: number | null
          score_3_max?: number | null
          score_4_max?: number | null
          score_5_max?: number | null
          unit?: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          category?: string
          gender?: string | null
          id?: string
          item?: string
          lower_is_better?: boolean | null
          score_1_max?: number | null
          score_2_max?: number | null
          score_3_max?: number | null
          score_4_max?: number | null
          score_5_max?: number | null
          unit?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          athlete_id: string | null
          category: string
          created_at: string
          id: string
          item: string
          notes: string | null
          score: number
          test_date: string
          unit: string
          user_id: string | null
          value: number
          variant: string | null
        }
        Insert: {
          athlete_id?: string | null
          category: string
          created_at?: string
          id?: string
          item: string
          notes?: string | null
          score: number
          test_date: string
          unit: string
          user_id?: string | null
          value: number
          variant?: string | null
        }
        Update: {
          athlete_id?: string | null
          category?: string
          created_at?: string
          id?: string
          item?: string
          notes?: string | null
          score?: number
          test_date?: string
          unit?: string
          user_id?: string | null
          value?: number
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          athlete_ids: string[] | null
          competitions: Json | null
          created_at: string
          id: string
          match_date: string
          mesocycles: Json | null
          name: string
          plan_data: Json | null
          scheduled_events: Json | null
          start_date: string
          target_endurance: number | null
          target_speed: number | null
          target_strength: number | null
          target_tactic: number | null
          target_technique: number | null
          training_blocks: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          athlete_ids?: string[] | null
          competitions?: Json | null
          created_at?: string
          id?: string
          match_date: string
          mesocycles?: Json | null
          name: string
          plan_data?: Json | null
          scheduled_events?: Json | null
          start_date: string
          target_endurance?: number | null
          target_speed?: number | null
          target_strength?: number | null
          target_tactic?: number | null
          target_technique?: number | null
          training_blocks?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          athlete_ids?: string[] | null
          competitions?: Json | null
          created_at?: string
          id?: string
          match_date?: string
          mesocycles?: Json | null
          name?: string
          plan_data?: Json | null
          scheduled_events?: Json | null
          start_date?: string
          target_endurance?: number | null
          target_speed?: number | null
          target_strength?: number | null
          target_tactic?: number | null
          target_technique?: number | null
          training_blocks?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          cooldown: string | null
          created_at: string
          exercises: Json | null
          id: string
          intensity: string | null
          is_done: boolean | null
          program_id: string | null
          recovery: string | null
          session_key: string
          updated_at: string
          warmup: string | null
        }
        Insert: {
          cooldown?: string | null
          created_at?: string
          exercises?: Json | null
          id?: string
          intensity?: string | null
          is_done?: boolean | null
          program_id?: string | null
          recovery?: string | null
          session_key: string
          updated_at?: string
          warmup?: string | null
        }
        Update: {
          cooldown?: string | null
          created_at?: string
          exercises?: Json | null
          id?: string
          intensity?: string | null
          is_done?: boolean | null
          program_id?: string | null
          recovery?: string | null
          session_key?: string
          updated_at?: string
          warmup?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: boolean
      }
      admin_remove_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: boolean
      }
      get_admin_activity_logs: {
        Args: { _limit?: number }
        Returns: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at: string
          details: string
          id: string
          target_user_email: string
          target_user_id: string
        }[]
      }
      get_all_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      get_athlete_id_from_user: { Args: { _user_id: string }; Returns: string }
      get_user_roles_admin: {
        Args: never
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_athlete_in_program: {
        Args: { _program_id: string; _user_id: string }
        Returns: boolean
      }
      log_admin_activity: {
        Args: {
          _action: string
          _details?: string
          _target_user_email?: string
          _target_user_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
