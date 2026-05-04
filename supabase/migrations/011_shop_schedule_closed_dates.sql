CREATE TABLE shop_schedule (
  day_of_week SMALLINT PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (open_time < close_time)
);

CREATE TABLE closed_dates (
  closed_date DATE PRIMARY KEY,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shop_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE closed_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_schedule_read_all" ON shop_schedule
  FOR SELECT
  USING (true);

CREATE POLICY "shop_schedule_admin_write" ON shop_schedule
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

CREATE POLICY "closed_dates_read_all" ON closed_dates
  FOR SELECT
  USING (true);

CREATE POLICY "closed_dates_admin_write" ON closed_dates
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

CREATE INDEX closed_dates_date_idx ON closed_dates(closed_date);

INSERT INTO shop_schedule (day_of_week, open_time, close_time, is_closed)
VALUES
  (0, '10:00', '17:00', true),
  (1, '09:00', '18:00', false),
  (2, '09:00', '18:00', false),
  (3, '09:00', '18:00', false),
  (4, '09:00', '18:00', false),
  (5, '09:00', '18:00', false),
  (6, '10:00', '17:00', false)
ON CONFLICT (day_of_week) DO NOTHING;
