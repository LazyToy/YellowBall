INSERT INTO app_content_blocks (key, payload, description, is_active)
VALUES (
  'brand_assets',
  '{
    "logo_path": "brand/icon.png",
    "login_logo_path": "brand/icon.png",
    "app_icon_path": "brand/icon.png",
    "adaptive_icon_path": "brand/adaptive-icon.png",
    "splash_icon_path": "brand/splash-icon.png"
  }'::jsonb,
  'Brand image asset paths stored in app-assets',
  true
)
ON CONFLICT (key) DO UPDATE
SET payload = EXCLUDED.payload,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = now();
