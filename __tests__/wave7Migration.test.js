const { readFileSync } = require('fs');
const { join } = require('path');

const readMigration = (fileName) =>
  readFileSync(join(process.cwd(), 'supabase/migrations', fileName), 'utf8');

describe('Wave 7 migrations', () => {
  test('admin storage photo policies are valid PostgreSQL', async () => {
    const { parse } = require('libpg-query');
    const sql = readMigration('021_admin_storage_photo_policies.sql');

    await expect(parse(sql)).resolves.toBeTruthy();
  });

  test('administrator_audit_logs는 RLS와 before/after JSONB를 가진다', () => {
    const sql = readMigration('008_administrator_audit_logs.sql');

    expect(sql).toContain('CREATE TABLE administrator_audit_logs');
    expect(sql).toContain('before_value JSONB');
    expect(sql).toContain('after_value JSONB');
    expect(sql).toContain(
      'ALTER TABLE administrator_audit_logs ENABLE ROW LEVEL SECURITY',
    );
    expect(sql).toContain("role = 'super_admin'");
    expect(sql).toContain("role IN ('admin', 'super_admin')");
  });

  test('string_catalog는 관리자 CRUD 정책과 비활성 사유를 가진다', () => {
    const sql = `${readMigration('009_string_catalog.sql')}\n${readMigration('021_admin_storage_photo_policies.sql')}`;

    expect(sql).toContain('CREATE TABLE string_catalog');
    expect(sql).toContain('deactivation_reason TEXT');
    expect(sql).toContain('can_manage_strings = true');
    expect(sql).toContain(
      'ALTER TABLE string_catalog ENABLE ROW LEVEL SECURITY',
    );
    expect(sql).toContain("'string-photos'");
    expect(sql).toContain('CREATE POLICY "string_photos_admin_insert"');
    expect(sql).toContain('CREATE POLICY "string_photos_admin_update"');
    expect(sql).toContain('CREATE POLICY "string_photos_admin_delete"');
    expect(sql).toContain('has_string_manager_role(auth.uid())');
  });

  test('demo_rackets는 6개 상태와 사용자/관리자 RLS 분리를 가진다', () => {
    const sql = `${readMigration('010_demo_rackets.sql')}\n${readMigration('021_admin_storage_photo_policies.sql')}`;

    for (const status of [
      'active',
      'inactive',
      'maintenance',
      'damaged',
      'sold',
      'hidden',
    ]) {
      expect(sql).toContain(`'${status}'`);
    }

    expect(sql).toContain('is_demo_enabled BOOLEAN DEFAULT true');
    expect(sql).toContain('can_manage_demo_rackets = true');
    expect(sql).toContain(
      'ALTER TABLE demo_rackets ENABLE ROW LEVEL SECURITY',
    );
    expect(sql).toContain("'demo-racket-photos'");
    expect(sql).toContain('CREATE POLICY "demo_racket_photos_admin_insert"');
    expect(sql).toContain('CREATE POLICY "demo_racket_photos_admin_update"');
    expect(sql).toContain('CREATE POLICY "demo_racket_photos_admin_delete"');
    expect(sql).toContain('has_demo_racket_manager_role(auth.uid())');
  });
});
