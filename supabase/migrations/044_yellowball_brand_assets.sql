INSERT INTO app_content_blocks (key, payload, description, is_active)
VALUES (
  'brand_assets',
  '{
    "logo_path": "brand/yellowball-logo.png",
    "login_logo_path": "brand/yellowball-logo-transparent.png",
    "app_icon_path": "brand/yellowball-logo.png",
    "adaptive_icon_path": "brand/yellowball-adaptive-icon.png",
    "splash_icon_path": "brand/yellowball-splash-icon.png"
  }'::jsonb,
  'YellowBall brand image asset paths stored in app-assets',
  true
)
ON CONFLICT (key) DO UPDATE
SET payload = EXCLUDED.payload,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = now();
