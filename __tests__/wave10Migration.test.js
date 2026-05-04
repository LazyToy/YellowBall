const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('libpg-query');

const readMigration = (fileName) =>
  readFileSync(join(process.cwd(), 'supabase/migrations', fileName), 'utf8');

describe('Wave 10 migrations', () => {
  test('PostgreSQL parser 기준으로 SQL 문법이 유효하다', async () => {
    const sql = readMigration('015_wave10_bookings.sql');

    await expect(parse(sql)).resolves.toBeTruthy();
  });

  test('service_bookings has booking constraints, own/admin RLS, and atomic RPC', () => {
    const sql = readMigration('015_wave10_bookings.sql');

    expect(sql).toContain('CREATE TABLE service_bookings');
    expect(sql).toContain('CHECK (tension_main BETWEEN 20 AND 70)');
    expect(sql).toContain('CHECK (tension_cross BETWEEN 20 AND 70)');
    expect(sql).toContain("delivery_method IN ('store_pickup','local_quick','parcel')");
    expect(sql).toContain('no_show_counted BOOLEAN NOT NULL DEFAULT false');
    expect(sql).toContain('ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY');
    expect(sql).not.toContain('CREATE POLICY "service_bookings_insert_own"');
    expect(sql).not.toContain('FOR INSERT\n  WITH CHECK (auth.uid() = user_id)');
    expect(sql).toContain('CREATE POLICY "service_bookings_admin_all"');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION create_service_booking_transaction');
    expect(sql).toContain('SECURITY DEFINER');
    expect(sql).toContain('SET search_path = public');
    expect(sql).toContain('auth.uid() IS NULL OR auth.uid() <> p_user_id');
    expect(sql).toContain("status <> 'active'");
    expect(sql).toContain('owner_id = p_user_id');
    expect(sql).toContain('is_active = true');
    expect(sql).toContain("p_delivery_method IN ('local_quick','parcel')");
    expect(sql).toContain('addresses');
    expect(sql).toContain('SET reserved_count = reserved_count + 1');
    expect(sql).toContain("AND service_type = 'stringing'");
  });

  test('demo_bookings excludes string fields and rejects overlapping active rentals', () => {
    const sql = readMigration('015_wave10_bookings.sql');
    const demoTable = sql.slice(
      sql.indexOf('CREATE TABLE demo_bookings'),
      sql.indexOf('ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY'),
    );

    expect(demoTable).toContain('CREATE TABLE demo_bookings');
    expect(demoTable).toContain('expected_return_time TIMESTAMPTZ NOT NULL');
    expect(demoTable).toContain('CHECK (start_time < expected_return_time)');
    expect(demoTable).toContain(
      "'requested','approved','in_use','returned',",
    );
    expect(demoTable).not.toContain('string_id');
    expect(demoTable).not.toContain('tension');
    expect(sql).toContain('ALTER TABLE demo_bookings ENABLE ROW LEVEL SECURITY');
    expect(sql).not.toContain('CREATE POLICY "demo_bookings_insert_own"');
    expect(sql).not.toContain('FOR INSERT\n  WITH CHECK (auth.uid() = user_id)');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION create_demo_booking_transaction');
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS btree_gist');
    expect(sql).toContain('demo_bookings_no_active_overlap');
    expect(sql).toContain("tstzrange(start_time, expected_return_time, '[)') WITH &&");
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain("demo_rackets.status = 'active'");
    expect(sql).toContain('demo_rackets.is_demo_enabled = true');
    expect(sql).toContain('demo_rackets.is_active = true');
    expect(sql).toContain('p_start_time <> v_slot.start_time');
    expect(sql).toContain("status IN ('requested','approved','in_use','overdue')");
    expect(sql).toContain("AND service_type = 'demo'");
  });
});
