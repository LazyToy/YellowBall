INSERT INTO app_settings (key, value, updated_at)
VALUES (
  'operation_policy',
  '{
    "bookingOpenHoursBefore": 2,
    "bookingMaxDaysAhead": 14,
    "maxConcurrentBookings": 1,
    "noShowAutoCancelMinutes": 20,
    "noShowSuspensionDays": 14,
    "unpaidAutoCancelMinutes": 10,
    "suspendedLoginBlocked": true,
    "storePickupRefundHours": 3,
    "stringingRefundHours": 6,
    "autoRefundEnabled": true,
    "notifyBookingConfirmation": true,
    "notifyPickupReady": true,
    "notifyMarketing": false
  }'::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;

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
  v_policy JSONB := '{}'::jsonb;
  v_stringing_refund_hours INT := 6;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION '본인 예약만 취소할 수 있습니다.';
  END IF;

  SELECT COALESCE(value, '{}'::jsonb) INTO v_policy
  FROM app_settings
  WHERE key = 'operation_policy';

  IF v_policy ? 'stringingRefundHours'
     AND (v_policy->>'stringingRefundHours') ~ '^[0-9]+$' THEN
    v_stringing_refund_hours :=
      GREATEST((v_policy->>'stringingRefundHours')::INT, 0);
  END IF;

  SELECT * INTO v_booking
  FROM service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '예약을 찾을 수 없습니다.';
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

  IF NOT FOUND OR now() > (v_slot_start - make_interval(hours => v_stringing_refund_hours)) THEN
    RAISE EXCEPTION '%시간 이내 예약은 관리자 확인 후 취소할 수 있습니다.',
      v_stringing_refund_hours;
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
    format('사용자 %s시간 전 자동 취소', v_stringing_refund_hours)
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
  v_slot_start TIMESTAMPTZ;
  v_policy JSONB := '{}'::jsonb;
  v_booking_open_hours_before INT := 2;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION '본인 예약만 생성할 수 있습니다.';
  END IF;

  SELECT COALESCE(value, '{}'::jsonb) INTO v_policy
  FROM app_settings
  WHERE key = 'operation_policy';

  IF v_policy ? 'bookingOpenHoursBefore'
     AND (v_policy->>'bookingOpenHoursBefore') ~ '^[0-9]+$' THEN
    v_booking_open_hours_before :=
      GREATEST((v_policy->>'bookingOpenHoursBefore')::INT, 0);
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

  SELECT start_time INTO v_slot_start
  FROM booking_slots
  WHERE id = p_slot_id
    AND service_type = 'stringing'
  FOR UPDATE;

  IF NOT FOUND OR v_slot_start < now() + make_interval(hours => v_booking_open_hours_before) THEN
    RAISE EXCEPTION '%시간 이후 예약만 가능합니다.',
      v_booking_open_hours_before;
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
GRANT EXECUTE ON FUNCTION user_cancel_service_booking(UUID, UUID)
  TO authenticated;

REVOKE ALL ON FUNCTION create_service_booking_transaction(
  UUID, UUID, UUID, UUID, INT, INT, UUID, TEXT, UUID, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_service_booking_transaction(
  UUID, UUID, UUID, UUID, INT, INT, UUID, TEXT, UUID, TEXT
) TO authenticated;
