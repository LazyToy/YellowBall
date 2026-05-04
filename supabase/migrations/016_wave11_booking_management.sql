CREATE TABLE booking_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('service','demo')),
  booking_id UUID NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE booking_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_status_logs_select_related_user" ON booking_status_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
    OR (
      booking_type = 'service'
      AND EXISTS (
        SELECT 1 FROM service_bookings
        WHERE service_bookings.id = booking_status_logs.booking_id
          AND service_bookings.user_id = auth.uid()
      )
    )
    OR (
      booking_type = 'demo'
      AND EXISTS (
        SELECT 1 FROM demo_bookings
        WHERE demo_bookings.id = booking_status_logs.booking_id
          AND demo_bookings.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "booking_status_logs_admin_all" ON booking_status_logs
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

CREATE INDEX booking_status_logs_booking_idx
  ON booking_status_logs(booking_type, booking_id, changed_at DESC);
CREATE INDEX booking_status_logs_changed_by_idx
  ON booking_status_logs(changed_by, changed_at DESC);

CREATE OR REPLACE FUNCTION can_manage_bookings(p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_admin_id AND role = 'super_admin'
  )
  OR EXISTS (
    SELECT 1
    FROM profiles
    JOIN admin_permissions ON admin_permissions.admin_id = profiles.id
    WHERE profiles.id = p_admin_id
      AND profiles.role = 'admin'
      AND admin_permissions.can_manage_bookings = true
  );
$$;

CREATE OR REPLACE FUNCTION admin_update_service_booking_status(
  p_booking_id UUID,
  p_admin_id UUID,
  p_new_status TEXT,
  p_reason TEXT
) RETURNS service_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking service_bookings;
  v_updated service_bookings;
  v_release_slot BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION '본인 관리자 권한으로만 예약을 변경할 수 있습니다.';
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

  IF NOT (
    (v_booking.status = 'requested' AND p_new_status IN ('approved','rejected','reschedule_requested','cancelled_admin')) OR
    (v_booking.status = 'approved' AND p_new_status IN ('visit_pending','cancelled_admin','cancelled_user')) OR
    (v_booking.status = 'visit_pending' AND p_new_status IN ('racket_received','no_show','cancelled_user')) OR
    (v_booking.status = 'racket_received' AND p_new_status = 'in_progress') OR
    (v_booking.status = 'in_progress' AND p_new_status = 'completed') OR
    (v_booking.status = 'completed' AND p_new_status IN ('pickup_ready','delivered')) OR
    (v_booking.status IN ('pickup_ready','delivered') AND p_new_status = 'done') OR
    (v_booking.status = 'reschedule_requested' AND p_new_status IN ('approved','cancelled_admin','cancelled_user')) OR
    (v_booking.status = 'refund_pending' AND p_new_status = 'refund_done')
  ) THEN
    RAISE EXCEPTION '허용되지 않는 예약 상태 전환입니다.';
  END IF;

  v_release_slot := p_new_status IN (
    'rejected',
    'cancelled_user',
    'cancelled_admin'
  )
  AND v_booking.status NOT IN (
    'rejected',
    'cancelled_user',
    'cancelled_admin',
    'no_show',
    'done'
  );

  UPDATE service_bookings
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_updated;

  IF v_release_slot THEN
    UPDATE booking_slots
    SET reserved_count = GREATEST(reserved_count - 1, 0),
        updated_at = now()
    WHERE id = v_booking.slot_id;
  END IF;

  INSERT INTO booking_status_logs (
    booking_type, booking_id, previous_status, new_status, changed_by, reason
  )
  VALUES (
    'service', p_booking_id, v_booking.status, p_new_status, p_admin_id, p_reason
  );

  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_demo_booking_status(
  p_booking_id UUID,
  p_admin_id UUID,
  p_new_status TEXT,
  p_reason TEXT,
  p_actual_return_time TIMESTAMPTZ
) RETURNS demo_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking demo_bookings;
  v_updated demo_bookings;
  v_release_slot BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION '본인 관리자 권한으로만 시타 예약을 변경할 수 있습니다.';
  END IF;

  IF NOT can_manage_bookings(p_admin_id) THEN
    RAISE EXCEPTION '시타 예약 관리 권한이 없습니다.';
  END IF;

  SELECT * INTO v_booking
  FROM demo_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '시타 예약을 찾지 못했습니다.';
  END IF;

  IF NOT (
    (v_booking.status = 'requested' AND p_new_status IN ('approved','rejected','cancelled_admin')) OR
    (v_booking.status = 'approved' AND p_new_status IN ('in_use','cancelled_admin','no_show')) OR
    (v_booking.status = 'in_use' AND p_new_status IN ('returned','overdue')) OR
    (v_booking.status = 'overdue' AND p_new_status = 'returned')
  ) THEN
    RAISE EXCEPTION '허용되지 않는 시타 예약 상태 전환입니다.';
  END IF;

  IF p_new_status = 'returned' AND p_actual_return_time IS NULL THEN
    RAISE EXCEPTION '반납 처리에는 실제 반납 시간이 필요합니다.';
  END IF;

  v_release_slot := p_new_status IN (
    'rejected',
    'cancelled_user',
    'cancelled_admin'
  )
  AND v_booking.status NOT IN (
    'rejected',
    'cancelled_user',
    'cancelled_admin',
    'no_show',
    'returned'
  );

  UPDATE demo_bookings
  SET status = p_new_status,
      actual_return_time = CASE
        WHEN p_new_status = 'returned' THEN p_actual_return_time
        ELSE actual_return_time
      END,
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_updated;

  IF v_release_slot THEN
    UPDATE booking_slots
    SET reserved_count = GREATEST(reserved_count - 1, 0),
        updated_at = now()
    WHERE id = v_booking.slot_id;
  END IF;

  INSERT INTO booking_status_logs (
    booking_type, booking_id, previous_status, new_status, changed_by, reason
  )
  VALUES (
    'demo', p_booking_id, v_booking.status, p_new_status, p_admin_id, p_reason
  );

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION can_manage_bookings(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_update_service_booking_status(UUID, UUID, TEXT, TEXT)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_update_demo_booking_status(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION admin_update_service_booking_status(UUID, UUID, TEXT, TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_demo_booking_status(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ)
  TO authenticated;
