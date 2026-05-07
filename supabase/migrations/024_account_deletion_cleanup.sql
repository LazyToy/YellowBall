-- PR-10 보강: 30일 이후 deleted_pending 계정 데이터 삭제
-- Supabase pg_cron 확장을 사용하여 매일 자정에 실행
-- 30일이 지난 deleted_pending 계정의 개인정보를 비식별 처리합니다.

CREATE OR REPLACE FUNCTION cleanup_deleted_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_ids UUID[];
  v_count INT;
BEGIN
  -- 30일 이상 경과한 deleted_pending 계정 수집
  SELECT array_agg(id) INTO v_target_ids
  FROM profiles
  WHERE status = 'deleted_pending'
    AND updated_at <= now() - INTERVAL '30 days';

  IF v_target_ids IS NULL OR array_length(v_target_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  v_count := array_length(v_target_ids, 1);

  -- 1. 예약 이력에 남을 수 있는 사용자 입력값 제거
  UPDATE service_bookings
  SET user_notes = NULL,
      address_id = NULL,
      updated_at = now()
  WHERE user_id = ANY(v_target_ids);

  UPDATE demo_bookings
  SET user_notes = NULL,
      updated_at = now()
  WHERE user_id = ANY(v_target_ids);

  -- 2. 주소 삭제
  DELETE FROM addresses WHERE user_id = ANY(v_target_ids);

  -- 3. 스트링 세팅 삭제
  DELETE FROM user_string_setups WHERE user_id = ANY(v_target_ids);

  -- 4. 예약 이력에서 참조될 수 있으므로 라켓 행은 삭제 대신 비식별 처리
  UPDATE user_rackets
  SET brand = '탈퇴 사용자',
      model = '삭제된 라켓',
      grip_size = NULL,
      weight = NULL,
      balance = NULL,
      photo_url = NULL,
      is_primary = false,
      memo = NULL
  WHERE owner_id = ANY(v_target_ids);

  -- 5. 공개 라켓 사진 객체 정리
  DELETE FROM storage.objects
  WHERE bucket_id = 'racket-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM unnest(v_target_ids) AS id
    );

  -- 6. 알림 삭제
  DELETE FROM notifications WHERE user_id = ANY(v_target_ids);

  -- 7. 알림 설정 삭제
  DELETE FROM notification_preferences WHERE user_id = ANY(v_target_ids);

  -- 8. 프로필 개인정보 비식별 처리 (예약/감사 기록 보존을 위해 행은 유지)
  PERFORM allow_profile_sensitive_update();

  UPDATE profiles
  SET nickname = '탈퇴한 사용자',
      phone = NULL,
      expo_push_token = NULL,
      status = 'deleted',
      updated_at = now()
  WHERE id = ANY(v_target_ids);

  -- 9. 감사 로그 기록
  INSERT INTO administrator_audit_logs (
    actor_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value
  )
  SELECT
    NULL,
    'system.account_cleanup',
    'profiles',
    id,
    jsonb_build_object('status', 'deleted_pending'),
    jsonb_build_object('status', 'deleted', 'cleaned_count', v_count)
  FROM unnest(v_target_ids) AS id
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION cleanup_deleted_accounts() FROM PUBLIC, anon, authenticated;

-- profiles.status CHECK 제약에 'deleted' 추가
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'suspended', 'deleted_pending', 'deleted'));

-- pg_cron 작업 등록은 026_schedule_account_cleanup_cron.sql에서 수행합니다.
