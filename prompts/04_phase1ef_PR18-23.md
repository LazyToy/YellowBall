# Phase 1E/1F 프롬프트 (PR-18 ~ PR-23)

> ⚠️ 각 프롬프트 앞에 `00_common.md`의 공통 블록을 붙여서 전달하세요.

---

## PR-18 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-18: 영업시간 + 휴무일 관리를 구현해줘.
현재: PR-14 완료

[구현 단계]
1. supabase/migrations:
   CREATE TABLE shop_schedule (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
     open_time TIME, close_time TIME,
     is_closed BOOLEAN DEFAULT false,
     UNIQUE(day_of_week)
   );
   CREATE TABLE closed_dates (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     date DATE UNIQUE NOT NULL, reason TEXT,
     created_by UUID REFERENCES profiles(id)
   );
   양쪽 RLS: 전체 읽기, 관리자만 쓰기

2. src/services/scheduleService.ts:
   getSchedule, updateSchedule(dayOfWeek, data), getClosedDates(start, end), addClosedDate, removeClosedDate

3. app/(admin)/schedule.tsx: 요일별 시간 설정 + 휴무일 캘린더
   디자인 레퍼런스: YellowBall_v0.1/app/admin/settings/page.tsx + YellowBall_v0.1/components/ui/calendar.tsx 참조

4. 시드: 기본 영업시간 7일분

[완료 조건]
- 영업시간/휴무일 CRUD, 일반 사용자 읽기O 쓰기X, open < close 검증
```

## PR-18 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-18: 영업시간 + 휴무일

[정적] □ day_of_week UNIQUE □ RLS 읽기/쓰기 분리 □ open_time < close_time 검증
[동적] □ CRUD □ 일반 사용자 쓰기 차단 □ 전체 회귀
```

---

## PR-19 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-19: 예약 슬롯 관리를 구현해줘.
현재: PR-18 완료

[구현 단계]
1. supabase/migrations:
   CREATE TABLE booking_slots (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     service_type TEXT NOT NULL CHECK (service_type IN ('stringing','demo')),
     start_time TIMESTAMPTZ NOT NULL, end_time TIMESTAMPTZ NOT NULL,
     capacity INT DEFAULT 1, reserved_count INT DEFAULT 0,
     is_blocked BOOLEAN DEFAULT false, block_reason TEXT,
     CHECK (start_time < end_time), CHECK (reserved_count <= capacity), CHECK (reserved_count >= 0)
   );
   RLS: 전체 읽기, 관리자 쓰기

2. src/services/slotService.ts:
   - generateSlots(date, serviceType, durationMin, capacity):
     해당 날짜 영업시간 조회 → 휴무일이면 0 → open~close를 durationMin 간격 분할 → INSERT
   - getAvailableSlots(date, type): is_blocked=false AND reserved_count < capacity
   - blockSlot(id, reason), unblockSlot(id)
   - 같은 시간+type 중복 방지

3. app/(admin)/slots.tsx: 날짜 선택→슬롯 목록, 자동 생성, 차단/해제
   디자인 레퍼런스: YellowBall_v0.1/app/admin/bookings/page.tsx 관리자 UI 스타일 참조

[완료 조건]
- 영업시간 기반 슬롯 생성 (9~18시 60분→9슬롯)
- 휴무일 0 슬롯
- 차단/해제 동작
- reserved_count <= capacity
- 중복 방지
```

## PR-19 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-19: 예약 슬롯 관리

[정적] □ CHECK 3개 (start<end, count<=capacity, count>=0) □ 중복 방지 □ 휴무일 체크
[동적] □ 슬롯 생성 (9~18시 60분→9개) □ 휴무일→0개 □ 가용 조회 □ 차단/해제
       □ 경계값 (자정, 영업종료) □ 전체 회귀
```

---

## PR-20 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-20: 스트링 작업 예약 생성(사용자)을 구현해줘. 앱의 핵심 기능.
현재: PR-11(라켓), PR-13(카탈로그), PR-19(슬롯) 완료

[구현 단계]
1. supabase/migrations:
   CREATE TABLE service_bookings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     racket_id UUID REFERENCES user_rackets(id),
     main_string_id UUID REFERENCES string_catalog(id),
     cross_string_id UUID REFERENCES string_catalog(id),
     tension_main INT CHECK (tension_main BETWEEN 20 AND 70),
     tension_cross INT CHECK (tension_cross BETWEEN 20 AND 70),
     slot_id UUID REFERENCES booking_slots(id),
     delivery_method TEXT CHECK (delivery_method IN ('store_pickup','local_quick','parcel')),
     address_id UUID REFERENCES addresses(id),
     status TEXT DEFAULT 'requested' CHECK (status IN (
       'requested','approved','visit_pending','racket_received','in_progress',
       'completed','pickup_ready','delivered','done',
       'cancelled_user','cancelled_admin','rejected','reschedule_requested',
       'no_show','refund_pending','refund_done')),
     user_notes TEXT, admin_notes TEXT,
     no_show_counted BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
   );
   RLS: 본인 읽기/생성, 관리자 전체

2. src/services/bookingService.ts — createBooking(data):
   a. 사용자 status=suspended 체크 → 거부
   b. 노쇼 3회 체크 (PR-23에서 구현, TODO)
   c. 슬롯 가용 확인 (reserved_count < capacity, is_blocked=false)
   d. 배송(parcel/local_quick)이면 address_id 필수
   e. INSERT status='requested'
   f. booking_slots.reserved_count +1 (트랜잭션)

3. 예약 화면 (스텝 폼):
    Step1:라켓선택 → Step2:스트링선택 → Step3:텐션 → Step4:날짜/시간 → Step5:수령방식 → Step6:메모+확인
   디자인 레퍼런스: YellowBall_v0.1/app/(mobile)/booking/page.tsx + components/app/booking/ 참조

4. "다시 예약": 이전 세팅 프리필 (라켓/스트링/텐션), 날짜만 새로

5. src/utils/bookingValidation.ts: 텐션범위, 배송시 주소, 슬롯 가용, 제재 상태

[완료 조건]
- 예약 생성 성공 (status='requested')
- 슬롯 검증 (만석/차단 거부)
- reserved_count 트랜잭션 증가
- 제재 사용자 거부
- 배송시 주소 필수
- 다시예약 프리필
- 텐션 20~70 제한
```

## PR-20 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-20: 스트링 작업 예약 생성

[정적] □ status CHECK 16개 값 □ tension CHECK □ delivery_method CHECK
       □ reserved_count 증가가 트랜잭션 안에 있는가 □ 제재 체크 로직 위치
[동적] □ 정상 예약 □ 만석 거부 □ 차단 거부 □ 제재 거부
       □ 배송+주소 없음 거부 □ 텐션 초과 거부 □ 다시예약 프리필 □ 전체 회귀
[보안] □ RLS 타인 user_id 불가 □ 본인 예약만 조회
```

---

## PR-21 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-21: 예약 조회(사용자)를 구현해줘.
현재: PR-20 완료

[구현 단계]
1. bookingService 추가: getMyBookings(userId, filters), getBookingDetail(bookingId) — 라켓/스트링/슬롯 JOIN
2. 목록: 진행중/완료/취소 탭, 카드(라켓/스트링/날짜/상태 뱃지)
   디자인 레퍼런스: YellowBall_v0.1/components/app/booking-status.tsx 참조
3. 상세: 전체 정보, 상태 타임라인(요청→승인→방문대기→작업중→완료), 관리자 메모
4. src/utils/bookingStatus.ts: 상태별 한국어 라벨, 색상, 타임라인 순서

[완료 조건]
- 목록 조회, 상태 필터, 상세 표시, 타임라인 표시
```

## PR-21 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-21: 예약 조회 (사용자)

[정적] □ 상태 라벨 한국어 매핑이 전체 status 커버 □ JOIN 테이블 완전
[동적] □ 목록 조회 □ 상태 필터 □ 상세 화면 □ 빈 목록 UI □ 전체 회귀
```

---

## PR-22 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-22: 예약 관리(관리자)를 구현해줘.
현재: PR-20, PR-14 완료

[구현 단계]
1. supabase/migrations: booking_status_logs
   CREATE TABLE booking_status_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     booking_type TEXT CHECK (booking_type IN ('service','demo')),
     booking_id UUID NOT NULL,
     previous_status TEXT, new_status TEXT NOT NULL,
     changed_by UUID REFERENCES profiles(id),
     reason TEXT, changed_at TIMESTAMPTZ DEFAULT now()
   );
   RLS: 관리자 전체, 본인 예약 로그 읽기

2. src/utils/statusTransition.ts: VALID_TRANSITIONS 맵
   requested → approved/rejected/reschedule_requested/cancelled_admin
   approved → visit_pending/cancelled_admin/cancelled_user
   visit_pending → racket_received/no_show/cancelled_user
   racket_received → in_progress / in_progress → completed
   completed → pickup_ready/delivered / pickup_ready|delivered → done
   isValidTransition(current, new): boolean

3. src/services/adminBookingService.ts:
   - getAllBookings(filters), approveBooking(id, adminId)
   - rejectBooking(id, adminId, reason) — reserved_count -1
   - updateStatus(id, adminId, newStatus, reason) — 유효 전환만
   - addAdminNote(id, note)
   - 모든 변경 → booking_status_logs + audit_logs

4. app/(admin)/bookings/ — 목록(상태 필터), 상세+액션(유효 전환만 표시)
   디자인 레퍼런스: YellowBall_v0.1/app/admin/bookings/page.tsx + YellowBall_v0.1/components/admin/admin-queue-board.tsx 참조

[완료 조건]
- 승인/거절 동작
- 상태 전환 규칙 적용 (무효 전환 거부)
- booking_status_logs 자동 기록
- 거절시 reserved_count -1
- can_manage_bookings 권한 체크
```

## PR-22 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-22: 예약 관리 (관리자)

[정적] □ VALID_TRANSITIONS 완전성 □ 상태변경시 booking_status_logs INSERT
       □ reserved_count 감소가 거절/취소시에만 □ can_manage_bookings 체크
[동적] □ 승인 □ 거절+count감소 □ 무효 전환 거부 □ 로그 기록 □ 권한 없는 관리자 차단
[보안] □ 일반 사용자 상태 변경 불가 □ 전체 회귀
```

---

## PR-23 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-23: 예약 취소 + 노쇼 관리를 구현해줘.
현재: PR-22 완료

[구현 단계]
1. bookingService.cancelBooking(bookingId, userId):
   - 예약 시간 24시간 전: 자동 취소 (status='cancelled_user', reserved_count -1)
   - 24시간 이내: 취소 요청만 생성 → 관리자 확인 필요
   - 작업 시작(in_progress) 이후: 취소 불가
   - booking_status_logs 기록

2. src/services/noShowService.ts:
   - recordNoShow(bookingId, adminId): status='no_show', no_show_counted=true
   - getNoShowCount(userId): no_show_counted=true인 것만
   - isBookingRestricted(userId): 3회 이상→true
   - PR-20 createBooking에 isBookingRestricted 체크 통합

3. src/utils/cancellationPolicy.ts:
   - canCancelFreely(booking): 슬롯 start_time 기준 24시간 전 여부
   - getCancellationDeadline(booking), getRemainingTime(booking)

4. 예약 상세에 취소 가능 여부 + 남은 시간 표시

[완료 조건]
- 24시간 전 자동 취소
- 24시간 이내 관리자 확인 필요
- 노쇼 3회 이상 예약 차단
- 취소시 reserved_count -1
- 작업중 이후 취소 불가
```

## PR-23 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-23: 예약 취소 + 노쇼

[정적] □ 24h 기준=슬롯 start_time □ no_show_counted=true만 카운트
       □ in_progress 이후 취소 차단 로직
[동적] □ 24h전 취소 □ 24h이내 취소 요청 □ 노쇼 3회 차단
       □ 작업중 취소 거부 □ count 감소 □ 전체 회귀
```
