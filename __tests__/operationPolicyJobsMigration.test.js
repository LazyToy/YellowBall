const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('libpg-query');

const readMigration = (fileName) =>
  readFileSync(join(process.cwd(), 'supabase/migrations', fileName), 'utf8');

describe('operation policy jobs migration', () => {
  test('SQL parses and installs the policy execution cron job', async () => {
    const sql = readMigration('043_operation_policy_jobs.sql');

    await expect(parse(sql)).resolves.toBeTruthy();
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS suspended_until');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION process_operation_policy_jobs');
    expect(sql).toContain("cron.schedule(");
    expect(sql).toContain("'operation-policy-jobs'");
  });

  test('policy jobs execute the stored operation policy values', () => {
    const sql = readMigration('043_operation_policy_jobs.sql');

    expect(sql).toContain("v_policy->>'noShowAutoCancelMinutes'");
    expect(sql).toContain("v_policy->>'unpaidAutoCancelMinutes'");
    expect(sql).toContain("v_policy->>'noShowSuspensionDays'");
    expect(sql).toContain("status = 'no_show'");
    expect(sql).toContain("status = 'cancelled'");
    expect(sql).toContain('suspended_until');
  });
});
