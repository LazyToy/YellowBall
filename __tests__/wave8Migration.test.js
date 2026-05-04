const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('libpg-query');

const readMigration = (fileName) =>
  readFileSync(join(process.cwd(), 'supabase/migrations', fileName), 'utf8');

describe('Wave 8 migrations', () => {
  test('string catalog exposes active rows for user lookup', () => {
    const sql = readMigration('012_string_catalog_public_active_read.sql');

    expect(sql).toContain('CREATE POLICY "string_catalog_public_active_read"');
    expect(sql).toContain('USING (is_active = true)');
    expect(sql).toContain('string_catalog_active_gauge_idx');
  });

  test('shop schedule and closed dates support public read and admin writes', () => {
    const sql = readMigration('011_shop_schedule_closed_dates.sql');

    expect(sql).toContain('CREATE TABLE shop_schedule');
    expect(sql).toContain('CREATE TABLE closed_dates');
    expect(sql).toContain('CHECK (open_time < close_time)');
    expect(sql).toContain('FOR SELECT');
    expect(sql).toContain("role IN ('admin', 'super_admin')");
    expect(sql).toContain('ON CONFLICT (day_of_week) DO NOTHING');
  });

  test('user suspension transaction cancels active bookings with can_ban_users authority', async () => {
    const sql = readMigration('022_user_suspension_transaction.sql');

    await expect(parse(sql)).resolves.toBeTruthy();
    expect(sql).toContain('CREATE OR REPLACE FUNCTION admin_suspend_user_transaction');
    expect(sql).toContain('admin_permissions.can_ban_users = true');
    expect(sql).toContain('UPDATE service_bookings');
    expect(sql).toContain('UPDATE demo_bookings');
    expect(sql).toContain("SET status = 'cancelled_admin'");
    expect(sql).toContain('INSERT INTO booking_status_logs');
    expect(sql).toContain('UPDATE booking_slots');
    expect(sql).toContain('INSERT INTO administrator_audit_logs');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION admin_suspend_user_transaction');
  });
});
