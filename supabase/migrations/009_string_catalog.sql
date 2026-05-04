CREATE TABLE string_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  gauge TEXT,
  color TEXT,
  image_url TEXT,
  description TEXT,
  price INT CHECK (price IS NULL OR price >= 0),
  recommended_style TEXT,
  is_active BOOLEAN DEFAULT true,
  deactivation_reason TEXT,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE string_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "string_admin_all" ON string_catalog
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_permissions
      WHERE admin_id = auth.uid() AND can_manage_strings = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_permissions
      WHERE admin_id = auth.uid() AND can_manage_strings = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "string_admin_read" ON string_catalog
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE INDEX string_catalog_active_idx ON string_catalog(is_active);
CREATE INDEX string_catalog_brand_name_idx ON string_catalog(brand, name);

INSERT INTO storage.buckets (id, name, public)
VALUES ('string-photos', 'string-photos', true)
ON CONFLICT (id) DO NOTHING;
