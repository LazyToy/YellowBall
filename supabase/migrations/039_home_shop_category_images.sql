INSERT INTO app_content_blocks (key, payload, description, is_active)
VALUES (
  'home_categories',
  '[
    {"id":"tennis-rackets","label":"테니스라켓","image_path":"seed/wilson-pro-staff.png","route":"/shop"},
    {"id":"pickleball-rackets","label":"피클볼라켓","image_path":"seed/selkirk-vanguard.png","route":"/shop"},
    {"id":"strings","label":"스트링","image_path":"seed/luxilon-alu-power.png","route":"/shop"},
    {"id":"shoes","label":"신발","image_path":"seed/asics-court-ff.png","route":"/shop"}
  ]'::jsonb,
  'Home shop categories with DB-backed image cards',
  true
)
ON CONFLICT (key) DO UPDATE
SET payload = EXCLUDED.payload,
    description = EXCLUDED.description,
    is_active = true,
    updated_at = now();
