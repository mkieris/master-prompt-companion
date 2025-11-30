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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      competitor_analyses: {
        Row: {
          best_practices: Json | null
          call_to_actions: string[] | null
          content_length: number | null
          content_strategy: string | null
          crawl_status: string
          crawled_at: string | null
          created_at: string
          domain: string
          faq_patterns: Json | null
          heading_structure: Json | null
          id: string
          main_keywords: string[] | null
          meta_description: string | null
          organization_id: string
          page_title: string | null
          raw_content: string | null
          secondary_keywords: string[] | null
          strengths: string[] | null
          tonality_analysis: string | null
          updated_at: string
          url: string
          usp_patterns: string[] | null
          weaknesses: string[] | null
          word_count: number | null
        }
        Insert: {
          best_practices?: Json | null
          call_to_actions?: string[] | null
          content_length?: number | null
          content_strategy?: string | null
          crawl_status?: string
          crawled_at?: string | null
          created_at?: string
          domain: string
          faq_patterns?: Json | null
          heading_structure?: Json | null
          id?: string
          main_keywords?: string[] | null
          meta_description?: string | null
          organization_id: string
          page_title?: string | null
          raw_content?: string | null
          secondary_keywords?: string[] | null
          strengths?: string[] | null
          tonality_analysis?: string | null
          updated_at?: string
          url: string
          usp_patterns?: string[] | null
          weaknesses?: string[] | null
          word_count?: number | null
        }
        Update: {
          best_practices?: Json | null
          call_to_actions?: string[] | null
          content_length?: number | null
          content_strategy?: string | null
          crawl_status?: string
          crawled_at?: string | null
          created_at?: string
          domain?: string
          faq_patterns?: Json | null
          heading_structure?: Json | null
          id?: string
          main_keywords?: string[] | null
          meta_description?: string | null
          organization_id?: string
          page_title?: string | null
          raw_content?: string | null
          secondary_keywords?: string[] | null
          strengths?: string[] | null
          tonality_analysis?: string | null
          updated_at?: string
          url?: string
          usp_patterns?: string[] | null
          weaknesses?: string[] | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_plans: {
        Row: {
          ai_suggestions: Json | null
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          organization_id: string
          page_type: string | null
          planned_date: string | null
          priority: string | null
          published_date: string | null
          status: string
          target_keyword: string | null
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          ai_suggestions?: Json | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          page_type?: string | null
          planned_date?: string | null
          priority?: string | null
          published_date?: string | null
          status?: string
          target_keyword?: string | null
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          ai_suggestions?: Json | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          page_type?: string | null
          planned_date?: string | null
          priority?: string | null
          published_date?: string | null
          status?: string
          target_keyword?: string | null
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          focus_keyword: string
          folder: string | null
          form_data: Json
          generated_content: Json | null
          id: string
          organization_id: string
          page_type: string
          seo_score: number | null
          status: string
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          focus_keyword: string
          folder?: string | null
          form_data?: Json
          generated_content?: Json | null
          id?: string
          organization_id: string
          page_type: string
          seo_score?: number | null
          status?: string
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          focus_keyword?: string
          folder?: string | null
          form_data?: Json
          generated_content?: Json | null
          id?: string
          organization_id?: string
          page_type?: string
          seo_score?: number | null
          status?: string
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_versions: {
        Row: {
          change_notes: string | null
          created_at: string
          created_by: string
          form_data: Json
          generated_content: Json
          id: string
          project_id: string
          seo_score: number | null
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string
          created_by: string
          form_data: Json
          generated_content: Json
          id?: string
          project_id: string
          seo_score?: number | null
          version_number?: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string
          created_by?: string
          form_data?: Json
          generated_content?: Json
          id?: string
          project_id?: string
          seo_score?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_knowledge: {
        Row: {
          ai_summary: string | null
          brand_voice: string | null
          company_description: string | null
          company_name: string | null
          competitors: Json | null
          crawl_data: Json | null
          crawl_status: string
          crawled_at: string | null
          created_at: string
          id: string
          industry: string | null
          keywords: Json | null
          main_products_services: Json | null
          organization_id: string
          pages_crawled: number | null
          target_audience: string | null
          total_pages: number | null
          unique_selling_points: Json | null
          updated_at: string
          website_url: string
        }
        Insert: {
          ai_summary?: string | null
          brand_voice?: string | null
          company_description?: string | null
          company_name?: string | null
          competitors?: Json | null
          crawl_data?: Json | null
          crawl_status?: string
          crawled_at?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          keywords?: Json | null
          main_products_services?: Json | null
          organization_id: string
          pages_crawled?: number | null
          target_audience?: string | null
          total_pages?: number | null
          unique_selling_points?: Json | null
          updated_at?: string
          website_url: string
        }
        Update: {
          ai_summary?: string | null
          brand_voice?: string | null
          company_description?: string | null
          company_name?: string | null
          competitors?: Json | null
          crawl_data?: Json | null
          crawl_status?: string
          crawled_at?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          keywords?: Json | null
          main_products_services?: Json | null
          organization_id?: string
          pages_crawled?: number | null
          target_audience?: string | null
          total_pages?: number | null
          unique_selling_points?: Json | null
          updated_at?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_knowledge_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_organization_id: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_organization_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_organization_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_projects: {
        Row: {
          created_at: string
          focus_keyword: string
          form_data: Json
          generated_content: Json | null
          id: string
          page_type: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          focus_keyword: string
          form_data?: Json
          generated_content?: Json | null
          id?: string
          page_type: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          focus_keyword?: string
          form_data?: Json
          generated_content?: Json | null
          id?: string
          page_type?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer"
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
      app_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
