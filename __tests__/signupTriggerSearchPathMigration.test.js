const fs = require('fs');
const path = require('path');
const { parse } = require('libpg-query');

const migrationPath = path.resolve(
  __dirname,
  '../supabase/migrations/028_harden_signup_trigger_search_path.sql',
);

describe('signup trigger search path hardening migration', () => {
  test('SQL syntax is valid', async () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const result = await parse(sql);

    expect(result.stmts.length).toBeGreaterThanOrEqual(1);
  });

  test('handle_new_user uses stable public schema resolution', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('SECURITY DEFINER SET search_path = public');
    expect(sql).toContain('INSERT INTO public.profiles');
    expect(sql).toContain('INSERT INTO public.notification_preferences');
  });
});
