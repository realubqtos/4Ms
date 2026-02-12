export type VisualizationType = 'processes' | 'structural' | 'statistical' | 'educational';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          theme_preference: string;
          primary_domain: string | null;
          created_at: string;
          updated_at: string;
          role: 'user' | 'admin';
          is_admin: boolean;
          last_login_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          theme_preference?: string;
          primary_domain?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: 'user' | 'admin';
          is_admin?: boolean;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          theme_preference?: string;
          primary_domain?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: 'user' | 'admin';
          is_admin?: boolean;
          last_login_at?: string | null;
        };
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
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          primary_domain: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          primary_domain?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      figures: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: string;
          prompt: string;
          domain: string;
          file_url: string | null;
          thumbnail_url: string | null;
          parameters: Record<string, unknown>;
          iteration_count: number;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
          diagram_data: Record<string, unknown> | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          type: string;
          prompt: string;
          domain: string;
          file_url?: string | null;
          thumbnail_url?: string | null;
          parameters?: Record<string, unknown>;
          iteration_count?: number;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
          diagram_data?: Record<string, unknown> | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          type?: string;
          prompt?: string;
          domain?: string;
          file_url?: string | null;
          thumbnail_url?: string | null;
          parameters?: Record<string, unknown>;
          iteration_count?: number;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
          diagram_data?: Record<string, unknown> | null;
          status?: string | null;
        };
      };
      generations: {
        Row: {
          id: string;
          figure_id: string;
          iteration: number;
          prompt: string;
          parameters: Record<string, unknown>;
          file_url: string | null;
          feedback: string | null;
          created_at: string;
          agent_feedback: string | null;
          changes_made: string | null;
          diagram_data: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          figure_id: string;
          iteration: number;
          prompt: string;
          parameters?: Record<string, unknown>;
          file_url?: string | null;
          feedback?: string | null;
          created_at?: string;
          agent_feedback?: string | null;
          changes_made?: string | null;
          diagram_data?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          figure_id?: string;
          iteration?: number;
          prompt?: string;
          parameters?: Record<string, unknown>;
          file_url?: string | null;
          feedback?: string | null;
          created_at?: string;
          agent_feedback?: string | null;
          changes_made?: string | null;
          diagram_data?: Record<string, unknown> | null;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          domain: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          figure_id: string | null;
          messages: unknown[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          figure_id?: string | null;
          messages?: unknown[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          figure_id?: string | null;
          messages?: unknown[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
