# Phase 1G/1H 프롬프트 (PR-24 ~ PR-32)

> ⚠️ 각 프롬프트 앞에 `00_common.md`의 공통 블록을 붙여서 전달하세요.

---

## PR-24 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-24: 시타 라켓 관리(관리자)를 구현해줘.
현재: PR-14 완료

[구현 단계]
1. supabase/migrations:
   CREATE TABLE demo_rackets (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     brand TEXT NOT NULL, model TEXT NOT NULL,
     grip_size TEXT, weight INT, head_size TEXT,
     photo_url TEXT, description TEXT,
     status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','maintenance','damaged','sold','hidden')),
     is_demo_enabled BOOLEAN DEFAULT true, is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   RLS: 사용자→active+enabled만 SELECT, 관리자→can_manage_demo_rackets

2. src/services/demoRacketService.ts:
   getDemoRackets(사용자용), getAllDemoRackets(관리자용)
   addDemoRacket, updateDemoRacket, updateStatus

3. app/(admin)/demo-rackets/ — 목록, 등록, 상세/수정, 상태 드롭다운
   디자인 레퍼런스: YellowBall_v0.1/app/admin/demo/ + YellowBall_v0.1/components/admin/admin-demo-calendar.tsx 참조

4. isAvailableForBooking(racket, slot) 로직

[완료 조건]
- CRUD, 6개 상태 전환, 비활성 사용자 미노출, can_manage_demo_rackets 권한 체크
```

## PR-24 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-24: 시타 라켓 관리

[정적] □ status CHECK 6값 □ RLS 사용자/관리자 분리 □ is_demo_enabled 조건
[동적] □ CRUD □ 상태 변경 □ 비활성 미노출 □ 권한 체크 □ 전체 회귀
```

---

## PR-25 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-25: 시타 예약 생성 + 조회를 구현해줘.
현재: PR-24(시타 라켓), PR-19(슬롯) 완료

[구현 단계]
1. supabase/migrations:
   CREATE TABLE demo_bookings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     demo_racket_id UUID REFERENCES demo_rackets(id),
     slot_id UUID REFERENCES booking_slots(id),
     start_time TIMESTAMPTZ NOT NULL, expected_return_time TIMESTAMPTZ NOT NULL,
     actual_return_time TIMESTAMPTZ,
     status TEXT DEFAULT 'requested' CHECK (status IN (
       'requested','approved','in_use','returned',
       'cancelled_user','cancelled_admin','rejected','no_show','overdue')),
     user_notes TEXT, admin_notes TEXT,
     created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
   );
   RLS: 본인 읽기/생성, 관리자 전체

2. src/services/demoBookingService.ts:
   createDemoBooking: 라켓 가용+제재+시간중복 체크 → INSERT → count+1
   getMyDemoBookings, getDemoBookingDetail

3. 화면: 시타 가능 라켓 목록 → 선택 → 날짜/시간 → 반납 예정 → 확인
   디자인 레퍼런스: YellowBall_v0.1/components/app/demo-rackets.tsx 참조
   ※ 스트링/텐션 선택 없음 (PRD 명시)

4. 같은 라켓 같은 시간대 중복 예약 거부

[완료 조건]
- 생성 성공, 시간 중복 거부, 비활성 거부, 스트링/텐션 입력 없음
```

## PR-25 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-25: 시타 예약 생성 + 조회

[정적] □ 스트링/텐션 필드 없음 □ 시간 중복 로직 □ expected_return_time 필수
[동적] □ 정상 생성 □ 중복 거부 □ 비활성 거부 □ 제재 거부 □ 조회 □ 전체 회귀
```

---

## PR-26 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-26: 시타 예약 관리(관리자)를 구현해줘.
현재: PR-25 완료

[구현 단계]
1. src/services/adminDemoBookingService.ts:
   approveDemo(id, adminId): requested→approved
   rejectDemo(id, adminId, reason): requested→rejected, count-1
   markInUse(id, adminId): approved→in_use
   markReturned(id, adminId, actualReturnTime): in_use→returned
   markOverdue(id, adminId): 반납 지연
   모든 변경 → booking_status_logs (booking_type='demo')

2. app/(admin)/demo-bookings/ — 목록, 상세, 액션 버튼

[완료 조건]
- 승인/거절 동작, 반납 처리, 로그 기록
```

## PR-26 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-26: 시타 예약 관리

[정적] □ 상태 전환 규칙 완전성 □ booking_status_logs에 booking_type='demo'
[동적] □ 각 상태 전환 □ 무효 전환 거부 □ 로그 확인 □ 전체 회귀
```

---

## PR-27 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-27: 시타 전후 상태 체크를 구현해줘.
현재: PR-26 완료

[구현 단계]
1. supabase/migrations:
   CREATE TABLE racket_condition_checks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     demo_booking_id UUID REFERENCES demo_bookings(id),
     check_type TEXT NOT NULL CHECK (check_type IN ('before_rental','after_return')),
     photo_urls TEXT[], scratch_notes TEXT,
     string_condition TEXT, grip_condition TEXT,
     damage_detected BOOLEAN DEFAULT false, deposit_deduction INT DEFAULT 0,
     checked_by UUID REFERENCES profiles(id),
     checked_at TIMESTAMPTZ DEFAULT now()
   );
   RLS: 관리자 CRUD, 본인(demo_booking 주인) 읽기

2. src/services/conditionCheckService.ts: addCheck(사진 포함), getChecks(bookingId)

3. Storage: condition-photos 버킷

4. 관리자 UI: 대여 전/후 체크 폼 (사진, 상태, 파손, 보증금)

[완료 조건]
- 전/후 체크 기록, 사진 업로드, 본인 조회 가능
```

## PR-27 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-27: 시타 전후 상태 체크

[정적] □ check_type CHECK □ RLS 관리자/사용자 분리 □ photo_urls 배열
[동적] □ 전/후 기록 □ 사진 업로드 □ 사용자 조회 □ 전체 회귀
```

---

## PR-28 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-28: 사용자 제재를 구현해줘.
현재: PR-14, PR-16 완료

[구현 단계]
1. src/services/userManagementService.ts:
   - suspendUser(userId, adminId, reason):
     profiles.status='suspended', 활성 예약 전체 취소, audit_logs 기록
   - unsuspendUser(userId, adminId): status='active', audit_logs
   - getSuspendedUsers()

2. app/(admin)/users/ — 사용자 검색, 제재/해제, 노쇼 카운트 표시
   디자인 레퍼런스: YellowBall_v0.1/app/admin/customers/ 참조

[완료 조건]
- 제재시 status 변경, 활성 예약 취소, 해제 후 정상 이용, can_ban_users 권한, audit 기록
```

## PR-28 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-28: 사용자 제재

[정적] □ can_ban_users 권한 체크 □ 활성 예약 취소 로직 □ audit_logs 연동
[동적] □ 제재/해제 □ 예약 취소 연쇄 □ 감사로그 □ 로그인 차단 확인 □ 전체 회귀
```

---

## PR-29 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-29: 푸시 알림 인프라를 구현해줘.
현재: PR-06 완료

[구현 단계]
1. supabase/migrations:
   CREATE TABLE notifications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     title TEXT NOT NULL, body TEXT NOT NULL,
     notification_type TEXT, data JSONB,
     read BOOLEAN DEFAULT false,
     sent_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
   );
   RLS: 본인만 ALL

2. expo-notifications 설치, 권한 요청, 푸시 토큰→profiles 또는 별도 테이블

3. src/services/notificationService.ts:
   registerPushToken, getNotifications, markAsRead, markAllAsRead

4. 알림 목록 화면 (읽음/미읽음, 타입별 아이콘)

[완료 조건]
- 토큰 등록, 알림 목록 조회, 읽음 처리, RLS 본인만
```

## PR-29 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-29: 푸시 알림 인프라

[정적] □ RLS own 정책 □ ON DELETE CASCADE □ data JSONB
[동적] □ 토큰 등록 □ 목록 조회 □ 읽음 처리 □ 전체 회귀
```

---

## PR-30 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-30: 예약/작업 알림 트리거를 구현해줘.
현재: PR-29, PR-22 완료

[구현 단계]
1. supabase/functions/send-notification/index.ts (Edge Function):
   상태변경 시 notifications INSERT + Expo Push API 호출

2. 알림 메시지 (한국어):
   requested → "예약이 접수되었습니다"
   approved → "예약이 승인되었습니다"
   rejected → "예약이 거절되었습니다" + 사유
   in_progress → "작업이 시작되었습니다"
   completed → "작업이 완료되었습니다"
   reschedule_requested → "일정 변경이 제안되었습니다"
   신규 예약 → 관리자: "새로운 예약이 접수되었습니다"

3. notification_preferences 연동: booking_notifications=false면 미발송, quiet_hours 지연/무음

[완료 조건]
- 상태 변경시 알림 생성, 수신설정 존중, 한국어 내용, 관리자 알림 발송
```

## PR-30 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-30: 예약/작업 알림 트리거

[정적] □ 모든 상태에 대응 메시지 정의 □ preferences 체크 □ Edge Function 구조
[동적] □ 각 상태 알림 생성 □ 수신 OFF 미발송 □ 관리자 알림 □ 전체 회귀
```

---

## PR-31 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-31: 관리자 알림센터를 구현해줘.
현재: PR-29, PR-14 완료

[구현 단계]
1. 관리자 알림 대상: 신규 예약, 취소, 변경 요청, 반납 지연, 노쇼 위험 예약
2. notifications 테이블 활용 (notification_type으로 구분)
3. app/(admin)/notifications.tsx — 관리자 알림 목록, 미읽음 뱃지, 타입 필터
   디자인 레퍼런스: YellowBall_v0.1/components/admin/admin-topbar.tsx (알림 버튼) 참조

[완료 조건]
- 관리자 알림 목록, 미읽음 뱃지, 타입별 필터
```

## PR-31 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-31: 관리자 알림센터

[정적] □ notification_type이 PRD 이벤트 커버
[동적] □ 목록 조회 □ 읽음 처리 □ 필터 □ 전체 회귀
```

---

## PR-32 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-32: RLS 종합 검증 + 보안 강화를 구현해줘.
현재: 전체 PR 완료

[구현 단계]
1. 전체 테이블 × 역할(user/admin/super_admin/anon) × 작업(CRUD) 매트릭스 작성

2. supabase/tests/rls_tests.sql 작성:
   - 일반 사용자가 타인 데이터 접근 불가
   - 일반 사용자가 관리자 테이블 접근 불가
   - 관리자가 부여된 권한 내에서만 작업
   - Super Admin 전체 접근
   - 비인증(anon) 완전 차단

3. 보안 체크리스트 실행:
   □ profiles: 본인 R/W, 관리자 읽기
   □ addresses, user_rackets, user_string_setups, notification_preferences: 본인만
   □ string_catalog: 전체 읽기(active), 관리자 CRUD
   □ admin_permissions: Super Admin만, 본인 읽기
   □ audit_logs: Super Admin 읽기, admin INSERT
   □ shop_schedule, closed_dates, booking_slots: 전체 읽기, 관리자 CRUD
   □ service_bookings, demo_bookings: 본인 읽기/생성, 관리자 전체
   □ demo_rackets: 활성만 읽기, 관리자 CRUD
   □ racket_condition_checks: 관리자 CRUD, 본인 읽기
   □ notifications: 본인만
   □ app_settings: 전체 읽기, Super Admin 쓰기

4. service_role 클라이언트 미노출 grep, .env .gitignore 확인

[완료 조건]
- 전체 RLS 테스트 통과
- 타인 데이터 접근 불가
- anon 완전 차단
- 관리자 범위 제한 동작
- service_role 미노출
```

## PR-32 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-32: RLS 종합 검증 + 보안 강화

[정적 검증]
□ 모든 public 테이블에 RLS ENABLE 존재 (하나라도 빠지면 FAIL)
□ 모든 테이블에 최소 1개 RLS 정책 존재
□ service_role 키가 클라이언트 코드에 없음 (grep 'service_role' src/)
□ .env 파일이 .gitignore에 포함

[동적 검증]
□ 전체 RLS 매트릭스 테스트 실행
□ user 역할: 본인 데이터만 접근, 타인 거부
□ admin 역할: 권한 범위 내만 접근, 밖은 거부
□ super_admin 역할: 전체 접근
□ anon(비인증): 모든 테이블 접근 거부

[논리 검증]
□ SELECT 정책이 지나치게 넓지 않은가
□ 불필요한 DELETE 정책이 열려있지 않은가
□ FOR ALL 정책이 의도된 것인지 (INSERT/UPDATE/DELETE 분리 필요 여부)
```
