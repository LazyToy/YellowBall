# YellowBall QA 검증 결과
날짜: 2026-05-04
검증자: QA Agent
Supabase 연결: ✅ 완료
대상: PR-01 ~ PR-32 + Google Play 배포 준비

## 전체 요약
| Wave | 포함 PR | 결과 | 실패 PR |
|------|---------|------|---------|
| Wave 1 | PR-01 | ✅ PASS | - |
| Wave 2 | PR-02, PR-03 | ✅ PASS / ⚠️ WARN | - |
| Wave 3 | PR-04 | ✅ PASS | - |
| Wave 4 | PR-05 | ✅ PASS / ⚠️ WARN | - |
| Wave 5 | PR-06 | ✅ PASS | - |
| Wave 6 | PR-07, PR-08, PR-09, PR-10, PR-11, PR-14, PR-29 | ✅ PASS / ⚠️ WARN | - |
| Wave 7 | PR-15, PR-16, PR-17, PR-24 | ✅ PASS / ⚠️ WARN | - |
| Wave 8 | PR-13, PR-18, PR-28 | ✅ PASS / ⚠️ WARN | - |
| Wave 9 | PR-12, PR-19 | ✅ PASS / ⚠️ WARN | - |
| Wave 10 | PR-20, PR-25 | ✅ PASS / ⚠️ WARN | - |
| Wave 11 | PR-21, PR-22, PR-26, PR-30, PR-31 | ✅ PASS / ⚠️ WARN | - |
| Wave 12 | PR-23, PR-27 | ✅ PASS / ⚠️ WARN | - |
| Wave 13 | PR-32 | ✅ PASS / ⚠️ WARN | - |
| Google Play | 배포 준비 | ❌ FAIL | Privacy Policy 공개 URL, EAS build |

## 마이그레이션 현황
| 파일명 | 적용 여부 | 비고 |
|--------|----------|------|
| 001_create_profiles.sql | ✅ | 원격 적용 |
| 002_create_signup_triggers.sql | ✅ | 원격 적용 |
| 003_addresses.sql | ✅ | 원격 적용 |
| 004_user_rackets.sql | ✅ | 원격 적용 |
| 005_admin_permissions.sql | ✅ | 원격 적용 |
| 006_notifications.sql | ✅ | 원격 적용 |
| 007_wave6_hardening.sql | ✅ | 원격 적용 |
| 008_administrator_audit_logs.sql | ✅ | 실제 테이블명 `administrator_audit_logs` |
| 009_string_catalog.sql | ✅ | 원격 적용 |
| 010_demo_rackets.sql | ✅ | 원격 적용 |
| 011_shop_schedule_closed_dates.sql | ✅ | 원격 적용, 기본 7일 데이터 확인 |
| 012_string_catalog_public_active_read.sql | ✅ | 원격 적용 |
| 013_user_string_setups.sql | ✅ | 원격 적용 |
| 014_booking_slots.sql | ✅ | 원격 적용 |
| 015_wave10_bookings.sql | ✅ | 원격 적용 |
| 016_wave11_booking_management.sql | ✅ | 원격 적용 |
| 017_wave12_cancellations_condition_checks.sql | ✅ | 원격 적용 |
| 018_rls_security_hardening.sql | ✅ | 원격 적용 |
| 019_profiles_sensitive_update_hardening.sql | ✅ | 원격 적용, profiles 민감 컬럼 직접 UPDATE 차단 |
| 020_profile_sensitive_helper_privileges.sql | ✅ | 원격 적용 |
| 021_admin_storage_photo_policies.sql | ✅ | 원격 적용, string/demo photo 정책 보강 |
| 022_user_suspension_transaction.sql | ✅ | 원격 적용, 사용자 제재 트랜잭션 RPC |
| 023_booking_helper_execute_hardening.sql | ✅ | 원격 적용, `can_manage_bookings` 직접 EXECUTE 차단 |

원격 Supabase 확인:
- 적용 마이그레이션: 23개
- public 테이블: 18개
- RLS 비활성 public 테이블: 0개
- public/storage 정책: 50개
- Storage buckets: `racket-photos` public, `string-photos` public, `demo-racket-photos` public, `condition-photos` private
- 전체 SQL parse: 001~023 모두 OK
- `can_manage_bookings(uuid)`: anon=false, authenticated=false
- `admin_suspend_user_transaction(...)`: authenticated=true, anon=false

## PR별 상세 결과

### PR-01: Expo 프로젝트 초기화
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | - | N/A | 마이그레이션 없음 |
| 정적 | Expo/Jest/TS/path alias | ✅ | 설정 파일 확인 |
| 동적 | 전체 테스트/lint | ✅ | 58 suites / 209 tests PASS, lint PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-02: Supabase 연동 + 핵심 DB 스키마
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | profiles/RLS/signup trigger | ✅ | 001, 002 원격 적용 |
| 정적 | anon key only/SecureStore | ✅ | `src/services/supabase.ts` |
| 동적 | Supabase REST/테이블 확인 | ✅ | 주요 테이블 200 OK 및 원격 테이블 확인 |

**발견된 문제:** 없음  
**논리적 지적:** 전화번호/username 중복 사전조회는 RLS UX 한계가 있어 RPC/Edge Function 권장.

### PR-03: 디자인 시스템 기반
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | theme/components/NativeWind | ✅ | 공통 컴포넌트 및 설정 확인 |
| 동적 | designSystem 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** className 렌더링 회귀 테스트는 제한적임.

### PR-04: 네비게이션 + 인증 가드
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | auth guard/tabs/admin guard | ✅ | 관련 파일 확인 |
| 동적 | 관련 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-05: 회원가입
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | signup trigger/preferences | ✅ | 002 적용 |
| 정적 | validation/register/signUp | ✅ | 관련 파일 확인 |
| 동적 | 관련 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** Auth phone 입력 경로 문서화 권장.

### PR-06: 로그인 + 세션 + 로그아웃
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | signIn/signOut/session/status 차단 | ✅ | `authService.ts`, hooks 확인 |
| 동적 | 관련 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-07: 프로필 조회/수정
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 보안 | role/status/expo_push_token 직접 UPDATE 차단 | ✅ | 019/020, 원격 column privilege 확인 |
| 정적 | nickname/phone 수정 | ✅ | profile 관련 서비스/화면 확인 |
| 동적 | Wave 6/전체 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** phone 중복 체크 RPC 권장.

### PR-08: 주소 관리
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | addresses/RLS/default unique | ✅ | 003 적용 |
| 정적 | CRUD/default/delete | ✅ | `addressService.ts` |
| 동적 | 관련 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 기본 주소 변경은 RPC 원자화 권장.

### PR-09: 알림 수신 설정
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | notification_preferences | ✅ | 002 적용 |
| 정적 | booking/marketing/quiet hours | ✅ | 관련 파일 확인 |
| 동적 | 관련 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 예약 알림 OFF UX 테스트 보강 권장.

### PR-10: 계정 삭제/탈퇴
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 보안 | 직접 status UPDATE 차단 | ✅ | 019/020 적용 후 확인 |
| 정적 | 계정 삭제 RPC | ✅ | `authService.ts`, `account-deletion.tsx` |
| 동적 | 전체 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** Play 정책상 기능은 앱 안에 있으나 물리 삭제가 아닌 `deleted_pending` 전환임을 스토어/정책 문서에 명확히 적어야 함.

### PR-11: 내 라켓 라이브러리
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | user_rackets/RLS/storage | ✅ | 004 적용 |
| 정적 | CRUD/primary/photo | ✅ | 관련 서비스/화면 확인 |
| 동적 | 관련 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** primary 변경 RPC 원자화 권장.

### PR-12: 사용자 스트링 세팅
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | tension/check/hybrid/RLS | ✅ | 013 원격 constraint/policy 확인 |
| 정적 | CRUD | ✅ | `stringSetupService.ts` |
| 동적 | Wave 9 테스트 | ✅ | 3 suites / 14 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-13: 스트링 카탈로그 조회
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | active read policy | ✅ | 012/018 적용 |
| 정적 | 검색/필터/활성 조회 | ✅ | string catalog 서비스 확인 |
| 동적 | Wave 8 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-14: 권한 체계 + Super Admin
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 보안 | role/status 직접 변경 차단 | ✅ | 019/020 확인 |
| 정적 | RPC 기반 role/status 관리 | ✅ | admin/user management 서비스 확인 |
| 동적 | 전체 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 하위 관리자 권한 매핑 회귀 테스트 추가 권장.

### PR-15: 관리자 임명/해임 + 권한 위임
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | super_admin 체크/자기 해임 방지 | ✅ | `adminService.ts` |
| 정적 | permissions CRUD | ✅ | `admin_permissions` RLS 및 서비스 확인 |
| 동적 | Wave 7 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-16: 관리자 행동 로그
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | administrator_audit_logs/RLS/JSONB | ✅ | 008/018 적용 |
| 정적 | logAction/getAuditLogs/withAudit | ✅ | `auditService.ts` |
| 동적 | Wave 7 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 일반 사용자 SELECT 차단 실연동 시나리오 추가 권장.

### PR-17: 스트링 카탈로그 관리자 CRUD
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | string_catalog/RLS/deactivation | ✅ | 009/018 적용 |
| 스토리지 | `string-photos` 정책 | ✅ | 021 후 원격 SELECT/INSERT/UPDATE/DELETE 정책 확인 |
| 동적 | Wave 7 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-18: 영업시간 + 휴무일
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | schedule/closed_dates/RLS | ✅ | 011 적용, 7일 데이터 확인 |
| 정적 | CRUD | ✅ | `scheduleService.ts` |
| 동적 | Wave 8 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-19: 예약 슬롯 생성
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | slot constraints/RLS | ✅ | 014 원격 constraint 확인 |
| 정적 | 슬롯 CRUD/가용 조회 | ✅ | `slotService.ts` |
| 동적 | Wave 9 테스트 | ✅ | 3 suites / 14 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** timezone/영업시간 경계값 테스트 보강 권장.

### PR-20: 스트링 예약 생성
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | service_bookings/RPC/constraints | ✅ | 015 적용 |
| 정적 | 예약 생성/검증/알림 | ✅ | `bookingService.ts` |
| 동적 | Wave 10 테스트 | ✅ | 7 suites / 24 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** `create_service_booking_transaction` anon EXECUTE는 내부 auth 검증으로 차단되지만 표면 축소 revoke 권장.

### PR-21: 예약 조회 (사용자)
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | 내 예약 목록/상세 | ✅ | `bookingService.ts`, 화면 확인 |
| 보안 | 타인 예약 차단 | ✅ | RLS matrix/정책 확인 |
| 동적 | Wave 11 테스트 | ✅ | 6 suites / 17 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-22: 예약 관리 (관리자)
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | booking_status_logs/status RPC | ✅ | 016 적용 |
| 보안 | `can_manage_bookings` 직접 실행 차단 | ✅ | 023 후 원격 anon/authenticated false |
| 동적 | Wave 11 테스트 | ✅ | 6 suites / 17 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** `admin_update_service_booking_status`, `admin_update_demo_booking_status`는 anon EXECUTE가 열려 있으나 내부 `auth.uid()` 검증으로 차단됨. 표면 축소 권장.

### PR-23: 예약 취소 + 노쇼
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | user cancel/no-show RPC | ✅ | 017 적용 |
| 정적 | 24시간 정책/노쇼 카운트 | ✅ | `bookingService.ts`, `noShowService.ts` |
| 동적 | Wave 12 테스트 | ✅ | 9 suites / 28 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** `user_cancel_service_booking`, `record_service_booking_no_show`도 anon EXECUTE 표면 축소 권장.

### PR-24: 시타 라켓 관리
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | demo_rackets/RLS | ✅ | 010/018 적용 |
| 스토리지 | `demo-racket-photos` 정책 | ✅ | 021 후 원격 정책 확인 |
| 동적 | Wave 7 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 삭제 정책은 soft-delete 기준 문서화 권장.

### PR-25: 시타 예약
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | demo_bookings/RPC/exclusion | ✅ | 015 적용 및 원격 constraint 확인 |
| 정적 | 시타 예약 생성/검증/알림 | ✅ | `demoBookingService.ts` |
| 동적 | Wave 10 테스트 | ✅ | 7 suites / 24 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** `create_demo_booking_transaction` anon EXECUTE 표면 축소 권장.

### PR-26: 시타 예약 관리 (관리자)
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | 승인/거절/반납/연체 | ✅ | `adminDemoBookingService.ts` |
| 동적 | Wave 11 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-27: 시타 전후 상태 체크
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | racket_condition_checks/RLS | ✅ | 017/018, 원격 RLS true |
| 스토리지 | `condition-photos` private | ✅ | 원격 bucket public=false, signed URL 코드 확인 |
| 동적 | Wave 12 테스트 | ✅ | 9 suites / 28 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-28: 사용자 제재
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 마이그레이션 | 제재 트랜잭션 RPC | ✅ | 022 적용 |
| 보안 | `can_ban_users`로 예약 취소 포함 처리 | ✅ | 원격 RPC 권한 및 서비스 호출 확인 |
| 동적 | Wave 8 재검증 | ✅ | 관련 3 suites / 16 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-29: Push Notification 인프라
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | expo-notifications 서비스 | ✅ | `notificationService.ts` |
| 보안 | push token 저장 RPC | ✅ | `update_profile_push_token` 사용 |
| 정책 | 첫 실행 즉시 권한 요청 | ✅ | 호출 지점 없음, 서비스 호출 시에만 요청 |

**발견된 문제:** 없음  
**논리적 지적:** 실제 앱 UX에서 명시적 알림 opt-in 버튼/흐름이 필요함.

### PR-30: 예약/작업 알림 트리거
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | 상태별 메시지/preferences/quiet hours | ✅ | `bookingNotificationService.ts` |
| 보안 | Edge Function 권한 검증 | ✅ | `send-notification/index.ts` |
| 회귀 | admin type allowlist 동기화 | ✅ | `sendNotificationFunction.test.js` |
| 동적 | Wave 11 테스트 | ✅ | 6 suites / 17 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-31: 관리자 알림센터
**결과: ✅ PASS**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | 관리자 알림 타입/필터/읽음 | ✅ | `adminNotificationService.ts`, admin notifications 화면 |
| 회귀 | `admin_booking_cancel_requested` 포함 | ✅ | 앱 서비스와 Edge Function 모두 포함 |
| 동적 | Wave 11 테스트 | ✅ | PASS |

**발견된 문제:** 없음  
**논리적 지적:** 없음

### PR-32: RLS 종합 검증 + 보안 강화
**결과: ⚠️ WARN**

| 단계 | 항목 | 결과 | 근거 |
|------|------|------|------|
| 정적 | RLS matrix/rls_tests/hardening | ✅ | `docs/security/rls_matrix.md`, `supabase/tests/rls_tests.sql`, 018/023 |
| 보안 | console.log/service_role/JWT/any grep | ✅ | client 노출 없음, console/JWT/any 매치 없음 |
| 원격 | RLS disabled count | ✅ | public 18 tables, disabled 0 |
| 동적 | Wave 13 테스트 | ✅ | 10 tests PASS |

**발견된 문제:** 없음  
**논리적 지적:** 일부 SECURITY DEFINER RPC의 anon EXECUTE 표면 축소 권장.

## 동적 검증 결과
| 명령 | 결과 | 요약 |
|------|------|------|
| SQL parse 001~023 | ✅ | 모든 migration OK |
| `npm run test -- wave11Migration sendNotificationFunction adminNotificationService bookingNotificationService adminBookingService adminDemoBookingService --runInBand` | ✅ | 6 suites / 17 tests PASS |
| `npm run test -- wave12Migration bookingService noShowService conditionCheckService storageService bookingDetailScreen --runInBand` | ✅ | 9 suites / 28 tests PASS |
| `npm run test -- wave13RlsSecurity --runInBand` | ✅ | 10 tests PASS |
| `npm run test -- --runInBand` | ✅ | 59 suites / 212 tests PASS |
| `npm run lint` | ✅ | PASS, legacy ESLint config warning only |
| `npm run test -- googlePlayReadiness --runInBand` | ✅ | 1 suite / 3 tests PASS |
| `npx expo config --type public` | ✅ | `com.yellowball.mobile`, versionCode 1, privacyPolicyUrl 확인 |
| `npx eas-cli build --platform android --profile production --non-interactive` | ❌ | Expo 계정 인증 필요로 중단 |
| `Invoke-WebRequest https://lazytoy.github.io/privacy/` | ✅ | 공개 URL 200 OK 확인 |

## 보안 종합 점검
| 항목 | 결과 | 비고 |
|------|------|------|
| console.log 잔류 | ✅ 없음 | `rg "console\\.log"` 매치 없음 |
| service_role 클라이언트 노출 | ✅ 없음 | Edge Function env 참조만 존재 |
| 하드코딩 JWT | ✅ 없음 | `rg "eyJ"` 매치 없음 |
| TypeScript any 남용 | ✅ 없음 | `: any`, `as any` 매치 없음 |
| RLS 미적용 테이블 | ✅ 없음 | 원격 public RLS disabled 0 |
| .env.local gitignore | ✅ 포함 | `.gitignore`에 `.env.local`, `.env*.local` 포함 |
| .env.local tracked 여부 | ⚠️ 확인 불가 | 현재 workspace에 `.git` 디렉터리 없음 |
| profiles 민감 컬럼 직접 변경 | ✅ 차단 | role/status/expo_push_token 직접 UPDATE false |
| `can_manage_bookings` 직접 실행 | ✅ 차단 | anon/authenticated false |
| Storage 정책 | ✅ 확인 | condition private, 나머지 public bucket 정책 확인 |
| SECURITY DEFINER RPC anon EXECUTE | ⚠️ WARN | 내부 auth 검증은 있으나 revoke 권장 |

## Google Play 배포 준비
| 항목 | 결과 | 비고 |
|------|------|------|
| app.json name/slug/version | ✅ | `YellowBall`, `yellowball`, `1.0.0` |
| app.json android.package | ✅ | `com.yellowball.mobile` |
| app.json android.versionCode | ✅ | `1` |
| eas.json production profile | ✅ | `build.production.android.buildType=app-bundle`, submit draft/internal |
| Privacy Policy URL 설정 | ✅ | `extra.privacyPolicyUrl=https://lazytoy.github.io/privacy/`, 원문 문서 존재 |
| Privacy Policy URL 공개 접근 | ✅ | `https://lazytoy.github.io/privacy/` 200 OK 확인 |
| 계정 삭제 기능 | ✅ | `app/(tabs)/account-deletion.tsx`에서 앱 내 요청 가능 |
| AndroidManifest 권한 최소화 | ⚠️ | native `android/` 없음, app.json 명시 권한 없음. 실제 manifest는 prebuild/build 후 재확인 필요 |
| expo-notifications 권한 요청 타이밍 | ✅ | 첫 실행 즉시 요청 코드 없음, `registerPushToken()` 호출 시 요청 |
| Android 빌드 성공 | ❌ | `eas build`가 Expo 계정 인증 필요로 중단 |
| production 환경변수 | ⚠️ | EAS Secret은 로그인/프로젝트 연결 전이라 확인 불가 |
| .env.local 빌드 포함 여부 | ⚠️ | `.gitignore` 포함은 확인. 빌드 산출물이 없어 포함 여부 직접 확인 불가 |

## 최종 판정
전체 결과: ❌ 수정 필요

### 수정 필수 항목
1. [Google Play] [해결됨] Privacy Policy URL 공개 접근
   - 재현: `Invoke-WebRequest https://lazytoy.github.io/privacy/` 실행 결과 200 OK를 확인했습니다.
   - 결과: privacy policy 원문, 앱 설정, 실제 공개 URL 접근이 모두 준비되었습니다.

2. [Google Play] [심각도: HIGH] Android production build 성공 검증 미완료
   - 재현: `npx eas-cli build --platform android --profile production --non-interactive` 실행 시 Expo 계정 인증 필요 메시지로 중단.
   - 원인: EAS 로그인 또는 `EXPO_TOKEN`/프로젝트 연결이 현재 검증 환경에 없습니다.
   - 수정 방법: EAS 로그인/프로젝트 연결 및 production EAS Secret 등록 후 `eas build --platform android --profile production`을 실행해 AAB 빌드 성공을 확인하세요.

### 권고 사항
1. `admin_update_service_booking_status`, `admin_update_demo_booking_status`, `create_service_booking_transaction`, `create_demo_booking_transaction`, `user_cancel_service_booking`, `record_service_booking_no_show`의 anon EXECUTE를 명시 revoke해 공격 표면을 줄이세요. 현재는 내부 `auth.uid()` 검증으로 직접 악용은 차단됩니다.
2. native Android manifest는 prebuild/build 후 `INTERNET`, `RECEIVE_BOOT_COMPLETED` 등 실제 생성 권한을 다시 점검하세요.
3. `.git` 디렉터리가 없는 workspace라 `.env.local` tracked 여부는 확인하지 못했습니다. 실제 저장소에서 `git check-ignore -v .env.local`과 `git ls-files .env.local`을 확인하세요.
