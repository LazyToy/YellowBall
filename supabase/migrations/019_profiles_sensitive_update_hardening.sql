REVOKE UPDATE ON TABLE profiles FROM anon, authenticated;
GRANT UPDATE (nickname, phone, updated_at) ON TABLE profiles TO authenticated;

CREATE OR REPLACE FUNCTION allow_profile_sensitive_update()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT set_config('app.profile_sensitive_update_allowed', 'on', true);
$$;

CREATE OR REPLACE FUNCTION prevent_direct_profile_sensitive_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.profile_sensitive_update_allowed', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.id
    AND (
      NEW.role IS DISTINCT FROM OLD.role
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.expo_push_token IS DISTINCT FROM OLD.expo_push_token
    )
  THEN
    RAISE EXCEPTION 'profiles.role, profiles.status, and profiles.expo_push_token must be changed through approved RPCs'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_direct_profile_sensitive_update_trigger
  ON profiles;

CREATE TRIGGER prevent_direct_profile_sensitive_update_trigger
  BEFORE UPDATE OF role, status, expo_push_token ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_direct_profile_sensitive_update();

CREATE OR REPLACE FUNCTION request_profile_account_deletion(p_user_id UUID)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Only the profile owner can request account deletion'
      USING ERRCODE = '42501';
  END IF;

  PERFORM allow_profile_sensitive_update();

  UPDATE profiles
  SET status = 'deleted_pending',
      updated_at = now()
  WHERE id = p_user_id
    AND role <> 'super_admin'
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile cannot request account deletion'
      USING ERRCODE = '42501';
  END IF;

  RETURN updated_profile;
END;
$$;

CREATE OR REPLACE FUNCTION update_profile_push_token(
  p_user_id UUID,
  p_expo_push_token TEXT
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Only the profile owner can update a push token'
      USING ERRCODE = '42501';
  END IF;

  PERFORM allow_profile_sensitive_update();

  UPDATE profiles
  SET expo_push_token = p_expo_push_token,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN updated_profile;
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_profile_role(
  p_actor_id UUID,
  p_target_id UUID,
  p_role TEXT
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_actor_id THEN
    RAISE EXCEPTION 'Administrator actor mismatch'
      USING ERRCODE = '42501';
  END IF;

  IF NOT has_super_admin_role(p_actor_id) THEN
    RAISE EXCEPTION 'Only super administrators can change profile roles'
      USING ERRCODE = '42501';
  END IF;

  IF p_actor_id = p_target_id THEN
    RAISE EXCEPTION 'Administrators cannot change their own role'
      USING ERRCODE = '42501';
  END IF;

  IF p_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Unsupported profile role'
      USING ERRCODE = '23514';
  END IF;

  PERFORM allow_profile_sensitive_update();

  UPDATE profiles
  SET role = p_role,
      updated_at = now()
  WHERE id = p_target_id
    AND role <> 'super_admin'
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile role cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  RETURN updated_profile;
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_profile_status(
  p_actor_id UUID,
  p_target_id UUID,
  p_status TEXT
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_actor_id THEN
    RAISE EXCEPTION 'Administrator actor mismatch'
      USING ERRCODE = '42501';
  END IF;

  IF p_actor_id = p_target_id THEN
    RAISE EXCEPTION 'Administrators cannot change their own status'
      USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Unsupported profile status'
      USING ERRCODE = '23514';
  END IF;

  IF NOT (
    has_super_admin_role(p_actor_id)
    OR EXISTS (
      SELECT 1
      FROM profiles
      JOIN admin_permissions
        ON admin_permissions.admin_id = profiles.id
      WHERE profiles.id = p_actor_id
        AND profiles.role = 'admin'
        AND profiles.status = 'active'
        AND admin_permissions.can_ban_users = true
    )
  ) THEN
    RAISE EXCEPTION 'User suspension permission is required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM allow_profile_sensitive_update();

  UPDATE profiles
  SET status = p_status,
      updated_at = now()
  WHERE id = p_target_id
    AND role <> 'super_admin'
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile status cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  RETURN updated_profile;
END;
$$;

REVOKE ALL ON FUNCTION allow_profile_sensitive_update()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION prevent_direct_profile_sensitive_update()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION request_profile_account_deletion(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION update_profile_push_token(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION admin_set_profile_role(UUID, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION admin_set_profile_status(UUID, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION request_profile_account_deletion(UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_push_token(UUID, TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_profile_role(UUID, UUID, TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_profile_status(UUID, UUID, TEXT)
  TO authenticated;
