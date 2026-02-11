/*
  # Add admin_update_user_role SECURITY DEFINER function

  1. New Functions
    - `admin_update_user_role(target_user_id uuid, new_role text, new_is_admin boolean)`
      - Only allows admins to update `role` and `is_admin` columns on profiles
      - Uses SECURITY DEFINER to bypass RLS for the targeted update
      - Validates caller is an admin via the existing `is_admin()` helper
      - Inserts an audit log entry for the change
      - Returns the updated profile row as JSON

  2. Security
    - Function is SECURITY DEFINER but validates admin status before any mutation
    - Only touches `role` and `is_admin` columns, preventing admin abuse of other profile fields
    - Audit trail is created automatically
*/

CREATE OR REPLACE FUNCTION admin_update_user_role(
  target_user_id uuid,
  new_role text,
  new_is_admin boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  updated_profile profiles%ROWTYPE;
  previous_role text;
  previous_is_admin boolean;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  IF caller_id = target_user_id THEN
    RAISE EXCEPTION 'Admins cannot change their own role';
  END IF;

  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: must be user or admin';
  END IF;

  SELECT role, is_admin INTO previous_role, previous_is_admin
  FROM profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  UPDATE profiles
  SET role = new_role, is_admin = new_is_admin
  WHERE id = target_user_id
  RETURNING * INTO updated_profile;

  INSERT INTO admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (
    caller_id,
    CASE WHEN new_is_admin THEN 'promote_to_admin' ELSE 'demote_from_admin' END,
    target_user_id,
    jsonb_build_object(
      'previous_role', previous_role,
      'new_role', new_role,
      'previous_is_admin', previous_is_admin,
      'new_is_admin', new_is_admin
    )
  );

  RETURN row_to_json(updated_profile);
END;
$$;
