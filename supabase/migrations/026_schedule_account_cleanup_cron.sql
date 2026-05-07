-- PR-10 운영 스케줄: 30일 경과 deleted_pending 계정 클린업
-- 매일 03:00 UTC에 cleanup_deleted_accounts()를 실행합니다.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'cleanup-deleted-accounts'
  ) THEN
    PERFORM cron.unschedule('cleanup-deleted-accounts');
  END IF;

  PERFORM cron.schedule(
    'cleanup-deleted-accounts',
    '0 3 * * *',
    'SELECT cleanup_deleted_accounts()'
  );
END;
$$;
