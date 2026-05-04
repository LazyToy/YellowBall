CREATE POLICY "string_catalog_public_active_read" ON string_catalog
  FOR SELECT
  USING (is_active = true);

CREATE INDEX string_catalog_active_gauge_idx ON string_catalog(is_active, gauge);
CREATE INDEX string_catalog_active_recommended_style_idx
  ON string_catalog(is_active, recommended_style);
