INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('app-assets', 'app-assets', true, 1048576, ARRAY['image/png'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    updated_at = now();

DROP POLICY IF EXISTS "app_assets_public_read" ON storage.objects;
CREATE POLICY "app_assets_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'app-assets');

GRANT EXECUTE ON FUNCTION public.has_booking_manager_role(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_demo_racket_manager_role(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_string_manager_role(uuid) TO anon, authenticated;

WITH mapped AS (
  SELECT
    b.key,
    jsonb_agg(
      CASE item.value ->> 'id'
        WHEN 'prod-wilson-rf97-v14' THEN item.value || jsonb_build_object('image_path', 'seed/wilson-pro-staff.png')
        WHEN 'prod-babolat-pure-aero-2024' THEN item.value || jsonb_build_object('image_path', 'seed/babolat-pure-aero.png')
        WHEN 'prod-luxilon-alu-power-125' THEN item.value || jsonb_build_object('image_path', 'seed/luxilon-alu-power.png')
        WHEN 'prod-selkirk-vanguard-power' THEN item.value || jsonb_build_object('image_path', 'seed/selkirk-vanguard.png')
        WHEN 'prod-asics-court-ff-3' THEN item.value || jsonb_build_object('image_path', 'seed/asics-court-ff.png')
        WHEN 'prod-wilson-tour-9-pack' THEN item.value || jsonb_build_object('image_path', 'seed/wilson-tour-bag.png')
        ELSE item.value
      END
      ORDER BY item.ordinality
    ) AS payload
  FROM app_content_blocks b
  CROSS JOIN LATERAL jsonb_array_elements(b.payload) WITH ORDINALITY AS item(value, ordinality)
  WHERE b.key = 'shop_products'
  GROUP BY b.key
)
UPDATE app_content_blocks b
SET payload = mapped.payload,
    updated_at = now()
FROM mapped
WHERE b.key = mapped.key;

UPDATE app_content_blocks
SET payload = payload || jsonb_build_object('image_path', 'seed/sale-banner.png'),
    updated_at = now()
WHERE key = 'shop_sale_banner';

WITH mapped AS (
  SELECT
    b.key,
    jsonb_agg(
      CASE
        WHEN item.value ->> 'model' ILIKE '%Blade%' THEN item.value || jsonb_build_object('image_path', 'seed/blade-98.png')
        WHEN item.value ->> 'model' ILIKE '%Pure Aero%' THEN item.value || jsonb_build_object('image_path', 'seed/babolat-pure-aero.png')
        ELSE item.value
      END
      ORDER BY item.ordinality
    ) AS payload
  FROM app_content_blocks b
  CROSS JOIN LATERAL jsonb_array_elements(b.payload) WITH ORDINALITY AS item(value, ordinality)
  WHERE b.key = 'home_rackets'
  GROUP BY b.key
)
UPDATE app_content_blocks b
SET payload = mapped.payload,
    updated_at = now()
FROM mapped
WHERE b.key = mapped.key;

WITH mapped AS (
  SELECT
    b.key,
    jsonb_agg(
      CASE
        WHEN item.value ->> 'name' ILIKE '%Wilson%' THEN item.value || jsonb_build_object('image_path', 'seed/wilson-pro-staff.png')
        WHEN item.value ->> 'name' ILIKE '%Babolat%' THEN item.value || jsonb_build_object('image_path', 'seed/babolat-pure-aero.png')
        ELSE item.value || jsonb_build_object('image_path', 'seed/profile-racket.png')
      END
      ORDER BY item.ordinality
    ) AS payload
  FROM app_content_blocks b
  CROSS JOIN LATERAL jsonb_array_elements(b.payload) WITH ORDINALITY AS item(value, ordinality)
  WHERE b.key = 'me_rackets'
  GROUP BY b.key
)
UPDATE app_content_blocks b
SET payload = mapped.payload,
    updated_at = now()
FROM mapped
WHERE b.key = mapped.key;

INSERT INTO string_catalog (
  brand,
  name,
  gauge,
  color,
  image_url,
  description,
  price,
  recommended_style,
  is_active
)
SELECT *
FROM (
  VALUES
    ('Solinco', 'Hyper-G', '1.25', 'Green', 'app-assets/seed/hyper-g.png', 'Spin-focused co-poly string.', 28000, 'spin', true),
    ('Luxilon', 'ALU Power', '1.25', 'Silver', 'app-assets/seed/luxilon-alu-power.png', 'Crisp control and power for advanced players.', 32000, 'control', true),
    ('Babolat', 'RPM Blast', '1.25', 'Black', 'app-assets/seed/babolat-pure-aero.png', 'Durable shaped polyester string.', 30000, 'spin', true)
) AS seed(brand, name, gauge, color, image_url, description, price, recommended_style, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM string_catalog s
  WHERE s.brand = seed.brand AND s.name = seed.name AND s.gauge = seed.gauge
);

UPDATE string_catalog
SET image_url = 'app-assets/seed/hyper-g.png',
    updated_at = now()
WHERE image_url IS NULL;

INSERT INTO demo_rackets (
  brand,
  model,
  grip_size,
  weight,
  head_size,
  photo_url,
  description,
  status,
  is_demo_enabled,
  is_active
)
SELECT *
FROM (
  VALUES
    ('Wilson', 'Blade 98 v9', '4 1/4', 305, '98 sq in', 'app-assets/seed/blade-98.png', 'Control-oriented demo racket.', 'active', true, true),
    ('Babolat', 'Pure Aero 2024', '4 1/4', 300, '100 sq in', 'app-assets/seed/babolat-pure-aero.png', 'Spin-friendly demo racket.', 'active', true, true)
) AS seed(brand, model, grip_size, weight, head_size, photo_url, description, status, is_demo_enabled, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM demo_rackets d
  WHERE d.brand = seed.brand AND d.model = seed.model
);
