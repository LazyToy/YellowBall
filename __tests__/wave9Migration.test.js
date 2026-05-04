const { readFileSync } = require('fs');
const { join } = require('path');

const readMigration = (fileName) =>
  readFileSync(join(process.cwd(), 'supabase/migrations', fileName), 'utf8');

describe('Wave 9 migrations', () => {
  test('user_string_setups stores racket string and tension combinations safely', () => {
    const sql = readMigration('013_user_string_setups.sql');

    expect(sql).toContain('CREATE TABLE user_string_setups');
    expect(sql).toContain('REFERENCES user_rackets(id) ON DELETE CASCADE');
    expect(sql).toContain('REFERENCES string_catalog(id)');
    expect(sql).toContain('CHECK (tension_main BETWEEN 20 AND 70)');
    expect(sql).toContain('CHECK (tension_cross BETWEEN 20 AND 70)');
    expect(sql).toContain('CHECK (is_hybrid OR cross_string_id = main_string_id)');
    expect(sql).toContain('ALTER TABLE user_string_setups ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('auth.uid() = user_id');
  });

  test('booking_slots supports public reads, admin writes, capacity checks, and dedupe', () => {
    const sql = readMigration('014_booking_slots.sql');

    expect(sql).toContain('CREATE TABLE booking_slots');
    expect(sql).toContain("service_type IN ('stringing', 'demo')");
    expect(sql).toContain('CHECK (start_time < end_time)');
    expect(sql).toContain('CHECK (reserved_count <= capacity)');
    expect(sql).toContain('CHECK (reserved_count >= 0)');
    expect(sql).toContain('UNIQUE (service_type, start_time)');
    expect(sql).toContain('CREATE POLICY "booking_slots_read_all"');
    expect(sql).toContain("role IN ('admin', 'super_admin')");
  });
});
