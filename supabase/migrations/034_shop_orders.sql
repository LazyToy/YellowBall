CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (
    status IN ('pending', 'paid', 'preparing', 'shipping', 'delivered', 'cancelled', 'refunded')
  ),
  total_amount INT NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_orders_select_own" ON shop_orders;
CREATE POLICY "shop_orders_select_own" ON shop_orders
  FOR SELECT
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "shop_orders_admin_write" ON shop_orders;
CREATE POLICY "shop_orders_admin_write" ON shop_orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS shop_orders_user_created_idx
  ON shop_orders(user_id, created_at DESC);

NOTIFY pgrst, 'reload schema';
