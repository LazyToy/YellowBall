CREATE TABLE IF NOT EXISTS shop_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_path TEXT,
  image_url TEXT,
  price INT NOT NULL CHECK (price >= 0),
  sale_price INT NOT NULL CHECK (sale_price >= 0),
  rating_average NUMERIC(2, 1) NOT NULL DEFAULT 0 CHECK (rating_average >= 0 AND rating_average <= 5),
  review_count INT NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  tag TEXT,
  tone TEXT NOT NULL DEFAULT 'card' CHECK (tone IN ('primary', 'accent', 'secondary', 'card')),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_products_public_active_read" ON shop_products;
CREATE POLICY "shop_products_public_active_read" ON shop_products
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "shop_products_admin_write" ON shop_products;
CREATE POLICY "shop_products_admin_write" ON shop_products
  FOR ALL
  USING (has_admin_role(auth.uid()))
  WITH CHECK (has_admin_role(auth.uid()));

CREATE INDEX IF NOT EXISTS shop_products_active_sort_idx
  ON shop_products(is_active, sort_order, created_at);
CREATE INDEX IF NOT EXISTS shop_products_category_idx
  ON shop_products(category);

INSERT INTO shop_products (
  id,
  name,
  category,
  image_path,
  price,
  sale_price,
  rating_average,
  review_count,
  tag,
  tone,
  stock_quantity,
  sort_order,
  is_active
)
VALUES
  ('prod-wilson-rf97-v14', 'Wilson Pro Staff RF97 v14', '라켓', 'seed/wilson-pro-staff.png', 389000, 329000, 4.9, 128, 'BEST', 'primary', 8, 10, true),
  ('prod-babolat-pure-aero-2024', 'Babolat Pure Aero 2024', '라켓', 'seed/babolat-pure-aero.png', 359000, 309000, 4.8, 96, '신상', 'accent', 6, 20, true),
  ('prod-luxilon-alu-power-125', 'Luxilon ALU Power 1.25', '스트링', 'seed/luxilon-alu-power.png', 32000, 28000, 4.9, 412, null, 'secondary', 24, 30, true),
  ('prod-selkirk-vanguard-power', 'Selkirk Vanguard Power', '피클볼', 'seed/selkirk-vanguard.png', 269000, 229000, 4.7, 64, 'HOT', 'card', 5, 40, true),
  ('prod-asics-court-ff-3', 'Asics Court FF 3', '신발', 'seed/asics-court-ff.png', 219000, 189000, 4.8, 72, null, 'accent', 10, 50, true),
  ('prod-wilson-tour-9-pack', 'Wilson Tour 9 Pack', '가방', 'seed/wilson-tour-bag.png', 159000, 139000, 4.7, 38, null, 'primary', 7, 60, true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    category = EXCLUDED.category,
    image_path = EXCLUDED.image_path,
    price = EXCLUDED.price,
    sale_price = EXCLUDED.sale_price,
    rating_average = EXCLUDED.rating_average,
    review_count = EXCLUDED.review_count,
    tag = EXCLUDED.tag,
    tone = EXCLUDED.tone,
    stock_quantity = EXCLUDED.stock_quantity,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = now();

DELETE FROM app_content_blocks
WHERE key NOT IN (
  'home_categories',
  'home_store_hours',
  'shop_filters',
  'shop_sale_banner'
);
