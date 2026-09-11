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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
          org_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
          org_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incharges: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          org_id: string
          phone: string
          shift_preference: string
          site_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name: string
          org_id: string
          phone?: string
          shift_preference?: string
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          org_id?: string
          phone?: string
          shift_preference?: string
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incharges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incharges_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          category: string
          code: string
          created_at: string
          hours_run: number
          id: string
          last_serviced_at: string | null
          name: string
          org_id: string
          site_id: string | null
          status: Database["public"]["Enums"]["machine_status"]
          updated_at: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          hours_run?: number
          id?: string
          last_serviced_at?: string | null
          name: string
          org_id: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["machine_status"]
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          hours_run?: number
          id?: string
          last_serviced_at?: string | null
          name?: string
          org_id?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["machine_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          org_id: string
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          org_id: string
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          org_id?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          certified_for: string[]
          created_at: string
          id: string
          license_no: string
          name: string
          org_id: string
          phone: string
          site_id: string | null
          status: Database["public"]["Enums"]["operator_status"]
          updated_at: string
        }
        Insert: {
          certified_for?: string[]
          created_at?: string
          id?: string
          license_no?: string
          name: string
          org_id: string
          phone?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["operator_status"]
          updated_at?: string
        }
        Update: {
          certified_for?: string[]
          created_at?: string
          id?: string
          license_no?: string
          name?: string
          org_id?: string
          phone?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["operator_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operators_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          auto_approve_attendance: boolean
          contact_email: string
          contact_phone: string
          created_at: string
          currency: string
          geofence_radius_m: number
          id: string
          industry: string
          join_code: string
          legal_name: string
          name: string
          overtime_after_hours: number
          require_check_in_photo: boolean
          require_gps_verification: boolean
          standard_shift_hours: number
          timezone: string
          updated_at: string
        }
        Insert: {
          auto_approve_attendance?: boolean
          contact_email?: string
          contact_phone?: string
          created_at?: string
          currency?: string
          geofence_radius_m?: number
          id?: string
          industry?: string
          join_code?: string
          legal_name?: string
          name: string
          overtime_after_hours?: number
          require_check_in_photo?: boolean
          require_gps_verification?: boolean
          standard_shift_hours?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          auto_approve_attendance?: boolean
          contact_email?: string
          contact_phone?: string
          created_at?: string
          currency?: string
          geofence_radius_m?: number
          id?: string
          industry?: string
          join_code?: string
          legal_name?: string
          name?: string
          overtime_after_hours?: number
          require_check_in_photo?: boolean
          require_gps_verification?: boolean
          standard_shift_hours?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          language: string
          org_id: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          language?: string
          org_id: string
          phone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          language?: string
          org_id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          incharge_id: string | null
          machine_id: string | null
          note: string
          org_id: string
          shift_type: Database["public"]["Enums"]["shift_type"]
          site_id: string
          start_time: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string
          id?: string
          incharge_id?: string | null
          machine_id?: string | null
          note?: string
          org_id: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          site_id: string
          start_time?: string
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          incharge_id?: string | null
          machine_id?: string | null
          note?: string
          org_id?: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          site_id?: string
          start_time?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_incharge_id_fkey"
            columns: ["incharge_id"]
            isOneToOne: false
            referencedRelation: "incharges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_photos: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["photo_kind"]
          org_id: string
          shift_id: string
          source: string
          storage_path: string
          taken_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["photo_kind"]
          org_id: string
          shift_id: string
          source?: string
          storage_path: string
          taken_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["photo_kind"]
          org_id?: string
          shift_id?: string
          source?: string
          storage_path?: string
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_photos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_photos_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number
          created_at: string
          created_by: string | null
          ended_at: string | null
          gps_accuracy_m: number | null
          gps_checked_at: string | null
          gps_distance_m: number | null
          gps_lat: number | null
          gps_lng: number | null
          gps_method: string | null
          gps_verified: boolean | null
          id: string
          incharge_id: string | null
          machine_id: string | null
          notes: string
          operator_id: string | null
          org_id: string
          shift_type: Database["public"]["Enums"]["shift_type"]
          site_id: string
          started_at: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          break_minutes?: number
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          gps_accuracy_m?: number | null
          gps_checked_at?: string | null
          gps_distance_m?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          gps_method?: string | null
          gps_verified?: boolean | null
          id?: string
          incharge_id?: string | null
          machine_id?: string | null
          notes?: string
          operator_id?: string | null
          org_id: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          site_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          break_minutes?: number
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          gps_accuracy_m?: number | null
          gps_checked_at?: string | null
          gps_distance_m?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          gps_method?: string | null
          gps_verified?: boolean | null
          id?: string
          incharge_id?: string | null
          machine_id?: string | null
          notes?: string
          operator_id?: string | null
          org_id?: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          site_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_incharge_id_fkey"
            columns: ["incharge_id"]
            isOneToOne: false
            referencedRelation: "incharges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string
          city: string
          code: string
          created_at: string
          geofence_radius_m: number
          headcount_target: number
          id: string
          lat: number | null
          lng: number | null
          name: string
          org_id: string
          status: Database["public"]["Enums"]["site_status"]
          updated_at: string
        }
        Insert: {
          address?: string
          city?: string
          code: string
          created_at?: string
          geofence_radius_m?: number
          headcount_target?: number
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          org_id: string
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          code?: string
          created_at?: string
          geofence_radius_m?: number
          headcount_target?: number
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          org_id?: string
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          created_at: string
          daily_wage: number
          designation: string
          employee_code: string
          id: string
          joined_at: string
          name: string
          name_ta: string | null
          org_id: string
          phone: string
          rating: number
          site_id: string | null
          skills: string[]
          status: Database["public"]["Enums"]["worker_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          daily_wage?: number
          designation?: string
          employee_code: string
          id?: string
          joined_at?: string
          name: string
          name_ta?: string | null
          org_id: string
          phone?: string
          rating?: number
          site_id?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["worker_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          daily_wage?: number
          designation?: string
          employee_code?: string
          id?: string
          joined_at?: string
          name?: string
          name_ta?: string | null
          org_id?: string
          phone?: string
          rating?: number
          site_id?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["worker_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_organization: {
        Args: { _full_name: string; _org_name: string; _phone: string }
        Returns: string
      }
      current_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: never; Returns: boolean }
      join_organization: {
        Args: {
          _employee_code: string
          _full_name: string
          _join_code: string
          _phone: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff"
      machine_status: "available" | "in_use" | "maintenance"
      notification_kind: "shift" | "attendance" | "safety" | "system"
      operator_status: "available" | "assigned" | "off_duty"
      photo_kind: "check_in" | "check_out"
      shift_status: "active" | "completed" | "cancelled"
      shift_type: "day" | "night"
      site_status: "active" | "paused" | "closed"
      worker_status: "active" | "inactive" | "on_leave"
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
      app_role: ["admin", "manager", "staff"],
      machine_status: ["available", "in_use", "maintenance"],
      notification_kind: ["shift", "attendance", "safety", "system"],
      operator_status: ["available", "assigned", "off_duty"],
      photo_kind: ["check_in", "check_out"],
      shift_status: ["active", "completed", "cancelled"],
      shift_type: ["day", "night"],
      site_status: ["active", "paused", "closed"],
      worker_status: ["active", "inactive", "on_leave"],
    },
  },
} as const
