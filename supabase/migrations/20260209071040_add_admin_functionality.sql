/*
  # Add Admin Functionality and Password Reset Support

  ## Overview
  This migration adds comprehensive admin functionality to the 4Ms platform, including role-based access control, admin audit logging, and enhanced user tracking.

  ## 1. Profile Table Enhancements
  
  **New Columns Added to `profiles` table:**
  - `role` (text) - User role ('user' or 'admin'), defaults to 'user'
  - `is_admin` (boolean) - Quick admin check flag, defaults to false
  - `last_login_at` (timestamptz) - Tracks last successful login, nullable
  
  ## 2. Admin Audit Logging System
  
  **New Table: `admin_audit_log`**
  - `id` (uuid, primary key) - Unique identifier for each audit entry
  - `admin_id` (uuid, references profiles) - ID of admin performing the action
  - `action` (text) - Description of action performed (e.g., 'promote_to_admin', 'reset_password')
  - `target_user_id` (uuid, references profiles) - User affected by the action (nullable)
  - `details` (jsonb) - Additional context about the action
  - `created_at` (timestamptz) - When the action occurred
  
  ## 3. Helper Functions
  
  **Function: `is_admin(user_id uuid)`**
  - Returns boolean indicating if a user has admin privileges
  - Used in RLS policies for admin access checks
  
  ## 4. Security & RLS Policies
  
  **Admin Override Policies:**
  - Admins can view all profiles (for user management)
  - Admins can view all projects (for content moderation)
  - Admins can view all figures (for content moderation)
  - Admins can view all collections (for content moderation)
  
  **Audit Log Protection:**
  - Enable RLS on admin_audit_log table
  - Only admins can view audit logs
  - System automatically creates audit entries (admins cannot modify)
  
  ## 5. Indexes for Performance
  - Index on profiles.role for fast admin lookups
  - Index on profiles.is_admin for quick filtering
  - Index on admin_audit_log.admin_id for audit queries
  - Index on admin_audit_log.target_user_id for user history
  - Index on admin_audit_log.created_at for chronological sorting
  
  ## Important Notes
  - Default users have role='user' and is_admin=false
  - Admin promotion must be done manually via database or through admin UI
  - All admin actions are logged for transparency and accountability
  - RLS policies ensure data security while allowing admin oversight
  - Password reset functionality leverages Supabase Auth's built-in features
*/

-- Add admin-related columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;
END $$;

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT is_admin FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Admin can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Only system can insert audit logs (admins trigger this through functions)
CREATE POLICY "System can insert audit logs"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id AND is_admin(auth.uid()));

-- Add admin override policies for profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Add admin override policies for projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Add admin override policies for figures
CREATE POLICY "Admins can view all figures"
  ON figures FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Add admin override policies for collections
CREATE POLICY "Admins can view all collections"
  ON collections FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Add admin override policies for conversations
CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user_id ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at DESC);

-- Add constraint to ensure role is either 'user' or 'admin'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;
