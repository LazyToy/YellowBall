CREATE OR REPLACE FUNCTION admin_suspend_user_transaction(
  p_actor_id UUID,
  p_target_id UUID,
  p_reason TEXT
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  before_profile profiles%ROWTYPE;
  updated_profile profiles%ROWTYPE;
  cancelled_service_count INT := 0;
  cancelled_demo_count INT := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_actor_id THEN
    RAISE EXCEPTION 'Administrator actor mismatch'
      USING ERRCODE = '42501';
  END IF;

  IF p_actor_id = p_target_id THEN
    RAISE EXCEPTION 'Administrators cannot suspend themselves'
      USING ERRCODE = '42501';
  END IF;

  IF NOT (
    has_super_admin_role(p_actor_id)
    OR EXISTS (
      SELECT 1
      FROM profiles
      JOIN admin_permissions
        ON admin_permissions.admin_id = profiles.id
      WHERE profiles.id = p_actor_id
        AND profiles.role = 'admin'
        AND profiles.status = 'active'
        AND admin_permissions.can_ban_users = true
    )
  ) THEN
    RAISE EXCEPTION 'User suspension permission is required'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO before_profile
  FROM profiles
  WHERE id = p_target_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile status cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF before_profile.role = 'super_admin' THEN
    RAISE EXCEPTION 'Super administrators cannot be suspended'
      USING ERRCODE = '42501';
  END IF;

  WITH candidates AS (
    SELECT id, slot_id, status
    FROM service_bookings
    WHERE user_id = p_target_id
      AND status IN (
        'requested',
        'approved',
        'visit_pending',
        'racket_received',
        'in_progress',
        'completed',
        'pickup_ready',
        'delivered',
        'reschedule_requested'
      )
    FOR UPDATE
  ),
  updated AS (
    UPDATE service_bookings
    SET status = 'cancelled_admin',
        updated_at = now()
    FROM candidates
    WHERE service_bookings.id = candidates.id
    RETURNING service_bookings.id, candidates.slot_id, candidates.status AS previous_status
  ),
  status_logs AS (
    INSERT INTO booking_status_logs (
      booking_type, booking_id, previous_status, new_status, changed_by, reason
    )
    SELECT 'service', id, previous_status, 'cancelled_admin', p_actor_id, p_reason
    FROM updated
    RETURNING 1
  ),
  slot_counts AS (
    SELECT slot_id, COUNT(*)::INT AS cancelled_count
    FROM updated
    GROUP BY slot_id
  ),
  slot_updates AS (
    UPDATE booking_slots
    SET reserved_count = GREATEST(booking_slots.reserved_count - slot_counts.cancelled_count, 0),
        updated_at = now()
    FROM slot_counts
    WHERE booking_slots.id = slot_counts.slot_id
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO cancelled_service_count
  FROM updated;

  WITH candidates AS (
    SELECT id, slot_id, status
    FROM demo_bookings
    WHERE user_id = p_target_id
      AND status IN ('requested', 'approved', 'in_use', 'overdue')
    FOR UPDATE
  ),
  updated AS (
    UPDATE demo_bookings
    SET status = 'cancelled_admin',
        updated_at = now()
    FROM candidates
    WHERE demo_bookings.id = candidates.id
    RETURNING demo_bookings.id, candidates.slot_id, candidates.status AS previous_status
  ),
  status_logs AS (
    INSERT INTO booking_status_logs (
      booking_type, booking_id, previous_status, new_status, changed_by, reason
    )
    SELECT 'demo', id, previous_status, 'cancelled_admin', p_actor_id, p_reason
    FROM updated
    RETURNING 1
  ),
  slot_counts AS (
    SELECT slot_id, COUNT(*)::INT AS cancelled_count
    FROM updated
    GROUP BY slot_id
  ),
  slot_updates AS (
    UPDATE booking_slots
    SET reserved_count = GREATEST(booking_slots.reserved_count - slot_counts.cancelled_count, 0),
        updated_at = now()
    FROM slot_counts
    WHERE booking_slots.id = slot_counts.slot_id
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO cancelled_demo_count
  FROM updated;

  PERFORM allow_profile_sensitive_update();

  UPDATE profiles
  SET status = 'suspended',
      updated_at = now()
  WHERE id = p_target_id
  RETURNING * INTO updated_profile;

  INSERT INTO administrator_audit_logs (
    actor_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value
  )
  VALUES (
    p_actor_id,
    'user.suspend',
    'profiles',
    p_target_id,
    jsonb_build_object('profile', to_jsonb(before_profile)),
    jsonb_build_object(
      'profile', to_jsonb(updated_profile),
      'reason', p_reason,
      'cancelledBookings', jsonb_build_object(
        'service_bookings', cancelled_service_count,
        'demo_bookings', cancelled_demo_count
      )
    )
  );

  RETURN updated_profile;
END;
$$;

REVOKE ALL ON FUNCTION admin_suspend_user_transaction(UUID, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION admin_suspend_user_transaction(UUID, UUID, TEXT)
  TO authenticated;
