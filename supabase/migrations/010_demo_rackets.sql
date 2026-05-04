CREATE TABLE demo_rackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  grip_size TEXT,
  weight INT,
  head_size TEXT,
  photo_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (
    status IN ('active', 'inactive', 'maintenance', 'damaged', 'sold', 'hidden')
  ),
  is_demo_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE demo_rackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_rackets_public_active_read" ON demo_rackets
  FOR SELECT
  USING (
    status = 'active'
    AND is_demo_enabled = true
    AND is_active = true
  );

CREATE POLICY "demo_rackets_admin_all" ON demo_rackets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_permissions
      WHERE admin_id = auth.uid() AND can_manage_demo_rackets = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_permissions
      WHERE admin_id = auth.uid() AND can_manage_demo_rackets = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE INDEX demo_rackets_status_idx ON demo_rackets(status, is_demo_enabled, is_active);

INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-racket-photos', 'demo-racket-photos', true)
ON CONFLICT (id) DO NOTHING;
