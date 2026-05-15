# YellowBall LLM 자동 테스트 실행 결과

실행일: 2026-05-14  
실행 위치: `d:\HY\develop_Project\YellowBall`  
대상 문서: `test_case.md`의 A 그룹, 즉 LLM이 직접 수행 가능한 자동 검증 범위

## 요약

| 구분 | 명령 | 결과 | 비고 |
| --- | --- | --- | --- |
| 전체 Jest | `npm test` | 실패 | 90개 test suite 중 86개 통과, 4개 실패 |
| 핵심 인증/예약/관리자/RLS Jest | `npm run test -- ... --runInBand` | 통과 | 21개 test suite, 164개 test 전부 통과 |
| 앱 lint | `npm run lint` | 통과 | error 0개, warning 1개 |
| root 앱 build | `npm run build` | 실행 불가 | root `package.json`에 `build` script 없음 |
| 관리자 lint | `npm run admin:lint` | 통과 | error 0개, warning 6개 |
| 관리자 build | `npm run admin:build` | 실패 | `next/font/google`이 Google Fonts fetch 실패 |
| 관리자 Playwright E2E | 미실행 | 도구/시나리오 추가 필요 | 현재 package script와 테스트 파일 없음 |
| 실제 Supabase DB mutation/RLS 실행 | 미실행 | 수동/스테이징 전용 | 운영/스테이징 DB 변경 위험 |

## 1. 전체 Jest 실행 결과

실행 명령:

```bash
npm test
```

결과:

```text
Test Suites: 4 failed, 86 passed, 90 total
Tests:       7 failed, 416 passed, 423 total
Snapshots:   3 failed, 3 total
Time:        13.569 s
```

### 실패 목록

| 실패 파일 | 실패 수 | 분류 | 관찰 내용 | 우선순위 |
| --- | ---: | --- | --- | --- |
| `__tests__/mobileResponsiveLayout.test.ts` | 1 | 정적 레이아웃 가드 | `app/(auth)/register.tsx`에서 `style={styles.authButton}` 문자열을 기대하지만 현재 구현은 배열 스타일 또는 다른 구조로 변경된 것으로 보임 | P1 |
| `__tests__/designSystem.test.tsx` | 3 | snapshot regression | `Button`, `Input`, 공통 UI snapshot이 현재 렌더링과 다름. 주요 차이는 `fontFamily`가 `Geist/Manrope` 계열에서 `System`으로 나온 점과 Button wrapper 구조 변화 | P1 |
| `__tests__/racketListScreen.test.tsx` | 1 | timeout/flaky 가능성 | `라켓 목록에서 상세와 추가 화면으로 분리 이동한다` 테스트가 5000ms timeout | P2 |
| `__tests__/newBookingScreen.test.tsx` | 1 | timeout/flaky 가능성 | 전체 병렬 실행에서는 첫 번째 스트링 예약 테스트가 5000ms timeout. 단독 `--runInBand` 실행에서는 통과 | P1 |

### 해석

- 핵심 예약 생성 테스트인 `newBookingScreen.test.tsx`는 별도 직렬 실행에서 통과했으므로, 전체 suite 실패의 일부는 병렬 실행/타이머/환경 부하 영향일 가능성이 있다.
- `designSystem.test.tsx` snapshot 실패는 실제 UI 구조 또는 font fallback 변경을 반영할지, 의도하지 않은 회귀로 볼지 판단이 필요하다.
- `mobileResponsiveLayout.test.ts`는 source 문자열 기반 테스트라 구현 방식 변경에 취약하다. 사용자 관점 동작 검증으로 바꾸는 것이 좋다.

## 2. 핵심 인증/예약/관리자/RLS 테스트 실행 결과

실행 명령:

```bash
npm run test -- loginScreen.test.tsx registerScreen.test.tsx meScreen.test.tsx newBookingScreen.test.tsx bookingScreen.test.tsx bookingDetailScreen.test.tsx bookingService.test.ts demoBookingService.test.ts adminBookingService.test.ts adminDemoBookingService.test.ts authService.test.ts useAuth.test.ts slotService.test.ts bookingNotificationService.test.ts wave10Migration.test.js wave11Migration.test.js wave12Migration.test.js wave13RlsSecurity.test.js adminWebOperationalPages.test.js adminWebPermissions.test.ts adminStatusLock.test.ts --runInBand
```

결과:

```text
Test Suites: 21 passed, 21 total
Tests:       164 passed, 164 total
Snapshots:   0 total
Time:        16.689 s
```

통과한 주요 범위:

- 로그인 화면: 이메일 로그인, 실패, 차단 계정 메시지, 로딩 UI, Google OAuth mock, 라우팅 책임 분리
- 회원가입 화면: 입력/도메인/OAuth 관련 기존 테스트
- 마이 페이지: 로그아웃 성공/로딩, 프로필 수정, 메뉴 라우팅
- 신규 예약: 스트링 예약, 시타 예약, 하이브리드 스트링, 재예약, 반납 시간 제한, 배송 메뉴 off 처리
- 예약 목록/상세: 목록 focus reload, service/demo 상세 이동, 취소 흐름
- 서비스 레이어: 예약 생성 RPC 파라미터, 취소/취소 요청, 노쇼 제한, 시타 중복 차단
- 관리자 서비스: 승인/거절/권한 차단, demo 승인/반납 전이
- 관리자 웹 정적 검증: 운영 페이지/권한/상태 잠금
- RLS/마이그레이션 정적 검증: wave10, wave11, wave12, wave13 hardening

주의:

- `meScreen.test.tsx`는 통과했지만 React act warning이 출력됐다. 실패는 아니지만 비동기 state update를 `waitFor`/`act`로 더 안정화할 여지가 있다.

## 3. Lint 실행 결과

### 앱 lint

실행 명령:

```bash
npm run lint
```

결과: 통과

```text
0 errors, 1 warning
```

경고:

| 파일 | 위치 | 내용 |
| --- | --- | --- |
| `src/services/appMenuSettingsService.ts` | 96:24 | `require()` style import 금지 경고 |

### 관리자 lint

실행 명령:

```bash
npm run admin:lint
```

결과: 통과

```text
0 errors, 6 warnings
```

경고:

| 파일 | 내용 |
| --- | --- |
| `apps/admin-web/components/app/booking/string/booking-calendar.tsx` | `Array<T>` 대신 `T[]` 권장 |
| `apps/admin-web/components/ui/field.tsx` | `Array<T>` 대신 `T[]` 권장 |
| `apps/admin-web/components/ui/use-toast.ts` | unused/type-only 값, `Array<T>` 경고 |
| `apps/admin-web/hooks/use-toast.ts` | unused/type-only 값, `Array<T>` 경고 |

## 4. Build 실행 결과

### root 앱 build

실행 명령:

```bash
npm run build
```

결과: 실행 불가

사유:

```text
npm error Missing script: "build"
```

현재 root `package.json`에는 `start`, `android`, `ios`, `web`, `admin:build`, `lint`, `test` 등은 있지만 `build` script가 없다. 따라서 `test_case.md`에 적었던 `npm run build`는 현재 프로젝트 상태에서는 실행 가능한 명령이 아니다.

### 관리자 build

실행 명령:

```bash
npm run admin:build
```

결과: 실패

실패 원인:

```text
next/font: error:
Failed to fetch `Geist` from Google Fonts.
Failed to fetch `Manrope` from Google Fonts.
```

해석:

- Next.js 빌드가 `apps/admin-web/app/layout.tsx`의 `next/font/google` 로딩 단계에서 외부 네트워크 요청을 수행했다.
- 현재 실행 환경은 네트워크가 제한되어 있어 Google Fonts fetch가 실패했다.
- 이 결과만으로 관리자 앱 코드 컴파일 실패라고 단정하기는 어렵다.
- 재현 가능한 CI 빌드를 위해서는 local font 전환, font mock, 또는 네트워크 허용 빌드 환경이 필요하다.

추가 경고:

- Next.js가 workspace root를 `D:\HY\develop_Project\YellowBall\package-lock.json` 기준으로 추론했다.
- `apps/admin-web/pnpm-lock.yaml`도 감지되어 lockfile이 복수라고 경고했다.

## 5. test_case.md A 그룹 대비 실행 상태

| 범위 | 실행 상태 | 결과 |
| --- | --- | --- |
| Jest unit test | 실행 | 전체 suite 일부 실패, 핵심 suite 통과 |
| React Native Testing Library component test | 실행 | 핵심 인증/예약 화면 통과 |
| service mock test | 실행 | 예약/관리자/알림/slot 관련 통과 |
| Supabase RPC 호출 파라미터 검증 mock test | 실행 | booking/admin service 관련 통과 |
| static source test | 실행 | admin web/RLS/migration 일부 통과, mobile responsive static guard 1건 실패 |
| lint | 실행 | root/admin 모두 error 없이 통과 |
| build | 일부 실행 | root build script 없음, admin build는 Google Fonts fetch 실패 |
| Playwright 기반 admin web 브라우저 테스트 | 미실행 | 현재 테스트 도구/script 없음, admin build도 네트워크 font 문제로 차단 |
| 실제 DB 변경 테스트 | 미실행 | 수동/스테이징 전용으로 분류 |

## 6. 발견된 리스크

| 리스크 | 영향 | 권장 조치 |
| --- | --- | --- |
| 전체 `npm test`가 실패 | CI merge gate로 쓰기 어려움 | snapshot/정적 가드/timeout 테스트를 먼저 안정화 |
| `newBookingScreen.test.tsx`가 전체 병렬 실행에서 timeout | 핵심 예약 테스트가 flaky하게 보일 수 있음 | fake timer/async wait 정리 또는 해당 suite 직렬 실행 검토 |
| `racketListScreen.test.tsx` timeout | 라켓 흐름 회귀 감지 신뢰도 저하 | mock promise, navigation wait 조건 점검 |
| 디자인 시스템 snapshot 불일치 | 의도된 UI 변경인지 회귀인지 불명확 | 실제 렌더링 확인 후 snapshot 갱신 또는 컴포넌트 수정 |
| source 문자열 기반 테스트 취약 | 구현 리팩터링마다 오탐 가능 | 사용자 관점 style/render assertion으로 교체 |
| 관리자 build가 외부 폰트에 의존 | 네트워크 제한 CI에서 build 실패 | `next/font/local` 또는 빌드 네트워크 정책 정리 |
| 관리자 UI interaction 테스트 부재 | 승인/거절/필터 메뉴의 실제 클릭 회귀 감지 약함 | admin web용 Testing Library/Playwright 도입 검토 |

## 7. 우선 처리 추천

1. `__tests__/designSystem.test.tsx` snapshot 실패가 의도된 변경인지 확인한다.
2. `__tests__/mobileResponsiveLayout.test.ts`의 문자열 가드를 실제 render/style assertion으로 바꾼다.
3. `__tests__/racketListScreen.test.tsx` timeout 원인을 분리한다.
4. `newBookingScreen.test.tsx`가 전체 병렬 실행에서도 안정적으로 통과하도록 비동기 setup을 정리한다.
5. 관리자 빌드의 Google Fonts 의존을 local font 또는 네트워크 허용 정책으로 정리한다.
6. root `build` script가 필요한지 결정한다. Expo 앱 기준이면 `npm run web`/EAS 빌드 등으로 명령을 바꾸는 편이 맞다.

## 8. 최종 판정

- 핵심 인증/예약/관리자/RLS 테스트는 직렬 실행 기준 통과했다.
- 전체 테스트 suite는 아직 green이 아니다.
- lint는 root/admin 모두 error 없이 통과했다.
- 관리자 production build는 현재 환경의 네트워크 제한 때문에 실패했다.
- 실제 OAuth, 푸시, 스테이징 DB mutation, cross-app 실시간 반영은 자동 실행하지 않았고 사람이 직접 확인해야 한다.

---

## 9. 로그인 후 실기기 동적 테스트 추가 실행

사용자가 실기기에서 로그인한 상태를 제공해 2026-05-14 17:30~17:36에 추가 동적 테스트를 수행했다. 상세 결과와 스크린샷/XML 증거는 `test_case_result_device.md`와 `device-artifacts/`에 저장했다.

| ID | 영역 | 시나리오 | 결과 | 증거/아티팩트 | 비고 |
| --- | --- | --- | --- | --- | --- |
| HOME-DYN-001 | 홈 | 로그인 후 홈 화면/빠른 예약/진행 중 예약 카드 표시 | PASS | `yellowball-after-login-current.png`, `.xml` | 사용자 `Hy_test`, 홈 탭, 빠른 액션 버튼 확인 |
| BOOKING-DYN-001 | 예약 목록 | 예약 탭의 진행 중 목록 및 CTA 표시 | PASS | `yellowball-booking-list.png`, `.xml` | 스트링/시타 예약 CTA와 예약 카드 확인 |
| BOOKING-DYN-003 | 예약 상세 | 예약 상세 진입 및 상태/작업 정보 표시 | PASS | `yellowball-booking-detail-dyn.png`, `.xml` | 상태 `접수`, 라켓/스트링/예약 시간/텐션/타임라인 확인 |
| BOOKING-DYN-004 | 예약 취소 | 취소 확인 다이얼로그 표시 | PASS | `yellowball-booking-cancel-dialog.png`, `.xml` | 확인 다이얼로그만 검증, 실제 취소 확정은 누르지 않음 |
| NEWBOOKING-DYN-001 | 새 예약 | 스트링 예약 라켓/스트링/텐션 UI 표시 | PASS | `yellowball-new-booking-initial.png`, `middle.png`, `lower.png` | 라켓 선택, 단일 스트링, 하이브리드, 텐션 입력 확인 |
| NEWBOOKING-DYN-005 | 새 예약 | 날짜 선택 후 슬롯 활성/비활성 표시 | PASS | `yellowball-new-booking-date-selected.png`, `.xml` | 2026-05-16 예약 가능 6개, 16:00 disabled 확인 |
| DEMO-DYN-001 | 시타 예약 | 시타 라켓 선택 및 날짜/반납 시간 UI 표시 | PASS | `yellowball-demo-booking-header.png`, `screen.png` | 시타 라켓, 반납 예정 시간 `17:30`, 예약 접수 버튼 확인 |
| ME-DYN-001 | 마이 | 프로필/통계/라켓/계정 버튼 표시 | PASS | `yellowball-me-screen-logged-in.png`, `account-actions.png` | 프로필 수정, 라켓 추가, 주문 내역, 알림 설정 등 확인 |
| LOGOUT-DYN-001 | 로그아웃 | 로그아웃 후 로그인 화면 이동 | PASS | `yellowball-logout-after-1s.png`, `yellowball-logout-final.png` | 1초 내 로그인 화면 복귀 확인 |
| A11Y-DYN-003 | 접근성 | 주요 버튼 content-desc 확인 | PASS/PARTIAL | 각 XML | 일부 라켓 카드 라벨 비어 있음, 달력 날짜 라벨 영문 노출 |

추가 발견 사항:

1. 이름 없는 라켓 카드가 ` , 스펙 미등록`, `  관리`처럼 접근성 라벨이 비어 있는 상태로 노출된다.
2. 달력 날짜 라벨이 `Select 2026-05-16`처럼 영문으로 노출되어 한국어 접근성 라벨 개선이 필요하다.
3. 예약 접수/예약 취소 확정은 실제 Supabase mutation이므로 이번 실기기 테스트에서는 실행하지 않았다.
4. 로그아웃은 성공했지만 로딩 UI는 전환이 너무 빨라 캡처로 분리 확인하지 못했다.

---

## 10. 실제 DB/관리자 웹/사용자 앱 통합 동적 테스트

실행일: 2026-05-15 10:00~10:23 KST  
기기: Samsung SM-S931N (`R3KYB04LA1B`)  
사용자 앱: Expo dev-client, Metro `http://localhost:8122`  
관리자 웹: Next.js dev server `http://localhost:3000`  
테스트 사용자: `Hy_test`  
테스트 예약 ID: `9172ad00-8033-4ad3-8473-dcdb748e5f92`  
테스트 메모 마커: `LLM-INTEGRATION-20260515-1010`

이번 실행은 실제 Supabase DB mutation을 포함했다. 관리자 웹 검증을 위해 예약 관리 권한만 가진 임시 관리자 계정을 생성했고, 테스트 후 Supabase Auth/`profiles`/`admin_permissions`에서 삭제 확인했다.

| ID | 영역 | 시나리오 | 결과 | DB/화면 확인 | 증거/아티팩트 |
| --- | --- | --- | --- | --- | --- |
| INT-REAL-001 | 사용자 앱 예약 생성 | 스트링 예약 생성: Babolat Pure aero, RPM Blast, 48/48LB, 2026-05-16 10:00, 매장 픽업, 메모 입력 | PASS | 성공 화면에 예약 번호 표시 | `after-submit.png`, `after-submit.xml` |
| INT-REAL-002 | Supabase DB 생성 검증 | `service_bookings` row 생성, slot 증가, 사용자 알림 생성 | PASS | status `requested`, slot `reserved_count=1`, `service_requested` 알림 1건 | DB 조회 결과 |
| INT-REAL-003 | 관리자 예약 목록 | 사용자 앱에서 만든 예약이 관리자 예약 관리 페이지에 표시 | PASS | `YB-9172AD00`, Hy_test, 2026-05-16 10:00, 접수/요청 표시 | `admin-bookings-after-create-*.png` |
| INT-REAL-004 | 관리자 상세 | 예약 상세 페이지에서 라켓/스트링/방문일시/고객 메모 표시 | PASS | 메모 `LLM-INTEGRATION-20260515-1010` 표시 | `admin-booking-detail-requested-*.png` |
| INT-REAL-005 | 관리자 승인 | 관리자 상세에서 `승인` 클릭 | PASS/PARTIAL | DB status `approved`, 관리자 UI `승인`, 사용자 앱 목록/상세도 `승인` 반영 | `admin-booking-detail-approved-*.png`, `user-bookings-after-approve.png`, `user-detail-after-approve.png` |
| INT-REAL-006 | 승인 로그/알림 | 관리자 승인 후 상태 로그와 사용자 알림 생성 여부 | FAIL | `booking_status_logs` 승인 로그 없음, 승인 알림 없음 | DB 조회 결과 |
| INT-REAL-007 | 사용자 앱 취소 | 승인된 예약을 사용자 앱에서 무료 취소 | PASS | 성공 피드백 표시, DB status `cancelled_user` | `user-cancel-dialog2.png`, `user-after-cancel-confirm.png` |
| INT-REAL-008 | 슬롯 복구 | 사용자 취소 후 예약 슬롯 카운트 복구 | PASS | slot `909ad...` `reserved_count=0` | DB 조회 결과 |
| INT-REAL-009 | 취소 로그/알림 | 사용자 취소 후 상태 로그와 알림 생성 | PASS | `approved -> cancelled_user` 로그 1건, `service_cancelled_user` 사용자 알림 생성 | DB 조회 결과 |
| INT-REAL-010 | 취소 상태 표시 | 사용자 앱/관리자 웹에서 `cancelled_user` 상태 표시 | FAIL | DB는 `cancelled_user`이나 사용자 앱과 관리자 웹 모두 상태 배지가 `접수`로 표시됨 | `user-after-cancel-detail.png`, `admin-booking-detail-after-user-cancel-*.png` |

### 실제 DB 확인 요약

- 예약 생성 직후: `service_bookings.status=requested`, `booking_slots.reserved_count=1`, `service_requested` 사용자 알림 생성.
- 관리자 승인 직후: `service_bookings.status=approved`, 사용자 앱과 관리자 웹에 승인 반영. 단, 승인 상태 로그와 승인 알림은 생성되지 않음.
- 사용자 취소 직후: `service_bookings.status=cancelled_user`, `booking_slots.reserved_count=0`, `booking_status_logs`에 `approved -> cancelled_user` 기록, `service_cancelled_user` 사용자 알림 생성.

### 발견 결함

1. 관리자 웹의 `updateServiceBookingStatus`가 `admin_update_service_booking_status` RPC를 사용하지 않고 `service_bookings`를 직접 patch한다. 이 때문에 관리자 승인 시 상태 로그와 승인 알림이 생성되지 않는다. 관리자 웹에서 취소/노쇼/거절 같은 terminal 상태를 직접 바꾸면 슬롯 카운트도 RPC 기준으로 보장되지 않을 위험이 있다.
2. `cancelled_user` 상태 라벨이 사용자 앱과 관리자 웹에서 `접수`로 표시된다. DB 상태는 취소인데 화면은 접수로 보여 운영자가 오판할 수 있다.
3. 사용자 앱 예약 생성/취소의 사용자 알림은 생성됐지만, 관리자 대상 알림은 이번 실제 DB 조회에서 확인되지 않았다. Edge Function push 전송과 DB 알림 저장 정책을 분리해서 확인해야 한다.

### 이번 실행 후 상태

- 테스트 예약은 최종 `cancelled_user` 상태로 남아 있다.
- 예약 슬롯 `2026-05-16 10:00`의 `reserved_count`는 0으로 복구됐다.
- 임시 관리자 계정은 삭제됐고, `profiles`/`admin_permissions` 잔여 row도 없는 것을 확인했다.
