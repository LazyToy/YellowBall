BEGIN;

-- PR-32 RLS matrix
-- profiles: user own R/W, admin read, super_admin read
-- addresses, user_rackets, user_string_setups, notification_preferences: user own only
-- string_catalog: authenticated users read active, string admins CRUD, super_admin CRUD
-- admin_permissions: super_admin all, admin own read
-- administrator_audit_logs: super_admin read, admins insert
-- shop_schedule, closed_dates, booking_slots: authenticated read, admins write
-- service_bookings, demo_bookings: owner read, booking managers all, create via RPC only
-- demo_rackets: authenticated users read active demo rackets, demo-racket admins CRUD
-- racket_condition_checks: booking managers CRUD, booking owner read
-- notifications: user own only
-- app_settings: authenticated read, super_admin write
-- anon: no public table data access

CREATE OR REPLACE FUNCTION pg_temp.assert_eq(
  p_actual BIGINT,
  p_expected BIGINT,
  p_label TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_actual <> p_expected THEN
    RAISE EXCEPTION '% expected %, got %', p_label, p_expected, p_actual;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.assert_blocked(
  p_sql TEXT,
  p_label TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION '% should have been blocked by RLS', p_label;
EXCEPTION
  WHEN insufficient_privilege OR check_violation OR with_check_option_violation THEN
    NULL;
END;
$$;

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user1@example.com',
    'password',
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user2@example.com',
    'password',
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin-limited@example.com',
    'password',
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'booking-admin@example.com',
    'password',
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'super@example.com',
    'password',
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, username, nickname, phone, role, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'user1', 'User One', '01000000001', 'user', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'user2', 'User Two', '01000000002', 'user', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'admin_limited', 'Limited Admin', '01000000003', 'admin', 'active'),
  ('00000000-0000-0000-0000-000000000004', 'booking_admin', 'Booking Admin', '01000000004', 'admin', 'active'),
  ('00000000-0000-0000-0000-000000000005', 'super_admin', 'Super Admin', '01000000005', 'super_admin', 'active');

INSERT INTO admin_permissions (
  admin_id, can_manage_strings, can_manage_demo_rackets, can_manage_bookings
)
VALUES
  ('00000000-0000-0000-0000-000000000003', false, false, false),
  ('00000000-0000-0000-0000-000000000004', false, false, true)
ON CONFLICT (admin_id) DO UPDATE
SET can_manage_bookings = EXCLUDED.can_manage_bookings;

INSERT INTO notification_preferences (user_id)
VALUES
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO addresses (
  id, user_id, recipient_name, phone, address_line1
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'User One',
    '01000000001',
    'Seoul'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'User Two',
    '01000000002',
    'Busan'
  );

INSERT INTO user_rackets (id, owner_id, brand, model)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Wilson',
    'Blade'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Babolat',
    'Pure Drive'
  );

INSERT INTO string_catalog (id, brand, name, is_active)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Luxilon', 'ALU Power', true),
  ('30000000-0000-0000-0000-000000000002', 'Old', 'Hidden String', false);

INSERT INTO user_string_setups (
  id, user_id, racket_id, main_string_id, cross_string_id, tension_main, tension_cross
)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  48,
  48
);

INSERT INTO booking_slots (
  id, service_type, start_time, end_time, capacity, reserved_count, is_blocked
)
VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    'stringing',
    now() + INTERVAL '7 days',
    now() + INTERVAL '7 days 1 hour',
    2,
    1,
    false
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    'demo',
    now() + INTERVAL '8 days',
    now() + INTERVAL '8 days 1 hour',
    2,
    1,
    false
  );

INSERT INTO service_bookings (
  id, user_id, racket_id, main_string_id, cross_string_id,
  tension_main, tension_cross, slot_id, delivery_method
)
VALUES
  (
    '60000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    48,
    48,
    '50000000-0000-0000-0000-000000000001',
    'store_pickup'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    48,
    48,
    '50000000-0000-0000-0000-000000000001',
    'store_pickup'
  );

INSERT INTO demo_rackets (id, brand, model, status, is_demo_enabled, is_active)
VALUES
  ('70000000-0000-0000-0000-000000000001', 'Yonex', 'Ezone', 'active', true, true),
  ('70000000-0000-0000-0000-000000000002', 'Hidden', 'Frame', 'hidden', false, false);

INSERT INTO demo_bookings (
  id, user_id, demo_racket_id, slot_id, start_time, expected_return_time
)
VALUES (
  '80000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  now() + INTERVAL '8 days',
  now() + INTERVAL '9 days'
);

INSERT INTO booking_status_logs (
  id, booking_type, booking_id, previous_status, new_status, changed_by
)
VALUES (
  '90000000-0000-0000-0000-000000000001',
  'service',
  '60000000-0000-0000-0000-000000000001',
  null,
  'requested',
  '00000000-0000-0000-0000-000000000004'
);

INSERT INTO racket_condition_checks (
  id, demo_booking_id, check_type, checked_by
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000001',
  'before_rental',
  '00000000-0000-0000-0000-000000000004'
);

INSERT INTO notifications (id, user_id, title, body)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Mine',
    'Own notification'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Other',
    'Other notification'
  );

INSERT INTO app_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO administrator_audit_logs (id, actor_id, action, target_table)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000004',
  'seed.audit',
  'profiles'
);

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM profiles), 0, 'anon profiles blocked');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM string_catalog), 0, 'anon string catalog blocked');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM booking_slots), 0, 'anon booking slots blocked');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM app_settings), 0, 'anon app settings blocked');

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM profiles), 1, 'user sees own profile only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM addresses), 1, 'user sees own address only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM user_rackets), 1, 'user sees own rackets only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM user_string_setups), 1, 'user sees own string setups only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM notification_preferences), 1, 'user sees own notification preferences only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM notifications), 1, 'user sees own notifications only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM string_catalog), 1, 'user sees active strings only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM demo_rackets), 1, 'user sees active demo rackets only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM service_bookings), 1, 'user sees own service bookings only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM demo_bookings), 1, 'user sees own demo bookings only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM booking_status_logs), 1, 'user sees own booking status logs only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM racket_condition_checks), 1, 'user sees own condition checks only');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM shop_schedule), 7, 'authenticated user sees shop schedule');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM booking_slots), 2, 'authenticated user sees booking slots');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM app_settings), 1, 'authenticated user sees app settings');
UPDATE profiles
SET nickname = 'User One Updated'
WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT update_profile_push_token(
  '00000000-0000-0000-0000-000000000001',
  'ExponentPushToken[user1]'
);
SELECT pg_temp.assert_blocked(
  $$UPDATE profiles
    SET role = 'super_admin'
    WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  'user cannot promote own profile role'
);
SELECT pg_temp.assert_blocked(
  $$UPDATE profiles
    SET status = 'active'
    WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  'user cannot directly update own profile status'
);
SELECT pg_temp.assert_blocked(
  $$UPDATE profiles
    SET expo_push_token = 'ExponentPushToken[direct]'
    WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  'user cannot directly update own push token'
);
SELECT pg_temp.assert_blocked(
  $$INSERT INTO addresses (user_id, recipient_name, phone, address_line1)
    VALUES ('00000000-0000-0000-0000-000000000002', 'Other', '01099999999', 'Other')$$,
  'user cannot insert another user address'
);
SELECT pg_temp.assert_blocked(
  $$INSERT INTO administrator_audit_logs (actor_id, action)
    VALUES ('00000000-0000-0000-0000-000000000001', 'user.audit')$$,
  'user cannot insert administrator audit log'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM profiles), 5, 'admin can read profiles');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM service_bookings), 0, 'admin without booking permission cannot read bookings');
SELECT pg_temp.assert_blocked(
  $$UPDATE service_bookings SET admin_notes = 'blocked'
    WHERE id = '60000000-0000-0000-0000-000000000001'$$,
  'admin without booking permission cannot update bookings'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM service_bookings), 2, 'booking admin can read all service bookings');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM demo_bookings), 1, 'booking admin can read all demo bookings');
UPDATE service_bookings
SET admin_notes = 'checked by booking admin'
WHERE id = '60000000-0000-0000-0000-000000000001';
INSERT INTO racket_condition_checks (
  demo_booking_id, check_type, checked_by
)
VALUES (
  '80000000-0000-0000-0000-000000000001',
  'after_return',
  '00000000-0000-0000-0000-000000000004'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000005', true);
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM profiles), 5, 'super admin sees all profiles');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM admin_permissions), 2, 'super admin sees admin permissions');
SELECT pg_temp.assert_eq((SELECT COUNT(*) FROM administrator_audit_logs), 1, 'super admin sees audit logs');
UPDATE app_settings
SET value = '{"enabled": true}'::jsonb
WHERE key = 'maintenance_mode';

RESET ROLE;
ROLLBACK;
