const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('libpg-query');

const readMigration = (fileName) =>
  readFileSync(join(process.cwd(), 'supabase/migrations', fileName), 'utf8');

describe('Wave 11 migration', () => {
  test('PostgreSQL parser 기준으로 SQL 문법이 유효하다', async () => {
    const sql = readMigration('016_wave11_booking_management.sql');

    await expect(parse(sql)).resolves.toBeTruthy();
  });

  test('can_manage_bookings helper execute privilege is revoked after later redefinition', async () => {
    const sql = readMigration('023_booking_helper_execute_hardening.sql');

    await expect(parse(sql)).resolves.toBeTruthy();
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.can_manage_bookings(UUID)');
    expect(sql).toContain('FROM PUBLIC, anon, authenticated');
  });

  test('booking_status_logs has service/demo type, RLS, and status RPCs', () => {
    const sql = readMigration('016_wave11_booking_management.sql');

    expect(sql).toContain('CREATE TABLE booking_status_logs');
    expect(sql).toContain("booking_type TEXT NOT NULL CHECK (booking_type IN ('service','demo'))");
    expect(sql).toContain('ALTER TABLE booking_status_logs ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('booking_status_logs_select_related_user');
    expect(sql).toContain('booking_status_logs_admin_all');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION admin_update_service_booking_status');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION admin_update_demo_booking_status');
    expect(sql).toContain("'service', p_booking_id");
    expect(sql).toContain("'demo', p_booking_id");
    expect(sql).toContain('GREATEST(reserved_count - 1, 0)');
    expect(sql).toContain('can_manage_bookings(p_admin_id)');
    expect(sql).toContain('auth.uid() IS NULL OR auth.uid() <> p_admin_id');
    expect(sql).toContain('허용되지 않는 예약 상태 전환입니다.');
    expect(sql).toContain('허용되지 않는 시타 예약 상태 전환입니다.');

    const serviceReleaseBlock = sql.slice(
      sql.indexOf('v_release_slot := p_new_status IN ('),
      sql.indexOf('AND v_booking.status NOT IN ('),
    );
    expect(serviceReleaseBlock).toContain("'rejected'");
    expect(serviceReleaseBlock).toContain("'cancelled_user'");
    expect(serviceReleaseBlock).toContain("'cancelled_admin'");
    expect(serviceReleaseBlock).not.toContain("'no_show'");
  });
});
