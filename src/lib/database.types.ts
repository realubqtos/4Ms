export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Domain = 'mind' | 'matter' | 'motion' | 'mathematics'
export type FigureType = 'methodology' | 'statistical' | 'conceptual' | 'data_visualization'
export type Theme = 'dawn' | 'day' | 'dusk' | 'night'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          theme_preference: Theme
          primary_domain: Domain | null
          role: string
          is_admin: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          theme_preference?: Theme
          primary_domain?: Domain | null
          role?: string
          is_admin?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          theme_preference?: Theme
          primary_domain?: Domain | null
          role?: string
          is_admin?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          primary_domain: Domain
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          primary_domain: Domain
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          primary_domain?: Domain
          created_at?: string
          updated_at?: string
        }
      }
      figures: {
        Row: {
          id: string
          project_id: string
          user_id: string
          type: FigureType
          prompt: string
          domain: Domain
          file_url: string | null
          thumbnail_url: string | null
          parameters: Json
          iteration_count: number
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          type: FigureType
          prompt: string
          domain: Domain
          file_url?: string | null
          thumbnail_url?: string | null
          parameters?: Json
          iteration_count?: number
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          type?: FigureType
          prompt?: string
          domain?: Domain
          file_url?: string | null
          thumbnail_url?: string | null
          parameters?: Json
          iteration_count?: number
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          figure_id: string
          iteration: number
          prompt: string
          parameters: Json
          file_url: string | null
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          figure_id: string
          iteration: number
          prompt: string
          parameters?: Json
          file_url?: string | null
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          figure_id?: string
          iteration?: number
          prompt?: string
          parameters?: Json
          file_url?: string | null
          feedback?: string | null
          created_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          domain: Domain | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          domain?: Domain | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          domain?: Domain | null
          created_at?: string
          updated_at?: string
        }
      }
      collection_figures: {
        Row: {
          collection_id: string
          figure_id: string
          created_at: string
        }
        Insert: {
          collection_id: string
          figure_id: string
          created_at?: string
        }
        Update: {
          collection_id?: string
          figure_id?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          domain: Domain | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: Domain | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: Domain | null
          created_at?: string
        }
      }
      figure_tags: {
        Row: {
          figure_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          figure_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          figure_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          figure_id: string | null
          messages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          figure_id?: string | null
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          figure_id?: string | null
          messages?: Json
          created_at?: string
          updated_at?: string
        }
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_user_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_user_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_user_id?: string | null
          details?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      domain: Domain
      figure_type: FigureType
      theme: Theme
    }
  }
}
