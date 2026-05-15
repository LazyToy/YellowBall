# YellowBall 결함 수정 방향 정리

작성일: 2026-05-15  
범위: `test_case_result_llm.md`, `test_case_result_device.md`, 프로젝트 구조, Context7 공식 문서, Supabase MCP 실제 DB 구조 기준

## 1. 확인한 프로젝트 구조

YellowBall은 Expo/React Native 모바일 앱과 Next.js 관리자 웹이 같은 저장소에 있는 구조다.

- 모바일 앱: `app/`, `src/`
  - Expo Router: `app/(auth)`, `app/(tabs)`
  - 예약/라켓/알림 서비스: `src/services`
  - 공통 상태/예약 유틸: `src/utils`
  - 공통 UI: `src/components`
- 관리자 웹: `apps/admin-web`
  - Next.js App Router
  - Server Actions: `apps/admin-web/lib/admin-actions.ts`
  - 관리자 데이터 매핑: `apps/admin-web/lib/admin-data.ts`
  - 관리자 상태 잠금: `apps/admin-web/lib/admin-status-lock.ts`
- DB/Edge Function/migration: `supabase`
  - 실제 DB migration은 Supabase MCP 기준 `20260513021713_operation_policy_jobs`까지 적용됨
- 테스트: `__tests__`
  - Jest/RNTL, migration static test, admin web static test가 혼재

## 2. 공식 문서 확인 요약

Context7 MCP로 최신 공식 문서를 확인했다.

- React Native accessibility: `accessibilityLabel`이 없으면 하위 `Text`를 조합해 읽으므로, 의미가 불명확하거나 빈 문자열이 섞일 수 있는 버튼/Pressable에는 명시 label을 주는 것이 맞다.
  - 참고: https://reactnative.dev/docs/accessibility
- Next.js font: `next/font/google`은 빌드 시 Google Fonts CSS/font 파일을 다운로드해 앱에 self-host한다. 네트워크 제한 CI/로컬에서는 이 단계가 실패할 수 있으므로 `next/font/local` 또는 시스템 폰트 fallback이 안정적이다.
  - 참고: https://nextjs.org/docs/app/getting-started/fonts
- Expo SDK 54: native module이 있는 프로젝트나 dev-client 대상 검증은 Expo Go보다 development build/dev-client 경로가 맞다. native dependency 변경 시 dev-client rebuild가 필요하다.
  - 참고: https://docs.expo.dev/develop/development-builds/use-development-builds/

Supabase MCP 문서와 실제 DB도 확인했다.

- public schema 테이블은 Data API 노출 가능성이 있으므로 RLS를 켜고 정책/RPC로 접근을 제한해야 한다.
  - 참고: https://supabase.com/docs/guides/api/securing-your-api
- Supabase changelog상 2026-04-28에 "Tables not exposed to Data and GraphQL API automatically" breaking change가 있어, 새 테이블/권한 작업 시 Data API 노출 여부와 RLS/GRANT를 같이 확인해야 한다.
  - 참고: https://supabase.com/changelog?tags=database

## 3. Supabase 실제 DB 구조 요약

MCP로 `public` schema를 확인한 결과 핵심 테이블은 모두 RLS가 활성화되어 있다.

핵심 테이블:

- `profiles`: 사용자/관리자 프로필, `role`, `status`, `no_show_suspension_count`
- `admin_permissions`: 관리자 권한, `can_manage_bookings` 등
- `user_rackets`: 사용자 라켓
- `string_catalog`: 스트링 카탈로그
- `booking_slots`: 예약 slot, `capacity`, `reserved_count`, `is_blocked`
- `service_bookings`: 스트링 예약, 상태 check constraint 포함
- `demo_bookings`: 시타 예약
- `booking_status_logs`: 상태 변경 로그
- `notifications`: 사용자 알림

중요 RLS 정책:

- `service_bookings_select_own_or_booking_manager`: 본인 또는 예약 관리자 조회
- `service_bookings_booking_manager_all`: 예약 관리자 전체 작업
- `booking_status_logs_select_related_user_or_booking_manager`: 관련 사용자/예약 관리자 조회
- `booking_status_logs_booking_manager_all`: 예약 관리자 로그 작업
- `notifications_own`: 본인 알림만 작업

중요 RPC:

- `admin_update_service_booking_status(p_booking_id, p_admin_id, p_new_status, p_reason)`
  - `SECURITY DEFINER`
  - 관리자 본인 여부와 `can_manage_bookings` 확인
  - 상태 변경, terminal 상태의 slot release, `booking_status_logs` insert 처리
- `user_cancel_service_booking(p_booking_id, p_user_id)`
  - 사용자 본인 예약 확인
  - 무료 취소 가능 시 `cancelled_user`, slot release, 로그 처리
- `record_service_booking_no_show(p_booking_id, p_admin_id)`
  - `approved`/`visit_pending`만 `no_show` 처리
  - `no_show_counted=true`, 로그 처리

## 4. 결함별 수정 방향

### P0-1. 관리자 웹 상태 변경이 RPC를 우회함

결함:

- `BUG-INT-001`, `BUG-INT-002`, `BUG-INT-006`, `BUG-INT-007`
- 관리자 웹에서 승인/거절/취소 승인 시 `service_bookings.status`만 직접 PATCH되어 상태 로그, 사용자 알림, slot release가 누락된다.

원인 위치:

- `apps/admin-web/lib/admin-actions.ts`
  - `updateServiceBookingStatus()`가 service_role REST `patchRow('service_bookings', ...)`를 직접 호출한다.

수정 방향:

1. `updateServiceBookingStatus()`에서 `requireAdminPermission('can_manage_bookings')` 반환값의 `admin.profile.id`를 actor로 사용한다.
2. 직접 PATCH 대신 Supabase RPC `admin_update_service_booking_status`를 호출한다.
3. RPC 호출에는 로그인한 관리자의 실제 access token 또는 service role + 명시 actor를 사용할지 결정해야 한다.
   - 권장: 서버 액션에서 현재 admin access token으로 RPC 호출해 `auth.uid() = p_admin_id` 검증을 그대로 살린다.
   - service role로 호출하면 `auth.uid()`가 관리자 id가 아닐 수 있어 현재 RPC 검증과 충돌한다.
4. RPC 결과를 받은 뒤 관리자 웹 캐시만 `revalidatePath`로 갱신한다.
5. `src/services/adminBookingService.ts`는 이미 RPC를 사용하므로, admin web도 이 경로와 동등한 동작을 가져야 한다.

추가 테스트:

- 관리자 웹 server action static/unit test에서 `patchRow('service_bookings')` 직접 호출 금지 검증
- 실제 DB 통합 테스트:
  - `requested -> approved` 후 `booking_status_logs` 1건
  - 사용자 `service_approved` 알림 1건
  - `requested -> rejected` 후 `reserved_count` 감소
  - `cancel_requested -> cancelled_admin` 후 `reserved_count` 감소

### P0-2. 상태 전환 그래프가 너무 넓음

결함:

- `STATE-REAL-001`
- DB RPC에서 `requested -> completed` 직접 전환이 성공한다.

원인 위치:

- 실제 DB 함수 `admin_update_service_booking_status`
- 로컬 `src/utils/statusTransition.ts`도 `requested -> completed`, `approved -> completed` 등 점프 전환을 허용한다.

수정 방향:

1. 상태 전환을 단일 truth source로 정한다.
2. 서비스 예약 권장 흐름:
   - `requested -> approved | rejected | cancelled_admin`
   - `approved -> visit_pending | cancelled_admin | cancelled_user`
   - `visit_pending -> racket_received | no_show | cancelled_user`
   - `racket_received -> in_progress`
   - `in_progress -> completed`
   - `completed -> pickup_ready | delivered`
   - `pickup_ready|delivered -> done`
   - `reschedule_requested -> approved | cancelled_admin | cancelled_user`
   - `refund_pending -> refund_done`
3. DB migration으로 `admin_update_service_booking_status` 조건을 위 그래프에 맞춘다.
4. `src/utils/statusTransition.ts`, `apps/admin-web/components/admin/booking-status-menu.tsx` 옵션도 같은 그래프를 기준으로 조정한다.

추가 테스트:

- `requested -> completed` RPC 실패
- `requested -> approved -> visit_pending -> racket_received -> in_progress -> completed` 성공

### P0-3. no_show 처리가 일반 상태 변경과 섞임

결함:

- `BUG-INT-009`, `BUG-INT-010`
- `no_show` 상태에서도 상태 변경 메뉴가 열리고, 일반 RPC로 `no_show` 처리 시 `no_show_counted`가 false로 남을 수 있다.

원인 위치:

- `apps/admin-web/lib/admin-status-lock.ts`
- `apps/admin-web/components/admin/booking-status-menu.tsx`
- `record_service_booking_no_show` RPC와 일반 `admin_update_service_booking_status` 경로 분리

수정 방향:

1. `LOCKED_SERVICE_STATUSES`에 `no_show`를 추가한다.
2. `no_show` 전환은 일반 상태 변경 메뉴에서 직접 호출하지 않게 한다.
3. 노쇼 액션은 `record_service_booking_no_show` 전용 action/service로 분리한다.
4. 관리 UI에서 `visit_pending` 또는 `approved` 상태일 때만 "노쇼 처리" 별도 버튼을 보여준다.

추가 테스트:

- `no_show` 상세에서 상태 변경 메뉴 disabled
- 노쇼 전용 action 호출 후 `status='no_show'`, `no_show_counted=true`, 로그 생성

### P0-4. 마감 임박 사용자 취소 요청이 RLS에 막힘

결함:

- `BUG-INT-005`
- 사용자가 마감 임박 예약 취소 요청 시 `booking_status_logs` 직접 insert가 RLS에 의해 차단된다.

원인 위치:

- `src/services/bookingService.ts`
  - `cancelBooking()`에서 무료 취소가 아닌 경우 `booking_status_logs`에 직접 insert

수정 방향:

1. `request_service_booking_cancellation(p_booking_id, p_user_id)` RPC를 만든다.
2. RPC 내부에서 다음을 검증한다.
   - `auth.uid() = p_user_id`
   - 예약이 본인 소유
   - `canRequestCancellation` 가능한 상태
   - 무료 취소 시간이 지나 관리자 확인이 필요한 조건
3. RPC 내부에서 `booking_status_logs`에 `new_status='cancel_requested'`를 insert한다.
4. 관리자 알림은 현재 DB `notifications`가 본인 row만 허용하므로 둘 중 하나로 정리한다.
   - 권장: RPC 또는 Edge Function/service-role 서버 경로에서 관리자 대상 `notifications` 생성
   - 대안: 관리자 알림은 DB row가 아니라 운영 화면의 취소 요청 로그 기반으로 표시

추가 테스트:

- 본인 예약 취소 요청 성공
- 타인 예약 취소 요청 실패
- anon 취소 요청 실패
- `booking_status_logs`에 `cancel_requested` 생성

### P1-1. 취소/거절 상태 라벨이 접수로 표시됨

결함:

- `BUG-INT-003`, `BUG-INT-008`
- `cancelled_user`, `rejected`가 사용자/관리자 화면에서 `접수`로 표시된다.

원인 위치:

- `src/utils/bookingStatus.ts`
- `apps/admin-web/lib/admin-data.ts`

수정 방향:

1. 서비스 예약 라벨을 실제 운영 상태에 맞춘다.
   - `cancelled_user`: `사용자 취소`
   - `cancelled_admin`: `관리자 취소`
   - `rejected`: `거절`
   - `reschedule_requested`: `일정 변경 요청`
2. work status/timeline용 grouping과 화면 표시 label을 분리한다.
   - 진행 단계 그룹: 접수/승인/작업중/완료
   - 실제 상태 라벨: 취소/거절/노쇼 포함
3. 사용자 앱과 관리자 웹이 같은 label helper를 쓰도록 `src/utils/bookingStatus.ts` 기준으로 맞추거나 admin web에 동기화 테스트를 둔다.

추가 테스트:

- `serviceBookingStatusLabels.cancelled_user === '사용자 취소'`
- admin `statusLabel('rejected') === '거절'`
- 예약 상세/목록 렌더링에서 취소 상태가 접수로 나오지 않음

### P1-2. 명시적 시간 선택 없이 예약 생성 가능

결함:

- `BUG-MOBILE-001`
- `new-booking` 진입 후 사용자가 시간을 직접 선택하지 않아도 첫 slot이 자동 선택되어 예약이 생성된다.

원인 위치:

- `app/(tabs)/new-booking.tsx`
  - `resetForm()`과 `loadSlots()`에서 첫 selectable slot을 자동으로 `slotId`에 넣는다.

수정 방향:

1. 신규 진입 기본값은 `slotId=''`로 둔다.
2. `loadSlots()`는 기존 선택이 아직 유효할 때만 유지하고, 신규 상태에서 첫 slot 자동 선택을 하지 않는다.
3. 사용자가 `SlotPickerRow`를 눌렀는지 추적하는 `hasExplicitSlotSelection` 상태를 둔다.
4. `handleSubmit()`에서 `!slotId || !hasExplicitSlotSelection`이면 `예약 시간을 선택하세요.`로 차단한다.
5. `applyRebook()`처럼 사용자가 다시 예약 항목을 선택한 경우에는 explicit 선택으로 볼지 UX 정책을 정한다.

추가 테스트:

- 화면 진입 후 `예약 접수` 클릭 시 `createBooking` 미호출
- slot 선택 후 `예약 접수` 클릭 시 `createBooking` 호출
- 날짜 변경 시 기존 slot 선택 초기화

### P2-1. 접근성 라벨 개선

결함:

- `BUG-A11Y-001`, `BUG-A11Y-002`, `BUG-MOBILE-002`
- Calendar 날짜 label이 `Select 2026-05-16`으로 영어 노출
- 빈 brand/model 라켓이 ` , 스펙 미등록`처럼 읽힘

원인 위치:

- `src/components/CalendarPicker.tsx`
- `app/(tabs)/new-booking.tsx`
- `app/(tabs)/me.tsx`

수정 방향:

1. 날짜 label helper 추가:
   - `formatDateAccessibilityLabel('2026-05-16') -> '2026년 5월 16일 선택'`
2. 라켓 display helper 추가:
   - brand/model trim 후 둘 다 없으면 `이름 없는 라켓`
   - id가 있으면 보조 fallback: `라켓 ${id.slice(0, 8)}`
3. `RacketSelectPanel`, `MeScreen`, `racket-list`에서 같은 helper 사용
4. 소셜 로그인/가입 버튼은 이미 label prop이 있으므로, UIAutomator에서 wrapper가 `clickable=false`로 보이는 부분은 실제 touch target이 어느 노드인지 XML 기준으로 한 번 더 확인한다.

추가 테스트:

- Calendar button label이 한국어
- 빈 brand/model 라켓 label이 공백으로 시작하지 않음
- `accessibilityRole="button"`과 `accessibilityLabel`이 주요 Pressable에 존재

### P2-2. 정적 테스트와 snapshot 안정화

결함:

- `mobileResponsiveLayout.test.ts`가 구현 문자열에 과하게 의존
- `designSystem.test.tsx` snapshot이 font/wrapper 변경에 취약
- `racketListScreen.test.tsx`, `newBookingScreen.test.tsx` timeout/flaky

수정 방향:

1. static source string test는 실제 렌더/스타일 assertion으로 옮긴다.
2. snapshot은 전체 tree보다 핵심 props/style 단위 assertion으로 줄인다.
3. timeout test는 다음을 점검한다.
   - pending promise mock
   - navigation mock resolve 여부
   - fake timer 사용 여부
   - `waitFor` 조건이 실제 UI 변화와 맞는지

추가 테스트:

- `npm test` 전체 suite green
- `npm run test -- newBookingScreen.test.tsx --runInBand`
- `npm run test -- racketListScreen.test.tsx --runInBand`

### P2-3. 관리자 웹 build가 Google Fonts 네트워크에 의존

결함:

- `npm run admin:build`가 `next/font/google`의 `Geist`, `Manrope` fetch 실패로 깨진다.

원인 위치:

- `apps/admin-web/app/layout.tsx`

수정 방향:

1. `apps/admin-web/public/fonts`에 사용할 폰트를 저장한다.
2. `next/font/local`로 `--font-pretendard`, `--font-display`를 정의한다.
3. 실제 폰트 파일을 추가하지 않을 경우 임시로 system font stack으로 전환해 빌드 네트워크 의존성을 제거한다.
4. `apps/admin-web/app/globals.css`와 `apps/admin-web/styles/globals.css`의 font 변수도 정리한다.

추가 테스트:

- 네트워크 제한 환경에서 `npm run admin:build` 성공
- admin lint warning 별도 정리

## 5. 권장 작업 순서

1. 관리자 웹 `updateServiceBookingStatus`를 RPC 경로로 전환
2. DB 상태 전환 그래프 강화 migration 작성
3. `no_show` 전용 처리와 상태 잠금 정리
4. 마감 임박 취소 요청 RPC 추가
5. 상태 라벨 공통화
6. 신규 예약 slot 명시 선택 validation 추가
7. 접근성 label helper 적용
8. Next.js font build 의존성 제거
9. flaky/static/snapshot 테스트 정리

## 6. 검증 체크리스트

- `npm test`
- `npm run lint`
- `npm run admin:lint`
- `npm run admin:build`
- 실제 Supabase DB 통합 확인:
  - 승인/거절/관리자 취소/취소 승인/no_show 각각 로그와 알림 생성
  - terminal 상태 slot release
  - `requested -> completed` 직접 전환 실패
  - 사용자 마감 임박 취소 요청 성공
- 실제 기기 확인:
  - 명시적 시간 선택 없이 예약 접수 차단
  - 취소/거절 상태 라벨 정상
  - Calendar/라켓 접근성 label 정상

## 7. 주의할 점

- service role 직접 PATCH는 운영 부수효과를 우회하므로 예약 상태 변경에는 쓰지 않는 것이 좋다.
- RLS를 넓게 열어 `booking_status_logs` 사용자 INSERT를 허용하기보다, 검증이 들어간 `SECURITY DEFINER` RPC를 쓰는 편이 안전하다.
- DB RPC와 TypeScript `statusTransition`이 서로 다르면 테스트는 통과해도 실제 DB에서 다른 결과가 난다. 상태 전환은 DB와 앱을 반드시 같이 수정해야 한다.
- 알림은 현재 `notifications_own` 정책 때문에 일반 사용자가 관리자 대상 row를 만들 수 없다. 관리자 알림이 DB row로 필요하면 server-side/service-role 경로 또는 DB 함수 내부 처리로 통합해야 한다.
