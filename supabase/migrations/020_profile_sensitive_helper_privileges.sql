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
