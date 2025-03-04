export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      daily_logs: {
        Row: {
          booked_calls: number
          booked_presentations: number
          cold_calls: number | null
          cold_emails: number | null
          completed_calls: number
          completed_presentations: number
          created_at: string | null
          date: string
          deal_value: number
          deals_won: number
          facebook_dms: number | null
          id: string
          instagram_dms: number | null
          linkedin_dms: number | null
          quotes: number
          submitted_applications: number
          team_id: string | null
          text_messages: number | null
          user_id: string | null
        }
        Insert: {
          booked_calls?: number
          booked_presentations?: number
          cold_calls?: number | null
          cold_emails?: number | null
          completed_calls?: number
          completed_presentations?: number
          created_at?: string | null
          date: string
          deal_value?: number
          deals_won?: number
          facebook_dms?: number | null
          id?: string
          instagram_dms?: number | null
          linkedin_dms?: number | null
          quotes?: number
          submitted_applications?: number
          team_id?: string | null
          text_messages?: number | null
          user_id?: string | null
        }
        Update: {
          booked_calls?: number
          booked_presentations?: number
          cold_calls?: number | null
          cold_emails?: number | null
          completed_calls?: number
          completed_presentations?: number
          created_at?: string | null
          date?: string
          deal_value?: number
          deals_won?: number
          facebook_dms?: number | null
          id?: string
          instagram_dms?: number | null
          linkedin_dms?: number | null
          quotes?: number
          submitted_applications?: number
          team_id?: string | null
          text_messages?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          email: string
          id: string
          name: string
          role: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          email: string
          id?: string
          name: string
          role?: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          name?: string
          role?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          name: string
          team_members: string[]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          team_members?: string[]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          team_members?: string[]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_team_member: {
        Args: {
          p_team_id: string
          p_member_email: string
        }
        Returns: boolean
      }
      create_team_with_owner: {
        Args: {
          team_name: string
          owner_email: string
        }
        Returns: Json
      }
      get_team_daily_logs: {
        Args: {
          p_team_id: string
          p_start_date: string
          p_end_date: string
          p_user_id?: string
        }
        Returns: {
          date: string
          user_id: string
          team_id: string
          cold_calls: number
          text_messages: number
          facebook_dms: number
          linkedin_dms: number
          instagram_dms: number
          cold_emails: number
          created_at: string
        }[]
      }
      get_team_data: {
        Args: {
          p_user_id: string
        }
        Returns: {
          team_id: string
          team_name: string
          team_created_at: string
          member_id: string
          member_name: string
          member_email: string
          member_role: string
        }[]
      }
      get_team_member_logs: {
        Args: {
          p_team_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          date: string
          activities: number
          cold_calls: number
          text_messages: number
          facebook_dms: number
          linkedin_dms: number
          instagram_dms: number
          cold_emails: number
          member_data: Json
        }[]
      }
      get_team_members: {
        Args: {
          p_team_id: string
        }
        Returns: {
          email: string
          is_owner: boolean
        }[]
      }
      get_user_team: {
        Args: Record<PropertyKey, never>
        Returns: {
          team_id: string
          team_name: string
          team_created_at: string
          user_id: string
          team_members: string[]
        }[]
      }
      is_team_member: {
        Args: {
          p_team_id: string
        }
        Returns: boolean
      }
      remove_team_member: {
        Args: {
          p_team_id: string
          p_member_email: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
