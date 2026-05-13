DROP POLICY IF EXISTS "app_settings_super_write" ON app_settings;
DROP POLICY IF EXISTS "app_settings_super_insert" ON app_settings;
DROP POLICY IF EXISTS "app_settings_super_update" ON app_settings;
DROP POLICY IF EXISTS "app_settings_super_delete" ON app_settings;

CREATE POLICY "app_settings_super_insert" ON app_settings
  FOR INSERT
  WITH CHECK (has_super_admin_role(auth.uid()));

CREATE POLICY "app_settings_super_update" ON app_settings
  FOR UPDATE
  USING (has_super_admin_role(auth.uid()))
  WITH CHECK (has_super_admin_role(auth.uid()));

CREATE POLICY "app_settings_super_delete" ON app_settings
  FOR DELETE
  USING (has_super_admin_role(auth.uid()));
