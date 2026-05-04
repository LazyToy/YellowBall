const fs = require('fs');
const path = require('path');
const { parse } = require('libpg-query');

const migrationPath = path.resolve(
  __dirname,
  '../supabase/migrations/001_create_profiles.sql',
);

describe('profiles 마이그레이션', () => {
  test('PostgreSQL parser 기준으로 SQL 문법이 유효하다', async () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const result = await parse(sql);

    expect(result.stmts).toHaveLength(4);
  });

  test('profiles 테이블과 RLS 정책을 생성한다', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE profiles');
    expect(sql).toContain('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('profiles_select_own');
    expect(sql).toContain('profiles_update_own');
    expect(sql).not.toMatch(/FOR\s+INSERT/i);
    expect(sql).not.toMatch(/DISABLE\s+ROW\s+LEVEL\s+SECURITY/i);
  });
});
