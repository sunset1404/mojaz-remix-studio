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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          page_key: string
          permission_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_key: string
          permission_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_key?: string
          permission_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      auto_notifications: {
        Row: {
          body: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          notification_type: string
          target_role: string
          title: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          notification_type?: string
          target_role?: string
          title: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          notification_type?: string
          target_role?: string
          title?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_diagnostics: {
        Row: {
          audio_level: number | null
          candidate_protocol: string | null
          connection_state: string | null
          created_at: string
          details: Json | null
          gathered_candidate_types: string[] | null
          ice_connection_state: string | null
          id: string
          inbound_audio_bytes: number | null
          inbound_audio_packets: number | null
          local_candidate_type: string | null
          network_type: string | null
          outbound_audio_bytes: number | null
          outbound_audio_packets: number | null
          remote_candidate_type: string | null
          role: string
          room_id: string
          severity: string
          user_agent: string | null
          user_id: string | null
          verdict: string
        }
        Insert: {
          audio_level?: number | null
          candidate_protocol?: string | null
          connection_state?: string | null
          created_at?: string
          details?: Json | null
          gathered_candidate_types?: string[] | null
          ice_connection_state?: string | null
          id?: string
          inbound_audio_bytes?: number | null
          inbound_audio_packets?: number | null
          local_candidate_type?: string | null
          network_type?: string | null
          outbound_audio_bytes?: number | null
          outbound_audio_packets?: number | null
          remote_candidate_type?: string | null
          role: string
          room_id: string
          severity?: string
          user_agent?: string | null
          user_id?: string | null
          verdict: string
        }
        Update: {
          audio_level?: number | null
          candidate_protocol?: string | null
          connection_state?: string | null
          created_at?: string
          details?: Json | null
          gathered_candidate_types?: string[] | null
          ice_connection_state?: string | null
          id?: string
          inbound_audio_bytes?: number | null
          inbound_audio_packets?: number | null
          local_candidate_type?: string | null
          network_type?: string | null
          outbound_audio_bytes?: number | null
          outbound_audio_packets?: number | null
          remote_candidate_type?: string | null
          role?: string
          room_id?: string
          severity?: string
          user_agent?: string | null
          user_id?: string | null
          verdict?: string
        }
        Relationships: []
      }
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
          reciter_signature_url: string | null
          reciter_stamp_url: string | null
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
          reciter_signature_url?: string | null
          reciter_stamp_url?: string | null
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
          reciter_signature_url?: string | null
          reciter_stamp_url?: string | null
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      exam_evaluations: {
        Row: {
          created_at: string
          end_ayah: string | null
          end_surah: string | null
          exam_id: string | null
          exam_type: string | null
          id: string
          notes: string | null
          passed: boolean
          reciter_id: string
          reciter_name: string | null
          scores: Json
          start_ayah: string | null
          start_surah: string | null
          student_id: string
          student_name: string | null
          total_score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_ayah?: string | null
          end_surah?: string | null
          exam_id?: string | null
          exam_type?: string | null
          id?: string
          notes?: string | null
          passed?: boolean
          reciter_id: string
          reciter_name?: string | null
          scores?: Json
          start_ayah?: string | null
          start_surah?: string | null
          student_id: string
          student_name?: string | null
          total_score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_ayah?: string | null
          end_surah?: string | null
          exam_id?: string | null
          exam_type?: string | null
          id?: string
          notes?: string | null
          passed?: boolean
          reciter_id?: string
          reciter_name?: string | null
          scores?: Json
          start_ayah?: string | null
          start_surah?: string | null
          student_id?: string
          student_name?: string | null
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_evaluations_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
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
      extra_hour_packages: {
        Row: {
          created_at: string
          hours: number
          id: string
          is_active: boolean
          label: string
          original_price: number | null
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hours?: number
          id?: string
          is_active?: boolean
          label: string
          original_price?: number | null
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hours?: number
          id?: string
          is_active?: boolean
          label?: string
          original_price?: number | null
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ghuyuf_rahman_entries: {
        Row: {
          country: string | null
          created_at: string
          entry_date: string
          hours: number
          id: string
          juz: number
          location: string | null
          nationalities_count: number
          nationality: string | null
          notes: string | null
          pages: number
          reciter_name: string
          riwaya: string | null
          riwayat_count: number
          source: string
          students_count: number
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          entry_date?: string
          hours?: number
          id?: string
          juz?: number
          location?: string | null
          nationalities_count?: number
          nationality?: string | null
          notes?: string | null
          pages?: number
          reciter_name: string
          riwaya?: string | null
          riwayat_count?: number
          source?: string
          students_count?: number
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          entry_date?: string
          hours?: number
          id?: string
          juz?: number
          location?: string | null
          nationalities_count?: number
          nationality?: string | null
          notes?: string | null
          pages?: number
          reciter_name?: string
          riwaya?: string | null
          riwayat_count?: number
          source?: string
          students_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      ghuyuf_rahman_locations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      gift_plans: {
        Row: {
          created_at: string
          discount: string | null
          duration: string
          duration_months: number
          features: string[]
          hours: string
          icon: string
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          original_price: number | null
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount?: string | null
          duration?: string
          duration_months?: number
          features?: string[]
          hours?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          original_price?: number | null
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount?: string | null
          duration?: string
          duration_months?: number
          features?: string[]
          hours?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          original_price?: number | null
          price?: number
          sort_order?: number
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      payment_invoice_metadata: {
        Row: {
          amount_sar: number
          created_at: string | null
          id: string
          metadata: Json | null
          moyassar_payment_id: string | null
          processed: boolean | null
          source_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_sar: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moyassar_payment_id?: string | null
          processed?: boolean | null
          source_type: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_sar?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moyassar_payment_id?: string | null
          processed?: boolean | null
          source_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      popup_message_views: {
        Row: {
          created_at: string
          id: string
          popup_message_id: string | null
          shown_at: string
          trigger_event: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          popup_message_id?: string | null
          shown_at?: string
          trigger_event: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          popup_message_id?: string | null
          shown_at?: string
          trigger_event?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_message_views_popup_message_id_fkey"
            columns: ["popup_message_id"]
            isOneToOne: false
            referencedRelation: "popup_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_messages: {
        Row: {
          color_scheme: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          message: string
          target_role: string
          title: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          color_scheme?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          message: string
          target_role?: string
          title: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          color_scheme?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          message?: string
          target_role?: string
          title?: string
          trigger_event?: string
          updated_at?: string
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
      programs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          max_students: number | null
          name: string
          notes: string | null
          start_date: string | null
          status: string
          track_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          max_students?: number | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string
          track_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          max_students?: number | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          track_type?: string
          updated_at?: string
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
          deleted_at: string | null
          full_name: string
          gender: string
          id: string
          id_number: string | null
          is_available: boolean
          last_seen_at: string | null
          nationality: string
          phone: string | null
          preferred_days: string[]
          preferred_times: string[]
          preferred_track: string
          profession: string
          qualifications: string
          quran_certifications: string
          reciter_type: string
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
          deleted_at?: string | null
          full_name: string
          gender: string
          id?: string
          id_number?: string | null
          is_available?: boolean
          last_seen_at?: string | null
          nationality: string
          phone?: string | null
          preferred_days?: string[]
          preferred_times?: string[]
          preferred_track?: string
          profession: string
          qualifications: string
          quran_certifications: string
          reciter_type?: string
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
          deleted_at?: string | null
          full_name?: string
          gender?: string
          id?: string
          id_number?: string | null
          is_available?: boolean
          last_seen_at?: string | null
          nationality?: string
          phone?: string | null
          preferred_days?: string[]
          preferred_times?: string[]
          preferred_track?: string
          profession?: string
          qualifications?: string
          quran_certifications?: string
          reciter_type?: string
          signature_url?: string | null
          stamp_url?: string | null
          status?: string
          teaching_experience?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_rules: {
        Row: {
          action_key: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          points: number
          updated_at: string
        }
        Insert: {
          action_key: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          points?: number
          updated_at?: string
        }
        Update: {
          action_key?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          updated_at?: string
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
          pages_reached: number | null
          parts_reached: number | null
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
          pages_reached?: number | null
          parts_reached?: number | null
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
          pages_reached?: number | null
          parts_reached?: number | null
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
      student_hour_credits: {
        Row: {
          created_at: string
          id: string
          remaining_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          remaining_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          remaining_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          assigned_reciter_id: string | null
          created_at: string
          deleted_at: string | null
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
          program_id: string | null
          quran_certifications: string | null
          residence_country: string
          selected_exam_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_reciter_id?: string | null
          created_at?: string
          deleted_at?: string | null
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
          program_id?: string | null
          quran_certifications?: string | null
          residence_country: string
          selected_exam_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_reciter_id?: string | null
          created_at?: string
          deleted_at?: string | null
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
          program_id?: string | null
          quran_certifications?: string | null
          residence_country?: string
          selected_exam_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      student_subscriptions: {
        Row: {
          amount: number
          created_at: string
          duration_months: number
          end_date: string
          id: string
          notes: string | null
          start_date: string
          status: string
          student_id: string
          student_name: string
          student_phone: string | null
          subscription_type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          duration_months?: number
          end_date: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          student_id: string
          student_name?: string
          student_phone?: string | null
          subscription_type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          duration_months?: number
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          student_id?: string
          student_name?: string
          student_phone?: string | null
          subscription_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_grant_requests: {
        Row: {
          admin_notes: string | null
          approved_duration_months: number | null
          approved_minutes: number | null
          approved_plan_id: string | null
          approved_plan_name: string | null
          approved_subscription_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          reason: string
          requested_plan_id: string | null
          requested_plan_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_notified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_duration_months?: number | null
          approved_minutes?: number | null
          approved_plan_id?: string | null
          approved_plan_name?: string | null
          approved_subscription_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          reason: string
          requested_plan_id?: string | null
          requested_plan_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_notified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_duration_months?: number | null
          approved_minutes?: number | null
          approved_plan_id?: string | null
          approved_plan_name?: string | null
          approved_subscription_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          reason?: string
          requested_plan_id?: string | null
          requested_plan_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_notified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_grant_requests_approved_plan_id_fkey"
            columns: ["approved_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_grant_requests_approved_subscription_id_fkey"
            columns: ["approved_subscription_id"]
            isOneToOne: false
            referencedRelation: "student_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_grant_requests_requested_plan_id_fkey"
            columns: ["requested_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: string[]
          has_billing: boolean
          icon: string
          id: string
          is_active: boolean
          is_popular: boolean
          monthly_minutes: number
          name: string
          not_included: string[]
          period: string
          price_monthly: number
          price_yearly: number | null
          sort_order: number
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: string[]
          has_billing?: boolean
          icon?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          monthly_minutes?: number
          name: string
          not_included?: string[]
          period?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: string[]
          has_billing?: boolean
          icon?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          monthly_minutes?: number
          name?: string
          not_included?: string[]
          period?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          options: Json | null
          order_index: number
          placeholder: string | null
          question_text: string
          question_type: string
          survey_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          placeholder?: string | null
          question_text: string
          question_type: string
          survey_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          placeholder?: string | null
          question_text?: string
          question_type?: string
          survey_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answer_text: string | null
          created_at: string
          id: string
          question_id: string
          submission_id: string
        }
        Insert: {
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id: string
          submission_id: string
        }
        Update: {
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "survey_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_submissions: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          survey_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          survey_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_submissions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          completion_message: string | null
          created_at: string
          description: string | null
          external_link_code: string
          id: string
          inactive_message: string | null
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          completion_message?: string | null
          created_at?: string
          description?: string | null
          external_link_code?: string
          id?: string
          inactive_message?: string | null
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          completion_message?: string | null
          created_at?: string
          description?: string | null
          external_link_code?: string
          id?: string
          inactive_message?: string | null
          is_active?: boolean
          title?: string
          updated_at?: string
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
      video_call_sessions: {
        Row: {
          access_token: string | null
          answer_generation: number | null
          answer_sdp: Json | null
          callee_connection_state: string | null
          callee_ready_at: string | null
          caller_connection_state: string | null
          caller_ready_at: string | null
          caller_role: string
          created_at: string | null
          ended_at: string | null
          exam_id: string | null
          failure_code: string | null
          id: string
          link_used: boolean | null
          notes: string | null
          offer_generation: number | null
          offer_sdp: Json | null
          rating: number | null
          reciter_id: string
          reciter_joined_at: string | null
          room_id: string
          signaling_generation: number
          started_at: string | null
          status: string | null
          student_id: string
          student_joined_at: string | null
          student_name: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          answer_generation?: number | null
          answer_sdp?: Json | null
          callee_connection_state?: string | null
          callee_ready_at?: string | null
          caller_connection_state?: string | null
          caller_ready_at?: string | null
          caller_role?: string
          created_at?: string | null
          ended_at?: string | null
          exam_id?: string | null
          failure_code?: string | null
          id?: string
          link_used?: boolean | null
          notes?: string | null
          offer_generation?: number | null
          offer_sdp?: Json | null
          rating?: number | null
          reciter_id: string
          reciter_joined_at?: string | null
          room_id?: string
          signaling_generation?: number
          started_at?: string | null
          status?: string | null
          student_id: string
          student_joined_at?: string | null
          student_name?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          answer_generation?: number | null
          answer_sdp?: Json | null
          callee_connection_state?: string | null
          callee_ready_at?: string | null
          caller_connection_state?: string | null
          caller_ready_at?: string | null
          caller_role?: string
          created_at?: string | null
          ended_at?: string | null
          exam_id?: string | null
          failure_code?: string | null
          id?: string
          link_used?: boolean | null
          notes?: string | null
          offer_generation?: number | null
          offer_sdp?: Json | null
          rating?: number | null
          reciter_id?: string
          reciter_joined_at?: string | null
          room_id?: string
          signaling_generation?: number
          started_at?: string | null
          status?: string | null
          student_id?: string
          student_joined_at?: string | null
          student_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_call_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
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
      whatsapp_auto_messages: {
        Row: {
          color_scheme: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          message: string
          title: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          color_scheme?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          message: string
          title: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          color_scheme?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          message?: string
          title?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_manual_logs: {
        Row: {
          created_at: string
          filters: Json
          id: string
          message: string
          phone_numbers: string[]
          recipients_count: number
          sent_by: string | null
          target_group: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          message: string
          phone_numbers?: string[]
          recipients_count?: number
          sent_by?: string | null
          target_group?: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          message?: string
          phone_numbers?: string[]
          recipients_count?: number
          sent_by?: string | null
          target_group?: string
        }
        Relationships: []
      }
      whatsapp_message_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          phone: string | null
          wamid: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          phone?: string | null
          wamid?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          phone?: string | null
          wamid?: string | null
        }
        Relationships: []
      }
      whatsapp_message_recipients: {
        Row: {
          created_at: string
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          log_id: string | null
          phone: string
          read_at: string | null
          replied_at: string | null
          sent_at: string
          status: string
          wamid: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          log_id?: string | null
          phone: string
          read_at?: string | null
          replied_at?: string | null
          sent_at?: string
          status?: string
          wamid?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          log_id?: string | null
          phone?: string
          read_at?: string | null
          replied_at?: string | null
          sent_at?: string
          status?: string
          wamid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_recipients_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_manual_logs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assign_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user: string
        }
        Returns: undefined
      }
      admin_revoke_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user: string
        }
        Returns: undefined
      }
      check_email_exists: { Args: { p_email: string }; Returns: boolean }
      check_phone_exists: { Args: { p_phone: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_email_registration_status: {
        Args: { p_email: string }
        Returns: string
      }
      get_exam_registration_counts: {
        Args: { p_exam_ids: string[] }
        Returns: {
          exam_id: string
          registered_count: number
        }[]
      }
      get_my_reciter_sensitive: {
        Args: never
        Returns: {
          id_number: string
          phone: string
        }[]
      }
      get_reciter_sensitive_admin: {
        Args: { _user_id: string }
        Returns: {
          id_number: string
          phone: string
          user_id: string
        }[]
      }
      get_scheduled_admission_exams: {
        Args: never
        Returns: {
          capacity: number
          committee_member_1_name: string
          committee_member_2_name: string
          committee_member_3_name: string
          date: string
          id: string
          registered_count: number
          time: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_exam_committee_member: {
        Args: { _exam_id: string; _user_id: string }
        Returns: boolean
      }
      list_reciter_sensitive_admin: {
        Args: never
        Returns: {
          id_number: string
          phone: string
          user_id: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      parse_duration_minutes: {
        Args: { duration_text: string }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recalculate_student_achievements: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      redeem_gift_by_code: { Args: { p_code: string }; Returns: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
