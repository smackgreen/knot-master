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
      budget_categories: {
        Row: {
          allocated: number
          budget_id: string | null
          category: Database["public"]["Enums"]["vendor_category"]
          created_at: string | null
          id: string
          spent: number
        }
        Insert: {
          allocated?: number
          budget_id?: string | null
          category: Database["public"]["Enums"]["vendor_category"]
          created_at?: string | null
          id?: string
          spent?: number
        }
        Update: {
          allocated?: number
          budget_id?: string | null
          category?: Database["public"]["Enums"]["vendor_category"]
          created_at?: string | null
          id?: string
          spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          total_budget: number
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          total_budget: number
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          total_budget?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          partner_name: string
          phone: string | null
          status: Database["public"]["Enums"]["client_status"] | null
          user_id: string
          venue: string | null
          wedding_date: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          partner_name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          user_id: string
          venue?: string | null
          wedding_date?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          partner_name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          user_id?: string
          venue?: string | null
          wedding_date?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id?: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string | null
          due_date: string
          id: string
          issue_date: string
          notes: string | null
          number: string
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          tax: number
          total: number
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          issue_date: string
          notes?: string | null
          number: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          tax: number
          total: number
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          profile_image: string | null
          wedding_date: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          profile_image?: string | null
          wedding_date?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          profile_image?: string | null
          wedding_date?: string | null
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          quantity: number
          quotation_id: string | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          quantity: number
          quotation_id?: string | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          quantity?: number
          quotation_id?: string | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          issue_date: string
          notes: string | null
          number: string
          status: Database["public"]["Enums"]["quotation_status"] | null
          subtotal: number
          tax: number
          total: number
          user_id: string
          valid_until: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          issue_date: string
          notes?: string | null
          number: string
          status?: Database["public"]["Enums"]["quotation_status"] | null
          subtotal: number
          tax: number
          total: number
          user_id: string
          valid_until: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          status?: Database["public"]["Enums"]["quotation_status"] | null
          subtotal?: number
          tax?: number
          total?: number
          user_id?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: Database["public"]["Enums"]["vendor_category"] | null
          client_id: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["vendor_category"] | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["vendor_category"] | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: Database["public"]["Enums"]["vendor_category"]
          client_id: string | null
          contact_name: string | null
          cost: number | null
          created_at: string | null
          email: string | null
          id: string
          is_paid: boolean | null
          name: string
          notes: string | null
          phone: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["vendor_category"]
          client_id?: string | null
          contact_name?: string | null
          cost?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_paid?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["vendor_category"]
          client_id?: string | null
          contact_name?: string | null
          cost?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_paid?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string
          refresh_token: string | null
          token_type: string | null
          expires_at: string | null
          scope: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          access_token: string
          refresh_token?: string | null
          token_type?: string | null
          expires_at?: string | null
          scope?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string
          refresh_token?: string | null
          token_type?: string | null
          expires_at?: string | null
          scope?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_calendars: {
        Row: {
          id: string
          user_id: string
          provider: string
          calendar_id: string
          name: string
          description: string | null
          color: string | null
          is_selected: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          calendar_id: string
          name: string
          description?: string | null
          color?: string | null
          is_selected?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          calendar_id?: string
          name?: string
          description?: string | null
          color?: string | null
          is_selected?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connected_calendars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      client_status: "active" | "completed" | "cancelled"
      invoice_status: "draft" | "sent" | "paid" | "overdue"
      quotation_status: "draft" | "sent" | "accepted" | "rejected"
      task_priority: "low" | "medium" | "high"
      task_status: "not_started" | "in_progress" | "completed" | "overdue"
      vendor_category:
        | "venue"
        | "catering"
        | "photography"
        | "videography"
        | "florist"
        | "music"
        | "cake"
        | "attire"
        | "hair_makeup"
        | "transportation"
        | "rentals"
        | "stationery"
        | "gifts"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      client_status: ["active", "completed", "cancelled"],
      invoice_status: ["draft", "sent", "paid", "overdue"],
      quotation_status: ["draft", "sent", "accepted", "rejected"],
      task_priority: ["low", "medium", "high"],
      task_status: ["not_started", "in_progress", "completed", "overdue"],
      vendor_category: [
        "venue",
        "catering",
        "photography",
        "videography",
        "florist",
        "music",
        "cake",
        "attire",
        "hair_makeup",
        "transportation",
        "rentals",
        "stationery",
        "gifts",
        "other",
      ],
    },
  },
} as const
