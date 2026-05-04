CREATE TABLE racket_condition_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_booking_id UUID NOT NULL REFERENCES demo_bookings(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('before_rental','after_return')),
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  scratch_notes TEXT,
  string_condition TEXT,
  grip_condition TEXT,
  damage_detected BOOLEAN NOT NULL DEFAULT false,
  deposit_deduction INT NOT NULL DEFAULT 0 CHECK (deposit_deduction >= 0),
  checked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  checked_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE racket_condition_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "racket_condition_checks_select_owner_or_admin"
  ON racket_condition_checks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
    OR EXISTS (
      SELECT 1 FROM demo_bookings
      WHERE demo_bookings.id = racket_condition_checks.demo_booking_id
        AND demo_bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "racket_condition_checks_admin_insert"
  ON racket_condition_checks
  FOR INSERT
  WITH CHECK (
    checked_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "racket_condition_checks_admin_update"
  ON racket_condition_checks
  FOR UPDATE
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

CREATE POLICY "racket_condition_checks_admin_delete"
  ON racket_condition_checks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX racket_condition_checks_booking_idx
  ON racket_condition_checks(demo_booking_id, checked_at);
CREATE INDEX racket_condition_checks_checked_by_idx
  ON racket_condition_checks(checked_by, checked_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('condition-photos', 'condition-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "condition_photos_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'condition-photos');

CREATE POLICY "condition_photos_admin_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'condition-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "condition_photos_admin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'condition-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    bucket_id = 'condition-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "condition_photos_admin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'condition-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE OR REPLACE FUNCTION user_cancel_service_booking(
  p_booking_id UUID,
  p_user_id UUID
) RETURNS service_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking service_bookings;
  v_updated service_bookings;
  v_slot_start TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION '본인 예약만 취소할 수 있습니다.';
  END IF;

  SELECT * INTO v_booking
  FROM service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '예약을 찾지 못했습니다.';
  END IF;

  IF v_booking.user_id <> p_user_id THEN
    RAISE EXCEPTION '본인 예약만 취소할 수 있습니다.';
  END IF;

  IF v_booking.status IN (
    'in_progress','completed','pickup_ready','delivered','done',
    'cancelled_user','cancelled_admin','rejected','no_show',
    'refund_pending','refund_done'
  ) THEN
    RAISE EXCEPTION '작업 시작 이후에는 예약을 취소할 수 없습니다.';
  END IF;

  SELECT start_time INTO v_slot_start
  FROM booking_slots
  WHERE id = v_booking.slot_id;

  IF NOT FOUND OR now() > (v_slot_start - INTERVAL '24 hours') THEN
    RAISE EXCEPTION '24시간 이내 예약은 관리자 확인 후 취소할 수 있습니다.';
  END IF;

  UPDATE service_bookings
  SET status = 'cancelled_user',
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_updated;

  UPDATE booking_slots
  SET reserved_count = GREATEST(reserved_count - 1, 0),
      updated_at = now()
  WHERE id = v_booking.slot_id;

  INSERT INTO booking_status_logs (
    booking_type, booking_id, previous_status, new_status, changed_by, reason
  )
  VALUES (
    'service',
    p_booking_id,
    v_booking.status,
    'cancelled_user',
    p_user_id,
    '사용자 24시간 전 자동 취소'
  );

  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION record_service_booking_no_show(
  p_booking_id UUID,
  p_admin_id UUID
) RETURNS service_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking service_bookings;
  v_updated service_bookings;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION '본인 관리자 권한으로만 노쇼를 기록할 수 있습니다.';
  END IF;

  IF NOT can_manage_bookings(p_admin_id) THEN
    RAISE EXCEPTION '예약 관리 권한이 없습니다.';
  END IF;

  SELECT * INTO v_booking
  FROM service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '예약을 찾지 못했습니다.';
  END IF;

  IF v_booking.status NOT IN ('approved','visit_pending') THEN
    RAISE EXCEPTION '노쇼 처리할 수 없는 예약 상태입니다.';
  END IF;

  UPDATE service_bookings
  SET status = 'no_show',
      no_show_counted = true,
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_updated;

  INSERT INTO booking_status_logs (
    booking_type, booking_id, previous_status, new_status, changed_by, reason
  )
  VALUES (
    'service', p_booking_id, v_booking.status, 'no_show', p_admin_id, '노쇼 처리'
  );

  RETURN v_updated;
END;
$$;

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
  v_no_show_count INT;
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

  SELECT COUNT(*) INTO v_no_show_count
  FROM service_bookings
  WHERE user_id = p_user_id
    AND no_show_counted = true;

  IF v_no_show_count >= 3 THEN
    RAISE EXCEPTION '노쇼 3회 이상 사용자는 예약할 수 없습니다.';
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

REVOKE ALL ON FUNCTION user_cancel_service_booking(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION record_service_booking_no_show(UUID, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION user_cancel_service_booking(UUID, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION record_service_booking_no_show(UUID, UUID)
  TO authenticated;
