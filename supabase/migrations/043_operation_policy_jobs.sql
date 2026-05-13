ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS no_show_suspension_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS profiles_suspended_until_idx
  ON profiles (status, suspended_until)
  WHERE suspended_until IS NOT NULL;

CREATE OR REPLACE FUNCTION normalize_profile_suspension_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.operation_policy_job', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'active' THEN
    NEW.suspended_until := NULL;
  ELSIF OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'suspended' THEN
    NEW.suspended_until := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_profile_suspension_columns_trigger
  ON profiles;

CREATE TRIGGER normalize_profile_suspension_columns_trigger
  BEFORE UPDATE OF status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION normalize_profile_suspension_columns();

CREATE OR REPLACE FUNCTION can_auto_refund_store_pickup_service_booking(
  p_booking_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policy JSONB := '{}'::jsonb;
  v_auto_refund_enabled BOOLEAN := true;
  v_store_pickup_refund_hours INT := 3;
  v_can_refund BOOLEAN := false;
BEGIN
  SELECT COALESCE(value, '{}'::jsonb) INTO v_policy
  FROM app_settings
  WHERE key = 'operation_policy';

  IF v_policy ? 'autoRefundEnabled' THEN
    v_auto_refund_enabled := COALESCE((v_policy->>'autoRefundEnabled')::BOOLEAN, true);
  END IF;

  IF v_policy ? 'storePickupRefundHours'
     AND (v_policy->>'storePickupRefundHours') ~ '^[0-9]+$' THEN
    v_store_pickup_refund_hours :=
      GREATEST((v_policy->>'storePickupRefundHours')::INT, 0);
  END IF;

  SELECT v_auto_refund_enabled
    AND service_bookings.delivery_method = 'store_pickup'
    AND service_bookings.status IN ('requested', 'approved', 'visit_pending')
    AND now() <= booking_slots.start_time - make_interval(hours => v_store_pickup_refund_hours)
  INTO v_can_refund
  FROM service_bookings
  JOIN booking_slots ON booking_slots.id = service_bookings.slot_id
  WHERE service_bookings.id = p_booking_id;

  RETURN COALESCE(v_can_refund, false);
END;
$$;

CREATE OR REPLACE FUNCTION process_operation_policy_jobs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_policy JSONB := '{}'::jsonb;
  v_no_show_minutes INT := 20;
  v_unpaid_minutes INT := 10;
  v_suspension_days INT := 14;
  v_service_no_show_count INT := 0;
  v_demo_no_show_count INT := 0;
  v_suspended_count INT := 0;
  v_released_count INT := 0;
  v_unpaid_cancelled_count INT := 0;
BEGIN
  PERFORM set_config('app.operation_policy_job', 'on', true);

  SELECT COALESCE(value, '{}'::jsonb) INTO v_policy
  FROM app_settings
  WHERE key = 'operation_policy';

  IF v_policy ? 'noShowAutoCancelMinutes'
     AND (v_policy->>'noShowAutoCancelMinutes') ~ '^[0-9]+$' THEN
    v_no_show_minutes := GREATEST((v_policy->>'noShowAutoCancelMinutes')::INT, 0);
  END IF;

  IF v_policy ? 'unpaidAutoCancelMinutes'
     AND (v_policy->>'unpaidAutoCancelMinutes') ~ '^[0-9]+$' THEN
    v_unpaid_minutes := GREATEST((v_policy->>'unpaidAutoCancelMinutes')::INT, 0);
  END IF;

  IF v_policy ? 'noShowSuspensionDays'
     AND (v_policy->>'noShowSuspensionDays') ~ '^[0-9]+$' THEN
    v_suspension_days := GREATEST((v_policy->>'noShowSuspensionDays')::INT, 0);
  END IF;

  WITH released AS (
    UPDATE profiles
    SET status = 'active',
        suspended_until = NULL,
        updated_at = now()
    WHERE status = 'suspended'
      AND suspended_until IS NOT NULL
      AND suspended_until <= now()
    RETURNING id
  ),
  notifications AS (
    INSERT INTO notifications (
      user_id, title, body, notification_type, data
    )
    SELECT
      released.id,
      'Account restriction lifted',
      'Your booking restriction period has ended.',
      'account_suspension_lifted',
      jsonb_build_object('policyJob', true)
    FROM released
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO v_released_count
  FROM released;

  IF v_no_show_minutes > 0 THEN
    WITH candidates AS (
      SELECT
        service_bookings.id,
        service_bookings.user_id,
        service_bookings.status AS previous_status
      FROM service_bookings
      JOIN booking_slots ON booking_slots.id = service_bookings.slot_id
      WHERE service_bookings.status IN ('approved', 'visit_pending')
        AND booking_slots.start_time + make_interval(mins => v_no_show_minutes) <= now()
    ),
    updated AS (
      UPDATE service_bookings
      SET status = 'no_show',
          no_show_counted = true,
          updated_at = now()
      FROM candidates
      WHERE service_bookings.id = candidates.id
      RETURNING service_bookings.id, service_bookings.user_id, candidates.previous_status
    ),
    status_logs AS (
      INSERT INTO booking_status_logs (
        booking_type, booking_id, previous_status, new_status, changed_by, reason
      )
      SELECT
        'service',
        updated.id,
        updated.previous_status,
        'no_show',
        NULL,
        format('Operation policy auto no-show (%s minutes)', v_no_show_minutes)
      FROM updated
      RETURNING 1
    ),
    user_notifications AS (
      INSERT INTO notifications (
        user_id, title, body, notification_type, data
      )
      SELECT
        updated.user_id,
        'Reservation marked no-show',
        'Your reservation was marked as no-show after the visit time passed.',
        'service_no_show',
        jsonb_build_object(
          'bookingId', updated.id,
          'bookingType', 'service',
          'status', 'no_show',
          'policyJob', true
        )
      FROM updated
      LEFT JOIN notification_preferences
        ON notification_preferences.user_id = updated.user_id
      WHERE COALESCE(notification_preferences.booking_notifications, true) = true
      RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_service_no_show_count
    FROM updated;

    WITH candidates AS (
      SELECT id, user_id, status AS previous_status
      FROM demo_bookings
      WHERE status = 'approved'
        AND start_time + make_interval(mins => v_no_show_minutes) <= now()
    ),
    updated AS (
      UPDATE demo_bookings
      SET status = 'no_show',
          updated_at = now()
      FROM candidates
      WHERE demo_bookings.id = candidates.id
      RETURNING demo_bookings.id, demo_bookings.user_id, candidates.previous_status
    ),
    status_logs AS (
      INSERT INTO booking_status_logs (
        booking_type, booking_id, previous_status, new_status, changed_by, reason
      )
      SELECT
        'demo',
        updated.id,
        updated.previous_status,
        'no_show',
        NULL,
        format('Operation policy auto no-show (%s minutes)', v_no_show_minutes)
      FROM updated
      RETURNING 1
    ),
    user_notifications AS (
      INSERT INTO notifications (
        user_id, title, body, notification_type, data
      )
      SELECT
        updated.user_id,
        'Demo reservation marked no-show',
        'Your demo reservation was marked as no-show after the start time passed.',
        'demo_no_show',
        jsonb_build_object(
          'bookingId', updated.id,
          'bookingType', 'demo',
          'status', 'no_show',
          'policyJob', true
        )
      FROM updated
      LEFT JOIN notification_preferences
        ON notification_preferences.user_id = updated.user_id
      WHERE COALESCE(notification_preferences.booking_notifications, true) = true
      RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_demo_no_show_count
    FROM updated;
  END IF;

  IF v_suspension_days > 0 THEN
    WITH no_show_users AS (
      SELECT user_id, COUNT(*)::INT AS no_show_count
      FROM service_bookings
      WHERE no_show_counted = true
      GROUP BY user_id
      HAVING COUNT(*) >= 3
    ),
    updated AS (
      UPDATE profiles
      SET status = 'suspended',
          suspended_until = now() + make_interval(days => v_suspension_days),
          no_show_suspension_count = no_show_users.no_show_count,
          updated_at = now()
      FROM no_show_users
      WHERE profiles.id = no_show_users.user_id
        AND profiles.role <> 'super_admin'
        AND no_show_users.no_show_count > profiles.no_show_suspension_count
      RETURNING profiles.id, profiles.suspended_until, profiles.no_show_suspension_count
    ),
    user_notifications AS (
      INSERT INTO notifications (
        user_id, title, body, notification_type, data
      )
      SELECT
        updated.id,
        'Account temporarily restricted',
        format('Bookings are restricted for %s days because of repeated no-shows.', v_suspension_days),
        'account_suspended_no_show',
        jsonb_build_object(
          'suspendedUntil', updated.suspended_until,
          'noShowCount', updated.no_show_suspension_count,
          'policyJob', true
        )
      FROM updated
      RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_suspended_count
    FROM updated;
  END IF;

  IF v_unpaid_minutes > 0 THEN
    WITH updated AS (
      UPDATE shop_orders
      SET status = 'cancelled',
          updated_at = now()
      WHERE status = 'pending'
        AND created_at + make_interval(mins => v_unpaid_minutes) <= now()
      RETURNING id, user_id, order_number
    ),
    user_notifications AS (
      INSERT INTO notifications (
        user_id, title, body, notification_type, data
      )
      SELECT
        updated.user_id,
        'Order automatically cancelled',
        'Your order was cancelled because payment was not completed.',
        'shop_order_unpaid_cancelled',
        jsonb_build_object(
          'orderId', updated.id,
          'orderNumber', updated.order_number,
          'policyJob', true
        )
      FROM updated
      RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_unpaid_cancelled_count
    FROM updated;
  END IF;

  RETURN jsonb_build_object(
    'serviceNoShows', v_service_no_show_count,
    'demoNoShows', v_demo_no_show_count,
    'suspendedUsers', v_suspended_count,
    'releasedUsers', v_released_count,
    'unpaidOrdersCancelled', v_unpaid_cancelled_count
  );
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
  v_no_show_suspension_count INT := 0;
  v_slot_start TIMESTAMPTZ;
  v_policy JSONB := '{}'::jsonb;
  v_booking_open_hours_before INT := 2;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Only the profile owner can create a booking.';
  END IF;

  SELECT COALESCE(value, '{}'::jsonb) INTO v_policy
  FROM app_settings
  WHERE key = 'operation_policy';

  IF v_policy ? 'bookingOpenHoursBefore'
     AND (v_policy->>'bookingOpenHoursBefore') ~ '^[0-9]+$' THEN
    v_booking_open_hours_before :=
      GREATEST((v_policy->>'bookingOpenHoursBefore')::INT, 0);
  END IF;

  SELECT status, no_show_suspension_count
  INTO v_profile_status, v_no_show_suspension_count
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND OR v_profile_status <> 'active' THEN
    RAISE EXCEPTION 'Profile is not allowed to create bookings.';
  END IF;

  SELECT COUNT(*) INTO v_no_show_count
  FROM service_bookings
  WHERE user_id = p_user_id
    AND no_show_counted = true;

  IF v_no_show_count >= 3
    AND v_no_show_count > COALESCE(v_no_show_suspension_count, 0) THEN
    RAISE EXCEPTION 'Users with unresolved repeated no-shows cannot create bookings.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM user_rackets
    WHERE id = p_racket_id
      AND owner_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Bookings can only use the profile owner racket.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM string_catalog
    WHERE id = p_main_string_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Main string is not available.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM string_catalog
    WHERE id = p_cross_string_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cross string is not available.';
  END IF;

  IF p_address_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM addresses
    WHERE id = p_address_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Bookings can only use the profile owner address.';
  END IF;

  IF p_delivery_method IN ('local_quick','parcel') AND p_address_id IS NULL THEN
    RAISE EXCEPTION 'Delivery bookings require an address.';
  END IF;

  SELECT start_time INTO v_slot_start
  FROM booking_slots
  WHERE id = p_slot_id
    AND service_type = 'stringing'
  FOR UPDATE;

  IF NOT FOUND OR v_slot_start < now() + make_interval(hours => v_booking_open_hours_before) THEN
    RAISE EXCEPTION 'Bookings are only available after % hours.',
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
    RAISE EXCEPTION 'Stringing slot is not available.';
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

REVOKE ALL ON FUNCTION normalize_profile_suspension_columns()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION can_auto_refund_store_pickup_service_booking(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION process_operation_policy_jobs()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION create_service_booking_transaction(
  UUID, UUID, UUID, UUID, INT, INT, UUID, TEXT, UUID, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION create_service_booking_transaction(
  UUID, UUID, UUID, UUID, INT, INT, UUID, TEXT, UUID, TEXT
) TO authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'operation-policy-jobs'
  ) THEN
    PERFORM cron.unschedule('operation-policy-jobs');
  END IF;

  PERFORM cron.schedule(
    'operation-policy-jobs',
    '*/5 * * * *',
    'SELECT process_operation_policy_jobs()'
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
