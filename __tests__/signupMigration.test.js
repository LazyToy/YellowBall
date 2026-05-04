const fs = require('fs');
const path = require('path');
const { parse } = require('libpg-query');

const migrationPath = path.resolve(
  __dirname,
  '../supabase/migrations/002_create_signup_triggers.sql',
);

describe('회원가입 마이그레이션', () => {
  test('PostgreSQL parser 기준으로 SQL 문법이 유효하다', async () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const result = await parse(sql);

    expect(result.stmts.length).toBeGreaterThanOrEqual(6);
  });

  test('profiles 생성 트리거와 알림 설정 기본 레코드를 만든다', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE notification_preferences');
    expect(sql).toContain('ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('noti_pref_own');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION handle_new_user()');
    expect(sql).toContain('NEW.raw_user_meta_data->>\'username\'');
    expect(sql).toContain('NEW.raw_user_meta_data->>\'nickname\'');
    expect(sql).toContain('INSERT INTO notification_preferences (user_id)');
    expect(sql).toContain('CREATE TRIGGER on_auth_user_created');
  });
});
