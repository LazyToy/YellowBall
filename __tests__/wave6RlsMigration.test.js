const { readFileSync } = require('fs');
const { join } = require('path');

const readMigration = (fileName) =>
  readFileSync(join(process.cwd(), 'supabase/migrations', fileName), 'utf8');

describe('Wave 6 RLS/DB hardening migrations', () => {
  test('Super Admin 탈퇴는 DB 트리거로 차단된다', () => {
    const sql = readMigration('007_wave6_hardening.sql');

    expect(sql).toContain('prevent_super_admin_account_deletion');
    expect(sql).toContain("OLD.role = 'super_admin'");
    expect(sql).toContain("NEW.status = 'deleted_pending'");
    expect(sql).toContain('BEFORE UPDATE OF status ON profiles');
  });

  test('Wave 6 소유 데이터 테이블은 RLS와 본인 정책을 갖는다', () => {
    const addresses = readMigration('003_addresses.sql');
    const rackets = readMigration('004_user_rackets.sql');
    const notifications = readMigration('006_notifications.sql');

    expect(addresses).toContain('ALTER TABLE addresses ENABLE ROW LEVEL SECURITY');
    expect(addresses).toContain('auth.uid() = user_id');
    expect(addresses).toContain('WITH CHECK (auth.uid() = user_id)');
    expect(rackets).toContain('ALTER TABLE user_rackets ENABLE ROW LEVEL SECURITY');
    expect(rackets).toContain('auth.uid() = owner_id');
    expect(notifications).toContain(
      'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY',
    );
    expect(notifications).toContain('auth.uid() = user_id');
  });

  test('admin_permissions와 app_settings는 super_admin 정책을 갖는다', () => {
    const sql = readMigration('005_admin_permissions.sql');

    expect(sql).toContain('ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain("role = 'super_admin'");
    expect(sql).toContain('CREATE POLICY "admin_perm_own_read"');
    expect(sql).toContain('ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY');
  });
});
