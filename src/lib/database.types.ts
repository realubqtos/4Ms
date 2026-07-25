/**
 * Supabase-generated types — minimal stub.
 *
 * Replace with the real generated file once the Supabase project
 * is set up:  npx supabase gen types typescript --project-id <id>
 */
export type Database = {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          is_admin: boolean;
          last_login_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          full_name?: string | null;
          role?: string;
          is_admin?: boolean;
          last_login_at?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          role?: string;
          is_admin?: boolean;
          last_login_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          primary_domain: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          description?: string | null;
          primary_domain?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          primary_domain?: string;
        };
        Relationships: [];
      };
      figures: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string | null;
          prompt: string;
          domain: string;
          type: string;
          image_url: string | null;
          svg_data: string | null;
          is_favorite: boolean;
          engine: string | null;
          provenance: Record<string, unknown> | null;
          iteration_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          prompt: string;
          project_id?: string | null;
          title?: string | null;
          domain?: string;
          type?: string;
          image_url?: string | null;
          svg_data?: string | null;
          is_favorite?: boolean;
          engine?: string | null;
          provenance?: Record<string, unknown> | null;
          iteration_count?: number;
        };
        Update: {
          title?: string | null;
          is_favorite?: boolean;
          image_url?: string | null;
          svg_data?: string | null;
          engine?: string | null;
          provenance?: Record<string, unknown> | null;
          iteration_count?: number;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_user_id: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          admin_id: string;
          action: string;
          target_user_id?: string | null;
          details?: Record<string, unknown> | null;
        };
        Update: {
          action?: string;
          target_user_id?: string | null;
          details?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
    };
  };
};
