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
    RAISE EXCEPTION 'Only the authenticated admin can change booking status.';
  END IF;

  IF NOT can_manage_bookings(p_admin_id) THEN
    RAISE EXCEPTION 'Missing booking management permission.';
  END IF;

  SELECT * INTO v_booking
  FROM service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  IF NOT (
    p_new_status IN ('requested','approved','in_progress','completed') OR
    (v_booking.status = 'requested' AND p_new_status IN ('rejected','reschedule_requested','cancelled_admin','cancelled_user')) OR
    (v_booking.status = 'approved' AND p_new_status IN ('visit_pending','cancelled_admin','cancelled_user')) OR
    (v_booking.status = 'visit_pending' AND p_new_status IN ('racket_received','no_show','cancelled_user')) OR
    (v_booking.status = 'racket_received' AND p_new_status = 'in_progress') OR
    (v_booking.status = 'in_progress' AND p_new_status = 'completed') OR
    (v_booking.status = 'completed' AND p_new_status IN ('pickup_ready','delivered')) OR
    (v_booking.status IN ('pickup_ready','delivered') AND p_new_status = 'done') OR
    (v_booking.status = 'reschedule_requested' AND p_new_status IN ('approved','cancelled_admin','cancelled_user')) OR
    (v_booking.status = 'refund_pending' AND p_new_status = 'refund_done')
  ) THEN
    RAISE EXCEPTION 'Invalid booking status transition.';
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

REVOKE ALL ON FUNCTION admin_update_service_booking_status(UUID, UUID, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_service_booking_status(UUID, UUID, TEXT, TEXT)
  TO authenticated;
