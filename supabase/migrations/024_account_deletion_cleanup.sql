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

  -- 1. 주소 삭제
  DELETE FROM addresses WHERE user_id = ANY(v_target_ids);

  -- 2. 라켓 사진 경로 수집 후 라켓 삭제 (Storage는 별도 정리)
  DELETE FROM user_rackets WHERE owner_id = ANY(v_target_ids);

  -- 3. 스트링 세팅 삭제
  DELETE FROM user_string_setups WHERE user_id = ANY(v_target_ids);

  -- 4. 알림 삭제
  DELETE FROM notifications WHERE user_id = ANY(v_target_ids);

  -- 5. 알림 설정 삭제
  DELETE FROM notification_preferences WHERE user_id = ANY(v_target_ids);

  -- 6. 프로필 개인정보 비식별 처리 (예약/감사 기록 보존을 위해 행은 유지)
  PERFORM allow_profile_sensitive_update();

  UPDATE profiles
  SET nickname = '탈퇴한 사용자',
      phone = NULL,
      expo_push_token = NULL,
      status = 'deleted',
      updated_at = now()
  WHERE id = ANY(v_target_ids);

  -- 7. 감사 로그 기록
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

-- pg_cron 작업 등록 (Supabase 대시보드 > SQL Editor에서 실행)
-- SELECT cron.schedule(
--   'cleanup-deleted-accounts',
--   '0 3 * * *',
--   $$SELECT cleanup_deleted_accounts()$$
-- );
