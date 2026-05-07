-- PR-20,22,23,25,32 보강: SECURITY DEFINER RPC의 anon EXECUTE 명시 차단
-- 모든 RPC는 내부에서 auth.uid()를 검증하므로 anon 호출은 반드시 실패하지만,
-- 방어 깊이(Defense in Depth)를 위해 명시적으로 차단합니다.

-- PR-20: 스트링 작업 예약 생성
REVOKE ALL ON FUNCTION create_service_booking_transaction(
  UUID, UUID, UUID, UUID, INT, INT, UUID, TEXT, UUID, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_service_booking_transaction(
  UUID, UUID, UUID, UUID, INT, INT, UUID, TEXT, UUID, TEXT
) TO authenticated;

-- PR-25: 시타 예약 생성
REVOKE ALL ON FUNCTION create_demo_booking_transaction(
  UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_demo_booking_transaction(
  UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT
) TO authenticated;

-- PR-22: 관리자 예약 상태 변경
REVOKE ALL ON FUNCTION admin_update_service_booking_status(
  UUID, UUID, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_update_service_booking_status(
  UUID, UUID, TEXT, TEXT
) TO authenticated;

-- PR-26: 관리자 시타 예약 상태 변경
REVOKE ALL ON FUNCTION admin_update_demo_booking_status(
  UUID, UUID, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_update_demo_booking_status(
  UUID, UUID, TEXT, TEXT, TIMESTAMPTZ
) TO authenticated;

-- PR-23: 사용자 예약 취소
REVOKE ALL ON FUNCTION user_cancel_service_booking(
  UUID, UUID
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION user_cancel_service_booking(
  UUID, UUID
) TO authenticated;

-- PR-23: 노쇼 기록
REVOKE ALL ON FUNCTION record_service_booking_no_show(
  UUID, UUID
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION record_service_booking_no_show(
  UUID, UUID
) TO authenticated;

-- PR-28: 사용자 제재 트랜잭션
REVOKE ALL ON FUNCTION admin_suspend_user_transaction(
  UUID, UUID, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_suspend_user_transaction(
  UUID, UUID, TEXT
) TO authenticated;

-- PR-10 보강: 계정 삭제 요청
REVOKE ALL ON FUNCTION request_profile_account_deletion(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION request_profile_account_deletion(UUID) TO authenticated;

-- PR-07: 푸시 토큰 업데이트
REVOKE ALL ON FUNCTION update_profile_push_token(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION update_profile_push_token(UUID, TEXT) TO authenticated;

-- PR-14: 관리자 역할/상태 변경
REVOKE ALL ON FUNCTION admin_set_profile_role(UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_set_profile_status(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_set_profile_role(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_profile_status(UUID, UUID, TEXT) TO authenticated;

-- PR-32: 역할 확인 헬퍼 함수
REVOKE ALL ON FUNCTION has_admin_role(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION has_super_admin_role(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION has_booking_manager_role(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION has_admin_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_super_admin_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_booking_manager_role(UUID) TO authenticated;

-- PR-10 보강: 계정 삭제 클린업
REVOKE ALL ON FUNCTION cleanup_deleted_accounts() FROM PUBLIC, anon, authenticated;
