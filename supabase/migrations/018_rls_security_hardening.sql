CREATE OR REPLACE FUNCTION has_admin_role(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = p_user_id
        AND role IN ('admin', 'super_admin')
        AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION has_super_admin_role(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = p_user_id
        AND role = 'super_admin'
        AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION has_booking_manager_role(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = p_user_id
          AND role = 'super_admin'
          AND status = 'active'
      )
      OR EXISTS (
        SELECT 1
        FROM profiles
        JOIN admin_permissions
          ON admin_permissions.admin_id = profiles.id
        WHERE profiles.id = p_user_id
          AND profiles.role = 'admin'
          AND profiles.status = 'active'
          AND admin_permissions.can_manage_bookings = true
      )
    );
$$;

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT
  USING (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "admin_perm_super" ON admin_permissions;
CREATE POLICY "admin_perm_super" ON admin_permissions
  FOR ALL
  USING (has_super_admin_role(auth.uid()))
  WITH CHECK (has_super_admin_role(auth.uid()));

DROP POLICY IF EXISTS "app_settings_read_all" ON app_settings;
CREATE POLICY "app_settings_read_authenticated" ON app_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "app_settings_super_write" ON app_settings;
CREATE POLICY "app_settings_super_write" ON app_settings
  FOR ALL
  USING (has_super_admin_role(auth.uid()))
  WITH CHECK (has_super_admin_role(auth.uid()));

DROP POLICY IF EXISTS "audit_read_super_admin" ON administrator_audit_logs;
CREATE POLICY "audit_read_super_admin" ON administrator_audit_logs
  FOR SELECT
  USING (has_super_admin_role(auth.uid()));

DROP POLICY IF EXISTS "audit_insert_admins" ON administrator_audit_logs;
CREATE POLICY "audit_insert_admins" ON administrator_audit_logs
  FOR INSERT
  WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "string_catalog_public_active_read" ON string_catalog;
CREATE POLICY "string_catalog_authenticated_active_read" ON string_catalog
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

DROP POLICY IF EXISTS "string_admin_read" ON string_catalog;
CREATE POLICY "string_admin_read" ON string_catalog
  FOR SELECT
  USING (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "demo_rackets_public_active_read" ON demo_rackets;
CREATE POLICY "demo_rackets_authenticated_active_read" ON demo_rackets
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND status = 'active'
    AND is_demo_enabled = true
    AND is_active = true
  );

DROP POLICY IF EXISTS "shop_schedule_read_all" ON shop_schedule;
CREATE POLICY "shop_schedule_read_authenticated" ON shop_schedule
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "shop_schedule_admin_write" ON shop_schedule;
CREATE POLICY "shop_schedule_admin_write" ON shop_schedule
  FOR ALL
  USING (has_admin_role(auth.uid()))
  WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "closed_dates_read_all" ON closed_dates;
CREATE POLICY "closed_dates_read_authenticated" ON closed_dates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "closed_dates_admin_write" ON closed_dates;
CREATE POLICY "closed_dates_admin_write" ON closed_dates
  FOR ALL
  USING (has_admin_role(auth.uid()))
  WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "booking_slots_read_all" ON booking_slots;
CREATE POLICY "booking_slots_read_authenticated" ON booking_slots
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "booking_slots_admin_write" ON booking_slots;
CREATE POLICY "booking_slots_admin_write" ON booking_slots
  FOR ALL
  USING (has_admin_role(auth.uid()))
  WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "service_bookings_select_own" ON service_bookings;
CREATE POLICY "service_bookings_select_own_or_booking_manager" ON service_bookings
  FOR SELECT
  USING (auth.uid() = user_id OR has_booking_manager_role(auth.uid()));

DROP POLICY IF EXISTS "service_bookings_admin_all" ON service_bookings;
CREATE POLICY "service_bookings_booking_manager_all" ON service_bookings
  FOR ALL
  USING (has_booking_manager_role(auth.uid()))
  WITH CHECK (has_booking_manager_role(auth.uid()));

DROP POLICY IF EXISTS "demo_bookings_select_own" ON demo_bookings;
CREATE POLICY "demo_bookings_select_own_or_booking_manager" ON demo_bookings
  FOR SELECT
  USING (auth.uid() = user_id OR has_booking_manager_role(auth.uid()));

DROP POLICY IF EXISTS "demo_bookings_admin_all" ON demo_bookings;
CREATE POLICY "demo_bookings_booking_manager_all" ON demo_bookings
  FOR ALL
  USING (has_booking_manager_role(auth.uid()))
  WITH CHECK (has_booking_manager_role(auth.uid()));

DROP POLICY IF EXISTS "booking_status_logs_select_related_user" ON booking_status_logs;
CREATE POLICY "booking_status_logs_select_related_user_or_booking_manager"
  ON booking_status_logs
  FOR SELECT
  USING (
    has_booking_manager_role(auth.uid())
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

DROP POLICY IF EXISTS "booking_status_logs_admin_all" ON booking_status_logs;
CREATE POLICY "booking_status_logs_booking_manager_all" ON booking_status_logs
  FOR ALL
  USING (has_booking_manager_role(auth.uid()))
  WITH CHECK (has_booking_manager_role(auth.uid()));

DROP POLICY IF EXISTS "racket_condition_checks_select_owner_or_admin"
  ON racket_condition_checks;
CREATE POLICY "racket_condition_checks_select_owner_or_booking_manager"
  ON racket_condition_checks
  FOR SELECT
  USING (
    has_booking_manager_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM demo_bookings
      WHERE demo_bookings.id = racket_condition_checks.demo_booking_id
        AND demo_bookings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "racket_condition_checks_admin_insert"
  ON racket_condition_checks;
CREATE POLICY "racket_condition_checks_booking_manager_insert"
  ON racket_condition_checks
  FOR INSERT
  WITH CHECK (
    checked_by = auth.uid()
    AND has_booking_manager_role(auth.uid())
  );

DROP POLICY IF EXISTS "racket_condition_checks_admin_update"
  ON racket_condition_checks;
CREATE POLICY "racket_condition_checks_booking_manager_update"
  ON racket_condition_checks
  FOR UPDATE
  USING (has_booking_manager_role(auth.uid()))
  WITH CHECK (has_booking_manager_role(auth.uid()));

DROP POLICY IF EXISTS "racket_condition_checks_admin_delete"
  ON racket_condition_checks;
CREATE POLICY "racket_condition_checks_booking_manager_delete"
  ON racket_condition_checks
  FOR DELETE
  USING (has_booking_manager_role(auth.uid()));

DROP POLICY IF EXISTS "condition_photos_public_read" ON storage.objects;

UPDATE storage.buckets
SET public = false
WHERE id = 'condition-photos';

CREATE POLICY "condition_photos_authenticated_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'condition-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "condition_photos_admin_insert" ON storage.objects;
CREATE POLICY "condition_photos_booking_manager_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'condition-photos'
    AND has_booking_manager_role(auth.uid())
  );

DROP POLICY IF EXISTS "condition_photos_admin_update" ON storage.objects;
CREATE POLICY "condition_photos_booking_manager_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'condition-photos'
    AND has_booking_manager_role(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'condition-photos'
    AND has_booking_manager_role(auth.uid())
  );

DROP POLICY IF EXISTS "condition_photos_admin_delete" ON storage.objects;
CREATE POLICY "condition_photos_booking_manager_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'condition-photos'
    AND has_booking_manager_role(auth.uid())
  );

CREATE OR REPLACE FUNCTION can_manage_bookings(p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_booking_manager_role(p_admin_id);
$$;
