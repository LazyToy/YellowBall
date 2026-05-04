const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('libpg-query');

const readMigration = (fileName) =>
  readFileSync(join(process.cwd(), 'supabase/migrations', fileName), 'utf8');

describe('Wave 12 migration', () => {
  test('PostgreSQL parser 기준으로 SQL 문법이 유효하다', async () => {
    const sql = readMigration('017_wave12_cancellations_condition_checks.sql');

    await expect(parse(sql)).resolves.toBeTruthy();
  });

  test('예약 취소와 노쇼 RPC가 24시간 정책과 counted 카운트를 적용한다', () => {
    const sql = readMigration('017_wave12_cancellations_condition_checks.sql');

    expect(sql).toContain('CREATE OR REPLACE FUNCTION user_cancel_service_booking');
    expect(sql).toContain("v_slot_start - INTERVAL '24 hours'");
    expect(sql).toContain("status = 'cancelled_user'");
    expect(sql).toContain('GREATEST(reserved_count - 1, 0)');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION record_service_booking_no_show');
    expect(sql).toContain("status = 'no_show'");
    expect(sql).toContain('no_show_counted = true');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION create_service_booking_transaction');
    expect(sql).toContain('v_no_show_count >= 3');
    expect(sql).toContain('no_show_counted = true');
  });

  test('racket_condition_checks는 전후 체크, photo_urls 배열, RLS, Storage 버킷을 가진다', () => {
    const sql = readMigration('017_wave12_cancellations_condition_checks.sql');

    expect(sql).toContain('CREATE TABLE racket_condition_checks');
    expect(sql).toContain("check_type TEXT NOT NULL CHECK (check_type IN ('before_rental','after_return'))");
    expect(sql).toContain("photo_urls TEXT[] NOT NULL DEFAULT '{}'");
    expect(sql).toContain('ALTER TABLE racket_condition_checks ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('racket_condition_checks_select_owner_or_admin');
    expect(sql).toContain('racket_condition_checks_admin_insert');
    expect(sql).toContain("VALUES ('condition-photos', 'condition-photos', true)");
    expect(sql).toContain('condition_photos_admin_insert');
  });
});
