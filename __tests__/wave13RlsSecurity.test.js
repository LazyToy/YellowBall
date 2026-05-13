const { readdirSync, readFileSync, statSync } = require('fs');
const { join } = require('path');
const { parse } = require('libpg-query');

const readFile = (path) => readFileSync(join(process.cwd(), path), 'utf8');

const readMigration = (fileName) =>
  readFile(`supabase/migrations/${fileName}`);

const readAllMigrations = () =>
  readdirSync(join(process.cwd(), 'supabase/migrations'))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort()
    .map((fileName) => readMigration(fileName))
    .join('\n');

const readSourceFiles = (directory) => {
  const root = join(process.cwd(), directory);
  const entries = readdirSync(root);

  return entries.flatMap((entry) => {
    const fullPath = join(root, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return readSourceFiles(join(directory, entry));
    }

    if (!/\.(ts|tsx|js|jsx)$/.test(entry)) {
      return [];
    }

    return [readFileSync(fullPath, 'utf8')];
  });
};

describe('Wave 13 RLS security hardening', () => {
  test('PR-32 hardening migration and executable RLS scenario SQL are valid PostgreSQL', async () => {
    await expect(parse(readMigration('018_rls_security_hardening.sql'))).resolves.toBeTruthy();
    await expect(parse(readMigration('019_profiles_sensitive_update_hardening.sql'))).resolves.toBeTruthy();
    await expect(parse(readMigration('020_profile_sensitive_helper_privileges.sql'))).resolves.toBeTruthy();
    await expect(parse(readMigration('021_admin_storage_photo_policies.sql'))).resolves.toBeTruthy();
    await expect(parse(readMigration('022_user_suspension_transaction.sql'))).resolves.toBeTruthy();
    await expect(parse(readMigration('023_booking_helper_execute_hardening.sql'))).resolves.toBeTruthy();
    await expect(parse(readMigration('024_account_deletion_cleanup.sql'))).resolves.toBeTruthy();
    await expect(parse(readMigration('025_revoke_anon_execute_rpcs.sql'))).resolves.toBeTruthy();
    await expect(parse(readMigration('026_schedule_account_cleanup_cron.sql'))).resolves.toBeTruthy();
    await expect(parse(readMigration('041_app_settings_write_policy_no_anon_helper.sql'))).resolves.toBeTruthy();
    await expect(parse(readFile('supabase/tests/rls_tests.sql'))).resolves.toBeTruthy();
  });

  test('all public application tables enable RLS and have at least one policy', () => {
    const sql = readAllMigrations();
    const tables = [
      'profiles',
      'notification_preferences',
      'addresses',
      'user_rackets',
      'admin_permissions',
      'app_settings',
      'notifications',
      'administrator_audit_logs',
      'string_catalog',
      'demo_rackets',
      'shop_schedule',
      'closed_dates',
      'user_string_setups',
      'booking_slots',
      'service_bookings',
      'demo_bookings',
      'booking_status_logs',
      'racket_condition_checks',
    ];

    for (const table of tables) {
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toMatch(new RegExp(`CREATE POLICY[\\s\\S]+?ON ${table}\\b`));
    }
  });

  test('authenticated public reads are narrowed and anon access is blocked', () => {
    const sql = readMigration('018_rls_security_hardening.sql');

    expect(sql).toContain('CREATE POLICY "string_catalog_authenticated_active_read"');
    expect(sql).toContain('auth.uid() IS NOT NULL AND is_active = true');
    expect(sql).toContain('CREATE POLICY "demo_rackets_authenticated_active_read"');
    expect(sql).toContain('auth.uid() IS NOT NULL');
    expect(sql).toContain('CREATE POLICY "shop_schedule_read_authenticated"');
    expect(sql).toContain('CREATE POLICY "closed_dates_read_authenticated"');
    expect(sql).toContain('CREATE POLICY "booking_slots_read_authenticated"');
    expect(sql).toContain('CREATE POLICY "app_settings_read_authenticated"');
    expect(sql).toContain('DROP POLICY IF EXISTS "condition_photos_public_read"');
    expect(sql).toContain("WHERE id = 'condition-photos'");
    expect(sql).toContain('SET public = false');
    expect(sql).toContain('condition_photos_authenticated_read');
  });

  test('admin booking policies require can_manage_bookings rather than only admin role', () => {
    const sql = readMigration('018_rls_security_hardening.sql');

    expect(sql).toContain('CREATE OR REPLACE FUNCTION has_booking_manager_role');
    expect(sql).toContain('admin_permissions.can_manage_bookings = true');
    expect(sql).toContain('service_bookings_booking_manager_all');
    expect(sql).toContain('demo_bookings_booking_manager_all');
    expect(sql).toContain('booking_status_logs_booking_manager_all');
    expect(sql).toContain('racket_condition_checks_booking_manager_insert');
    expect(sql).not.toContain("WHERE id = auth.uid() AND role IN ('admin', 'super_admin')");
  });

  test('can_manage_bookings helper cannot be executed directly by app roles', () => {
    const sql = readMigration('023_booking_helper_execute_hardening.sql');

    expect(sql).toContain('REVOKE ALL ON FUNCTION public.can_manage_bookings(UUID)');
    expect(sql).toContain('FROM PUBLIC, anon, authenticated');
  });

  test('account deletion cleanup anonymizes retained booking dependencies', () => {
    const sql = readMigration('024_account_deletion_cleanup.sql');

    expect(sql).toContain("status = 'deleted'");
    expect(sql).toContain("CHECK (status IN ('active', 'suspended', 'deleted_pending', 'deleted'))");
    expect(sql).toContain('UPDATE service_bookings');
    expect(sql).toContain('address_id = NULL');
    expect(sql).toContain('UPDATE demo_bookings');
    expect(sql).toContain('UPDATE user_rackets');
    expect(sql).toContain("photo_url = NULL");
    expect(sql).toContain('DELETE FROM storage.objects');
    expect(sql).not.toContain('DELETE FROM user_rackets');
  });

  test('SECURITY DEFINER RPCs revoke implicit PUBLIC execute and restore authenticated grants', () => {
    const sql = readMigration('025_revoke_anon_execute_rpcs.sql');

    expect(sql).toContain('FROM PUBLIC, anon');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION create_service_booking_transaction');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION request_profile_account_deletion(UUID) TO authenticated');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION has_admin_role(UUID) TO authenticated');
    expect(sql).toContain('REVOKE ALL ON FUNCTION cleanup_deleted_accounts() FROM PUBLIC, anon, authenticated');
  });

  test('account deletion cleanup is scheduled through pg_cron', () => {
    const sql = readMigration('026_schedule_account_cleanup_cron.sql');

    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS pg_cron');
    expect(sql).toContain("cron.unschedule('cleanup-deleted-accounts')");
    expect(sql).toContain("cron.schedule(");
    expect(sql).toContain("'0 3 * * *'");
    expect(sql).toContain("'SELECT cleanup_deleted_accounts()'");
  });

  test('admin-managed public photo buckets have explicit upload policies', () => {
    const sql = readMigration('021_admin_storage_photo_policies.sql');

    expect(sql).toContain('CREATE OR REPLACE FUNCTION has_string_manager_role');
    expect(sql).toContain('admin_permissions.can_manage_strings = true');
    expect(sql).toContain('CREATE POLICY "string_photos_admin_insert"');
    expect(sql).toContain('CREATE POLICY "string_photos_admin_update"');
    expect(sql).toContain('CREATE POLICY "string_photos_admin_delete"');
    expect(sql).toContain("bucket_id = 'string-photos'");
    expect(sql).toContain('CREATE OR REPLACE FUNCTION has_demo_racket_manager_role');
    expect(sql).toContain('admin_permissions.can_manage_demo_rackets = true');
    expect(sql).toContain('CREATE POLICY "demo_racket_photos_admin_insert"');
    expect(sql).toContain('CREATE POLICY "demo_racket_photos_admin_update"');
    expect(sql).toContain('CREATE POLICY "demo_racket_photos_admin_delete"');
    expect(sql).toContain("bucket_id = 'demo-racket-photos'");
    expect(sql).toContain('auth.uid()::text = (storage.foldername(name))[1]');
  });

  test('profiles, audit logs, admin permissions, and app settings use scoped helper policies', () => {
    const sql = `${readMigration('018_rls_security_hardening.sql')}\n${readMigration('019_profiles_sensitive_update_hardening.sql')}`;

    expect(sql).toContain('CREATE POLICY "profiles_select_admin"');
    expect(sql).toContain('has_admin_role(auth.uid())');
    expect(sql).toContain('has_super_admin_role(auth.uid())');
    expect(sql).toContain('CREATE POLICY "audit_insert_admins"');
    expect(sql).toContain('CREATE POLICY "admin_perm_super"');
    expect(sql).toContain('CREATE POLICY "app_settings_super_write"');
  });

  test('app settings SELECT policy does not evaluate super-admin helper for anon reads', async () => {
    const sql = readMigration('041_app_settings_write_policy_no_anon_helper.sql');

    await expect(parse(sql)).resolves.toBeTruthy();
    expect(sql).toContain('DROP POLICY IF EXISTS "app_settings_super_write"');
    expect(sql).toContain('CREATE POLICY "app_settings_super_insert"');
    expect(sql).toContain('CREATE POLICY "app_settings_super_update"');
    expect(sql).toContain('CREATE POLICY "app_settings_super_delete"');
    expect(sql).toContain('FOR INSERT');
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain('FOR DELETE');
    expect(sql).not.toContain('FOR ALL');
  });

  test('profiles sensitive columns cannot be changed through direct authenticated updates', () => {
    const sql = readMigration('019_profiles_sensitive_update_hardening.sql');
    const rlsTests = readFile('supabase/tests/rls_tests.sql');

    expect(sql).toContain('REVOKE UPDATE ON TABLE profiles FROM anon, authenticated');
    expect(sql).toContain('GRANT UPDATE (nickname, phone, updated_at) ON TABLE profiles TO authenticated');
    expect(sql).toContain('prevent_direct_profile_sensitive_update');
    expect(sql).toContain('admin_set_profile_role');
    expect(sql).toContain('admin_set_profile_status');
    expect(sql).toContain('request_profile_account_deletion');
    expect(sql).toContain('update_profile_push_token');
    expect(sql).toContain('REVOKE ALL ON FUNCTION allow_profile_sensitive_update()');
    expect(sql).toContain('FROM PUBLIC, anon, authenticated');
    expect(rlsTests).toContain('user cannot promote own profile role');
    expect(rlsTests).toContain('user cannot directly update own profile status');
    expect(rlsTests).toContain('user cannot directly update own push token');
  });

  test('RLS matrix documents every PR-32 checklist table', () => {
    const matrix = readFile('docs/security/rls_matrix.md');

    for (const table of [
      'profiles',
      'addresses',
      'user_rackets',
      'user_string_setups',
      'notification_preferences',
      'string_catalog',
      'admin_permissions',
      'administrator_audit_logs',
      'shop_schedule',
      'closed_dates',
      'booking_slots',
      'service_bookings',
      'demo_bookings',
      'demo_rackets',
      'racket_condition_checks',
      'notifications',
      'app_settings',
    ]) {
      expect(matrix).toContain(table);
    }

    expect(matrix).toContain('anon');
    expect(matrix).toContain('can_manage_bookings');
    expect(matrix).toContain('create through RPC');
    expect(matrix).toContain('condition-photos');
    expect(matrix).toContain('private Storage bucket');
  });

  test('service role keys are not exposed in app or shared service code', () => {
    const source = [...readSourceFiles('src'), ...readSourceFiles('app')].join('\n');
    const gitignore = readFile('.gitignore');

    expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|serviceRoleKey|service_role/i);
    expect(gitignore).toContain('.env.local');
    expect(gitignore).toContain('.env*.local');
  });
});
