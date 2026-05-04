CREATE TABLE booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL CHECK (service_type IN ('stringing', 'demo')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  reserved_count INT NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (start_time < end_time),
  CHECK (reserved_count <= capacity),
  CHECK (reserved_count >= 0),
  UNIQUE (service_type, start_time)
);

ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_slots_read_all" ON booking_slots
  FOR SELECT
  USING (true);

CREATE POLICY "booking_slots_admin_write" ON booking_slots
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

CREATE INDEX booking_slots_service_time_idx
  ON booking_slots(service_type, start_time);
CREATE INDEX booking_slots_available_idx
  ON booking_slots(service_type, is_blocked, start_time);
