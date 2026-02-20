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
      certificate_templates: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          created_at: string
          created_by: string | null
          field_config: Json
          height: number
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          type: string
          updated_at: string
          width: number
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          created_at?: string
          created_by?: string | null
          field_config?: Json
          height?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          type?: string
          updated_at?: string
          width?: number
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          created_at?: string
          created_by?: string | null
          field_config?: Json
          height?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          type?: string
          updated_at?: string
          width?: number
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_text: string | null
          created_at: string
          date: string | null
          id: string
          issued_by: string | null
          issuer: string | null
          notes: string | null
          reciter_id: string | null
          reciter_name: string | null
          riwaya: string | null
          sheikh_name: string | null
          status: string
          student_email: string | null
          student_name: string | null
          student_phone: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_text?: string | null
          created_at?: string
          date?: string | null
          id?: string
          issued_by?: string | null
          issuer?: string | null
          notes?: string | null
          reciter_id?: string | null
          reciter_name?: string | null
          riwaya?: string | null
          sheikh_name?: string | null
          status?: string
          student_email?: string | null
          student_name?: string | null
          student_phone?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_text?: string | null
          created_at?: string
          date?: string | null
          id?: string
          issued_by?: string | null
          issuer?: string | null
          notes?: string | null
          reciter_id?: string | null
          reciter_name?: string | null
          riwaya?: string | null
          sheikh_name?: string | null
          status?: string
          student_email?: string | null
          student_name?: string | null
          student_phone?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          capacity: number
          committee_member_1: string | null
          committee_member_1_name: string | null
          committee_member_2: string | null
          committee_member_2_name: string | null
          committee_member_3: string | null
          committee_member_3_name: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          result: string | null
          status: string
          student_id: string | null
          student_name: string | null
          time: string
          type: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          committee_member_1?: string | null
          committee_member_1_name?: string | null
          committee_member_2?: string | null
          committee_member_2_name?: string | null
          committee_member_3?: string | null
          committee_member_3_name?: string | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          result?: string | null
          status?: string
          student_id?: string | null
          student_name?: string | null
          time: string
          type?: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          committee_member_1?: string | null
          committee_member_1_name?: string | null
          committee_member_2?: string | null
          committee_member_2_name?: string | null
          committee_member_3?: string | null
          committee_member_3_name?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          result?: string | null
          status?: string
          student_id?: string | null
          student_name?: string | null
          time?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_subscriptions: {
        Row: {
          amount: number
          created_at: string
          duration_months: number
          gift_code: string
          id: string
          personal_message: string | null
          plan_id: string
          plan_name: string
          recipient_name: string
          recipient_phone: string
          redeemed_at: string | null
          redeemed_by: string | null
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          duration_months: number
          gift_code: string
          id?: string
          personal_message?: string | null
          plan_id: string
          plan_name: string
          recipient_name: string
          recipient_phone: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          duration_months?: number
          gift_code?: string
          id?: string
          personal_message?: string | null
          plan_id?: string
          plan_name?: string
          recipient_name?: string
          recipient_phone?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          id: string
          new_messages: boolean
          quran_reminders: boolean
          session_reminders: boolean
          sound: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_messages?: boolean
          quran_reminders?: boolean
          session_reminders?: boolean
          sound?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_messages?: boolean
          quran_reminders?: boolean
          session_reminders?: boolean
          sound?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          sent_by: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          sent_by?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          sent_by?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          cost_per_minute: number
          created_at: string
          email: string | null
          full_name: string
          id: string
          organization_name: string | null
          phone: string | null
          total_support_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_minute?: number
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          organization_name?: string | null
          phone?: string | null
          total_support_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_minute?: number
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          organization_name?: string | null
          phone?: string | null
          total_support_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_students: {
        Row: {
          assigned_at: string
          id: string
          partner_id: string
          status: string
          student_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          partner_id: string
          status?: string
          student_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          partner_id?: string
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      partner_usage_logs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          minutes_used: number
          partner_id: string
          session_date: string
          student_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          minutes_used?: number
          partner_id: string
          session_date?: string
          student_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          minutes_used?: number
          partner_id?: string
          session_date?: string
          student_id?: string
        }
        Relationships: []
      }
      payment_cards: {
        Row: {
          card_type: string
          created_at: string
          expiry: string
          id: string
          last4: string
          user_id: string
        }
        Insert: {
          card_type?: string
          created_at?: string
          expiry: string
          id?: string
          last4: string
          user_id: string
        }
        Update: {
          card_type?: string
          created_at?: string
          expiry?: string
          id?: string
          last4?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reciter_certifications: {
        Row: {
          certification_text: string
          created_at: string
          id: string
          reciter_id: string
          riwaya: string | null
          type: string
          updated_at: string
        }
        Insert: {
          certification_text?: string
          created_at?: string
          id?: string
          reciter_id: string
          riwaya?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          certification_text?: string
          created_at?: string
          id?: string
          reciter_id?: string
          riwaya?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reciter_profiles: {
        Row: {
          city: string
          created_at: string
          full_name: string
          gender: string
          id: string
          id_number: string
          nationality: string
          phone: string
          preferred_days: string[]
          preferred_times: string[]
          preferred_track: string
          profession: string
          qualifications: string
          quran_certifications: string
          signature_url: string | null
          stamp_url: string | null
          status: string
          teaching_experience: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          full_name: string
          gender: string
          id?: string
          id_number: string
          nationality: string
          phone: string
          preferred_days?: string[]
          preferred_times?: string[]
          preferred_track?: string
          profession: string
          qualifications: string
          quran_certifications: string
          signature_url?: string | null
          stamp_url?: string | null
          status?: string
          teaching_experience: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          full_name?: string
          gender?: string
          id?: string
          id_number?: string
          nationality?: string
          phone?: string
          preferred_days?: string[]
          preferred_times?: string[]
          preferred_track?: string
          profession?: string
          qualifications?: string
          quran_certifications?: string
          signature_url?: string | null
          stamp_url?: string | null
          status?: string
          teaching_experience?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_records: {
        Row: {
          created_at: string
          date: string
          duration: string
          id: string
          notes: string | null
          other_user_name: string
          rating: number | null
          status: string
          time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          duration?: string
          id?: string
          notes?: string | null
          other_user_name: string
          rating?: number | null
          status?: string
          time: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: string
          id?: string
          notes?: string | null
          other_user_name?: string
          rating?: number | null
          status?: string
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          certificates_count: number
          commitment_rate: number
          completions: number
          id: string
          nationality: string | null
          pages_memorized: number
          parts_memorized: number
          sessions_count: number
          student_id: string
          total_minutes: number
          updated_at: string
        }
        Insert: {
          certificates_count?: number
          commitment_rate?: number
          completions?: number
          id?: string
          nationality?: string | null
          pages_memorized?: number
          parts_memorized?: number
          sessions_count?: number
          student_id: string
          total_minutes?: number
          updated_at?: string
        }
        Update: {
          certificates_count?: number
          commitment_rate?: number
          completions?: number
          id?: string
          nationality?: string | null
          pages_memorized?: number
          parts_memorized?: number
          sessions_count?: number
          student_id?: string
          total_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          assigned_reciter_id: string | null
          created_at: string
          education_level: string
          email: string
          full_name: string
          gender: string
          id: string
          id_number: string
          ijazah_status: string | null
          join_date: string | null
          nationality: string
          phone: string
          preferred_riwaya: string
          preferred_track: string
          profession: string
          quran_certifications: string | null
          residence_country: string
          selected_exam_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_reciter_id?: string | null
          created_at?: string
          education_level: string
          email: string
          full_name: string
          gender: string
          id?: string
          id_number: string
          ijazah_status?: string | null
          join_date?: string | null
          nationality: string
          phone: string
          preferred_riwaya?: string
          preferred_track?: string
          profession: string
          quran_certifications?: string | null
          residence_country: string
          selected_exam_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_reciter_id?: string | null
          created_at?: string
          education_level?: string
          email?: string
          full_name?: string
          gender?: string
          id?: string
          id_number?: string
          ijazah_status?: string | null
          join_date?: string | null
          nationality?: string
          phone?: string
          preferred_riwaya?: string
          preferred_track?: string
          profession?: string
          quran_certifications?: string | null
          residence_country?: string
          selected_exam_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: string
          created_at: string
          date: string
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          amount: string
          created_at?: string
          date: string
          id?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          amount?: string
          created_at?: string
          date?: string
          id?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_plans: {
        Row: {
          created_at: string
          days: string[]
          goal_labels: string[]
          goals: string[]
          id: string
          scope: string
          scope_label: string
          times: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days?: string[]
          goal_labels?: string[]
          goals?: string[]
          id?: string
          scope?: string
          scope_label?: string
          times?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days?: string[]
          goal_labels?: string[]
          goals?: string[]
          id?: string
          scope?: string
          scope_label?: string
          times?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: { Args: { p_email: string }; Returns: boolean }
      check_phone_exists: { Args: { p_phone: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "reciter" | "partner" | "admin"
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
      app_role: ["student", "reciter", "partner", "admin"],
    },
  },
} as const
