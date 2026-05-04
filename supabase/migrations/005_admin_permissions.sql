CREATE TABLE admin_permissions (
  admin_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_manage_strings BOOLEAN DEFAULT false,
  can_manage_demo_rackets BOOLEAN DEFAULT false,
  can_manage_bookings BOOLEAN DEFAULT false,
  can_ban_users BOOLEAN DEFAULT false,
  can_manage_products BOOLEAN DEFAULT false,
  can_manage_orders BOOLEAN DEFAULT false,
  can_post_notice BOOLEAN DEFAULT false,
  can_toggle_app_menu BOOLEAN DEFAULT false,
  can_manage_admins BOOLEAN DEFAULT false
);

ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_perm_super" ON admin_permissions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ));

CREATE POLICY "admin_perm_own_read" ON admin_permissions
  FOR SELECT
  USING (auth.uid() = admin_id);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_read_all" ON app_settings
  FOR SELECT
  USING (true);

CREATE POLICY "app_settings_super_write" ON app_settings
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ));
