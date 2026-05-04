CREATE OR REPLACE FUNCTION has_string_manager_role(p_user_id UUID)
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
          AND admin_permissions.can_manage_strings = true
      )
    );
$$;

CREATE OR REPLACE FUNCTION has_demo_racket_manager_role(p_user_id UUID)
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
          AND admin_permissions.can_manage_demo_rackets = true
      )
    );
$$;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('string-photos', 'string-photos', true),
  ('demo-racket-photos', 'demo-racket-photos', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "string_photos_public_read" ON storage.objects;
CREATE POLICY "string_photos_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'string-photos');

DROP POLICY IF EXISTS "string_photos_admin_insert" ON storage.objects;
CREATE POLICY "string_photos_admin_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'string-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND has_string_manager_role(auth.uid())
  );

DROP POLICY IF EXISTS "string_photos_admin_update" ON storage.objects;
CREATE POLICY "string_photos_admin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'string-photos'
    AND has_string_manager_role(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'string-photos'
    AND has_string_manager_role(auth.uid())
  );

DROP POLICY IF EXISTS "string_photos_admin_delete" ON storage.objects;
CREATE POLICY "string_photos_admin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'string-photos'
    AND has_string_manager_role(auth.uid())
  );

DROP POLICY IF EXISTS "demo_racket_photos_public_read" ON storage.objects;
CREATE POLICY "demo_racket_photos_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'demo-racket-photos');

DROP POLICY IF EXISTS "demo_racket_photos_admin_insert" ON storage.objects;
CREATE POLICY "demo_racket_photos_admin_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'demo-racket-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND has_demo_racket_manager_role(auth.uid())
  );

DROP POLICY IF EXISTS "demo_racket_photos_admin_update" ON storage.objects;
CREATE POLICY "demo_racket_photos_admin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'demo-racket-photos'
    AND has_demo_racket_manager_role(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'demo-racket-photos'
    AND has_demo_racket_manager_role(auth.uid())
  );

DROP POLICY IF EXISTS "demo_racket_photos_admin_delete" ON storage.objects;
CREATE POLICY "demo_racket_photos_admin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'demo-racket-photos'
    AND has_demo_racket_manager_role(auth.uid())
  );
