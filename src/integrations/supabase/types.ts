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
      athletes: {
        Row: {
          birth_date: string | null
          created_at: string
          gender: string | null
          height: number | null
          id: string
          name: string
          notes: string | null
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
          name: string
          notes?: string | null
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
          name?: string
          notes?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
