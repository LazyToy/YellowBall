const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('libpg-query');

const readMigration = (fileName) =>
  readFileSync(join(process.cwd(), 'supabase/migrations', fileName), 'utf8');

describe('operation policy runtime migration', () => {
  test('SQL parses and seeds the operation policy setting', async () => {
    const sql = readMigration('042_operation_policy_runtime.sql');

    await expect(parse(sql)).resolves.toBeTruthy();
    expect(sql).toContain("'operation_policy'");
    expect(sql).toContain('"bookingOpenHoursBefore": 2');
    expect(sql).toContain('"stringingRefundHours": 6');
  });

  test('booking and cancellation RPCs read operation_policy instead of fixed constants', () => {
    const sql = readMigration('042_operation_policy_runtime.sql');

    expect(sql).toContain("key = 'operation_policy'");
    expect(sql).toContain("v_policy->>'bookingOpenHoursBefore'");
    expect(sql).toContain("v_policy->>'stringingRefundHours'");
    expect(sql).toContain('make_interval(hours => v_booking_open_hours_before)');
    expect(sql).toContain('make_interval(hours => v_stringing_refund_hours)');
  });
});
