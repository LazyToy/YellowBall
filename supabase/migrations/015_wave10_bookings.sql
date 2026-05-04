CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  racket_id UUID NOT NULL REFERENCES user_rackets(id) ON DELETE RESTRICT,
  main_string_id UUID NOT NULL REFERENCES string_catalog(id) ON DELETE RESTRICT,
  cross_string_id UUID NOT NULL REFERENCES string_catalog(id) ON DELETE RESTRICT,
  tension_main INT NOT NULL CHECK (tension_main BETWEEN 20 AND 70),
  tension_cross INT NOT NULL CHECK (tension_cross BETWEEN 20 AND 70),
  slot_id UUID NOT NULL REFERENCES booking_slots(id) ON DELETE RESTRICT,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('store_pickup','local_quick','parcel')),
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested','approved','visit_pending','racket_received','in_progress',
    'completed','pickup_ready','delivered','done',
    'cancelled_user','cancelled_admin','rejected','reschedule_requested',
    'no_show','refund_pending','refund_done'
  )),
  user_notes TEXT,
  admin_notes TEXT,
  no_show_counted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE demo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  demo_racket_id UUID NOT NULL REFERENCES demo_rackets(id) ON DELETE RESTRICT,
  slot_id UUID NOT NULL REFERENCES booking_slots(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  expected_return_time TIMESTAMPTZ NOT NULL,
  actual_return_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested','approved','in_use','returned',
    'cancelled_user','cancelled_admin','rejected','no_show','overdue'
  )),
  user_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (start_time < expected_return_time)
);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_bookings_select_own" ON service_bookings
  FOR SELECT
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "service_bookings_admin_all" ON service_bookings
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

CREATE POLICY "demo_bookings_select_own" ON demo_bookings
  FOR SELECT
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "demo_bookings_admin_all" ON demo_bookings
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

CREATE INDEX service_bookings_user_created_idx
  ON service_bookings(user_id, created_at DESC);
CREATE INDEX service_bookings_slot_idx
  ON service_bookings(slot_id);
CREATE INDEX service_bookings_status_idx
  ON service_bookings(status);
CREATE INDEX demo_bookings_user_created_idx
  ON demo_bookings(user_id, created_at DESC);
CREATE INDEX demo_bookings_racket_window_idx
  ON demo_bookings(demo_racket_id, start_time, expected_return_time);
CREATE INDEX demo_bookings_slot_idx
  ON demo_bookings(slot_id);

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE demo_bookings
  ADD CONSTRAINT demo_bookings_no_active_overlap
  EXCLUDE USING gist (
    demo_racket_id WITH =,
    tstzrange(start_time, expected_return_time, '[)') WITH &&
  )
  WHERE (status IN ('requested','approved','in_use','overdue'));

CREATE OR REPLACE FUNCTION create_service_booking_transaction(
  p_user_id UUID,
  p_racket_id UUID,
  p_main_string_id UUID,
  p_cross_string_id UUID,
  p_tension_main INT,
  p_tension_cross INT,
  p_slot_id UUID,
  p_delivery_method TEXT,
  p_address_id UUID,
  p_user_notes TEXT
) RETURNS service_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking service_bookings;
  v_profile_status TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION '본인 예약만 생성할 수 있습니다.';
  END IF;

  SELECT status INTO v_profile_status
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND OR v_profile_status <> 'active' THEN
    RAISE EXCEPTION '예약 가능한 사용자 상태가 아닙니다.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM user_rackets
    WHERE id = p_racket_id
      AND owner_id = p_user_id
  ) THEN
    RAISE EXCEPTION '본인 라켓으로만 예약할 수 있습니다.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM string_catalog
    WHERE id = p_main_string_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION '사용 가능한 메인 스트링이 아닙니다.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM string_catalog
    WHERE id = p_cross_string_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION '사용 가능한 크로스 스트링이 아닙니다.';
  END IF;

  IF p_address_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM addresses
    WHERE id = p_address_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION '본인 주소만 예약에 사용할 수 있습니다.';
  END IF;

  IF p_delivery_method IN ('local_quick','parcel') AND p_address_id IS NULL THEN
    RAISE EXCEPTION '배송 예약에는 주소가 필요합니다.';
  END IF;

  UPDATE booking_slots
  SET reserved_count = reserved_count + 1,
      updated_at = now()
  WHERE id = p_slot_id
    AND service_type = 'stringing'
    AND is_blocked = false
    AND reserved_count < capacity;

  IF NOT FOUND THEN
    RAISE EXCEPTION '예약 가능한 스트링 슬롯이 아닙니다.';
  END IF;

  INSERT INTO service_bookings (
    user_id, racket_id, main_string_id, cross_string_id,
    tension_main, tension_cross, slot_id, delivery_method,
    address_id, status, user_notes
  )
  VALUES (
    p_user_id, p_racket_id, p_main_string_id, p_cross_string_id,
    p_tension_main, p_tension_cross, p_slot_id, p_delivery_method,
    p_address_id, 'requested', p_user_notes
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION create_service_booking_transaction(
  UUID, UUID, UUID, UUID, INT, INT, UUID, TEXT, UUID, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_service_booking_transaction(
  UUID, UUID, UUID, UUID, INT, INT, UUID, TEXT, UUID, TEXT
) TO authenticated;

CREATE OR REPLACE FUNCTION create_demo_booking_transaction(
  p_user_id UUID,
  p_demo_racket_id UUID,
  p_slot_id UUID,
  p_start_time TIMESTAMPTZ,
  p_expected_return_time TIMESTAMPTZ,
  p_user_notes TEXT
) RETURNS demo_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking demo_bookings;
  v_slot booking_slots;
  v_demo_racket demo_rackets;
  v_profile_status TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION '본인 예약만 생성할 수 있습니다.';
  END IF;

  SELECT status INTO v_profile_status
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND OR v_profile_status <> 'active' THEN
    RAISE EXCEPTION '예약 가능한 사용자 상태가 아닙니다.';
  END IF;

  SELECT * INTO v_slot
  FROM booking_slots
  WHERE id = p_slot_id
    AND service_type = 'demo'
  FOR UPDATE;

  IF NOT FOUND OR v_slot.is_blocked OR v_slot.reserved_count >= v_slot.capacity THEN
    RAISE EXCEPTION '예약 가능한 시타 슬롯이 아닙니다.';
  END IF;

  IF p_start_time <> v_slot.start_time THEN
    RAISE EXCEPTION '시타 시작 시간은 슬롯 시작 시간과 같아야 합니다.';
  END IF;

  IF p_expected_return_time <= p_start_time THEN
    RAISE EXCEPTION '반납 예정 시간은 시작 시간보다 늦어야 합니다.';
  END IF;

  SELECT * INTO v_demo_racket
  FROM demo_rackets
    WHERE id = p_demo_racket_id
      AND demo_rackets.status = 'active'
      AND demo_rackets.is_demo_enabled = true
      AND demo_rackets.is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '예약 가능한 시타 라켓이 아닙니다.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM demo_bookings
    WHERE demo_racket_id = p_demo_racket_id
      AND status IN ('requested','approved','in_use','overdue')
      AND start_time < p_expected_return_time
      AND expected_return_time > p_start_time
  ) THEN
    RAISE EXCEPTION '해당 시간에는 이미 시타 예약이 있습니다.';
  END IF;

  UPDATE booking_slots
  SET reserved_count = reserved_count + 1,
      updated_at = now()
  WHERE id = p_slot_id
    AND service_type = 'demo'
    AND is_blocked = false
    AND reserved_count < capacity;

  IF NOT FOUND THEN
    RAISE EXCEPTION '예약 가능한 시타 슬롯이 아닙니다.';
  END IF;

  INSERT INTO demo_bookings (
    user_id, demo_racket_id, slot_id, start_time,
    expected_return_time, status, user_notes
  )
  VALUES (
    p_user_id, p_demo_racket_id, p_slot_id, p_start_time,
    p_expected_return_time, 'requested', p_user_notes
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION '해당 시간에는 이미 시타 예약이 있습니다.';
END;
$$;

REVOKE ALL ON FUNCTION create_demo_booking_transaction(
  UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_demo_booking_transaction(
  UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT
) TO authenticated;
