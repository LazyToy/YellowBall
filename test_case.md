# YellowBall 테스트 케이스 설계

## 테스트 설계 기준 요약

조사 기준은 ISTQB의 Risk-Based Testing, State Transition Testing, Cucumber/Gherkin BDD, Testing Trophy, WCAG 2.2, React Native Testing Library 접근성 쿼리, Supabase RLS 문서를 기준으로 잡았다. 적용 원칙은 다음과 같다.

- P0는 로그인/차단 계정/예약 생성/상태 변경/RLS 권한이다. 실패하면 데이터 오염, 무단 접근, 매출 손실이 난다.
- 현재 프로젝트는 root Jest + React Native Testing Library 중심이다. 관리자 웹은 별도 UI 테스트 러너가 거의 없으므로 지금은 정적 테스트와 서비스 테스트가 현실적이고, 브라우저 E2E는 도구 추가가 필요하다.
- Testing Trophy 관점에서 서비스 mock/통합성 컴포넌트 테스트를 두껍게 두고, 순수 유틸·마이그레이션 정적 테스트를 받치며, 실제 OAuth/푸시/운영 DB는 수동 또는 스테이징 전용으로 분리한다.
- BDD 표기는 각 시나리오를 Given 사전 조건 / When 절차 / Then 기대 결과로 읽히게 만든다.
- 상태 전이는 `requested -> approved/rejected/cancelled`, `approved -> in_progress/no_show/cancelled`, `completed/pickup_ready/done/returned/no_show` 잠금이 핵심이다.
- 접근성은 버튼의 `role`, `label`, `disabled/busy/selected`, 오류의 `alert`, 터치 가능한 요소의 명확한 이름을 기준으로 본다.
- Supabase RLS는 public exposed schema RLS, `auth.uid()` 소유자 조건, 관리자 권한 helper, SECURITY DEFINER RPC의 anon execute 차단, service role 클라이언트 노출 금지를 검증한다.

참고 기준:

- [ISTQB Risk-Based Testing](https://istqb-glossary.page/risk-based-testing/)
- [ISTQB State Transition Testing](https://istqb-glossary.page/state-transition-testing/)
- [Cucumber Gherkin](https://cucumber.io/docs/gherkin/reference/)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [React Native Testing Library queries](https://callstack.github.io/react-native-testing-library/docs/api/queries)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

## A. LLM이 스스로 수행할 수 있는 테스트

| ID | 영역 | 대상 화면/파일 | 시나리오 | 사전 조건 | 테스트 절차 | 기대 결과 | 자동화 가능 여부 | 권장 테스트 유형 | 우선순위 | 작성/수정할 테스트 파일 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | 로그인 | `app/(auth)/login.tsx` | 이메일/비밀번호 로그인 성공 | `useAuth.signIn` 성공 mock | Given 입력값, When 로그인 press, Then `signIn(email,password)` 호출 | 화면 직접 라우팅 없음, auth 책임 분리 유지 | 가능 | RN component BDD | P0 | 기존 `__tests__/loginScreen.test.tsx`, `npm run test -- loginScreen.test.tsx` |
| AUTH-002 | 로그인 | `login.tsx` | 필수값 누락 | 빈 이메일 또는 비밀번호 | 로그인 press | DB 호출 없이 alert/error 표시 | 가능 | negative component | P0 | `loginScreen.test.tsx` 보강 |
| AUTH-003 | 로그인 | `login.tsx`, `authService.ts` | 로그인 실패 | Supabase invalid credentials mock | 입력 후 press | 한국어 오류 표시, 라우팅 없음 | 가능 | service + component | P0 | 기존 `loginScreen.test.tsx`, `authService.test.ts` |
| AUTH-004 | 로그인 | `useAuth.ts`, `authService.ts` | suspended/deleted/deleted_pending 차단 | profile.status별 mock | signIn 호출 | signOut/storage remove, snapshot null, 차단 메시지 | 가능 | service/state test | P0 | 기존 `__tests__/useAuth.test.ts`, `authService.test.ts` 보강 |
| AUTH-005 | 로그인 | `login.tsx` | Google/Kakao OAuth 버튼 | OAuth service mock | 각 버튼 press | provider `google`/`kakao` 호출, loading busy 상태 | 가능 | RN component | P1 | 기존 `loginScreen.test.tsx` 보강 |
| AUTH-006 | 로그인 | `login.tsx` | 로그인 중 loading UI | unresolved promise | press 후 overlay 확인 | spinner, busy/disabled, 중복 press 방지 | 가능 | component accessibility | P1 | 기존 커버 있음, label/disabled 추가 검증 |
| AUTH-007 | 로그인 | `login.tsx` | 로그인 후 라우팅 책임 분리 | signIn 성공 | press | `router.replace('/(tabs)')` 미호출 | 가능 | regression | P0 | 기존 커버 있음 |
| LOGOUT-001 | 로그아웃 | `app/(tabs)/me.tsx` | 로그아웃 버튼 | profile 있음 | logout press | `signOut` 호출 후 login replace | 가능 | RN component | P0 | 기존 `__tests__/meScreen.test.tsx` |
| LOGOUT-002 | 로그아웃 | `me.tsx` | 로그아웃 중 로딩 | unresolved signOut | press | `AuthLoadingOverlay`, busy UI, 라우팅 대기 | 가능 | component | P1 | 기존 커버 있음 |
| LOGOUT-003 | 로그아웃 | `useAuth.ts` | 세션/스토어 초기화 | `serviceSignOut` 성공 | `signOut()` 직접 호출 | `resetAllZustandStores`, `syncAuthSession(null)` | 가능 | hook/store unit | P0 | `__tests__/useAuth.test.ts` 보강 |
| LOGOUT-004 | 로그아웃 | `me.tsx`, `useAuth.ts` | 실패 시 에러 표시 | signOut reject | press | login 이동 없음, 오류 메시지 표시 | 가능 | negative component | P1 | `meScreen.test.tsx` 보강 |
| BOOKING-001 | 예약 생성 | `new-booking.tsx` | 스트링 예약 기본 성공 | 라켓/스트링/슬롯 mock | submit | `createBooking` RPC input 완성 | 가능 | RN component + service mock | P0 | 기존 `newBookingScreen.test.tsx` |
| BOOKING-002 | 예약 생성 | `bookingService.ts` | RPC 파라미터 검증 | active user, owned racket, active strings, slot available | `createBooking(input)` | `create_service_booking_transaction` 정확 호출 | 가능 | service mock | P0 | 기존 `bookingService.test.ts` |
| BOOKING-003 | 예약 생성 | `new-booking.tsx` | 시타 라켓 예약 성공 | `mode=demo` | 대여 시간, 반납 시간 선택 후 submit | `createDemoBooking` 호출, string/tension 제외 | 가능 | RN component | P0 | 기존 `newBookingScreen.test.tsx` |
| BOOKING-004 | 예약 생성 | `demoBookingService.ts` | 시타 중복/비활성 라켓 차단 | overlap 또는 inactive mock | createDemoBooking | throw, RPC 미호출 | 가능 | negative service | P0 | 기존 `demoBookingService.test.ts` |
| BOOKING-005 | 예약 생성 | `new-booking.tsx` | 라켓 선택 | 여러 user rackets | 다른 라켓 press 후 submit | 선택 id 반영 | 가능 | component | P1 | `newBookingScreen.test.tsx` 보강 |
| BOOKING-006 | 예약 생성 | `new-booking.tsx` | 스트링 선택 | main/cross strings | hybrid 전환, cross 선택 | main/cross string id 분리 | 가능 | component | P1 | 기존 일부 커버 |
| BOOKING-007 | 예약 생성 | `new-booking.tsx`, `bookingValidation.ts` | 텐션 경계 | 20, 70, 19, 71 | 입력/서비스 호출 | 20/70 허용, 범위 밖 차단 | 가능 | boundary + negative | P0 | `bookingValidation.test.ts`, `newBookingScreen.test.tsx` |
| BOOKING-008 | 예약 생성 | `new-booking.tsx` | 하이브리드 스트링 | uniform false | main/cross 별도 선택 | 별도 tension/string 저장 | 가능 | component | P1 | 기존 일부 커버 |
| BOOKING-009 | 예약 생성 | `slotService.ts` | 예약 가능/불가능 슬롯 | full/blocked/past slot | 슬롯 로드 | full/blocked/past disabled, selectable만 선택 | 가능 | service + component | P0 | 기존 `slotService.test.ts`, `newBookingScreen.test.tsx` 보강 |
| BOOKING-010 | 예약 생성 | `slotService.ts`, `scheduleService.ts` | 휴무일/영업시간/마감시간 | closed date, shop schedule | 날짜 선택 | 슬롯 미노출 또는 disabled, 안내 표시 | 가능 | boundary/regression | P0 | `slotService.test.ts`, `newBookingScreen.test.tsx` |
| BOOKING-011 | 예약 생성 | `new-booking.tsx` | 픽업/배송 수령 | delivery on/off | method chip 선택 | delivery off면 store_pickup만 | 가능 | component | P1 | 기존 일부 커버 |
| BOOKING-012 | 예약 생성 | `bookingValidation.ts`, `bookingService.ts` | 주소 필요 여부 | parcel/local_quick without address | submit/createBooking | 주소 요구 오류, RPC 미호출 | 가능 | negative service/component | P0 | 기존 service 커버, component 보강 |
| BOOKING-013 | 예약 생성 | `new-booking.tsx` | 메모 입력 | userNotes 입력 | submit | payload `userNotes` 반영 | 가능 | component | P2 | `newBookingScreen.test.tsx` 보강 |
| BOOKING-014 | 예약 생성 | `bookingService.ts` | 노쇼 제한 | noShowService true | createBooking | 예약 차단 | 가능 | service | P0 | 기존 커버 있음 |
| BOOKING-015 | 예약 상세 | `booking-detail.tsx`, `bookingService.ts` | 무료 취소 | 충분히 미래 slot | 취소 확인 | `user_cancel_service_booking`, 목록 갱신 | 가능 | component + service | P0 | 기존 `bookingDetailScreen.test.tsx`, `bookingService.test.ts` |
| BOOKING-016 | 예약 상세 | `bookingService.ts` | 마감 이후 취소 요청 | 24시간 이내 | cancelBooking | 상태 변경 대신 `booking_status_logs` insert | 가능 | service state transition | P0 | 기존 커버 있음 |
| BOOKING-017 | 예약 생성 | `new-booking.tsx` | 재예약 프리필 | 최근 6개월 예약 | 다시 예약 press | 라켓/스트링/텐션 프리필 | 가능 | regression component | P1 | 기존 커버 있음 |
| BOOKING-018 | 예약 목록/상세 | `booking.tsx`, `booking-detail.tsx` | 상세 보기 | service/demo booking | card press | `/booking-detail` params 정확 | 가능 | RN navigation mock | P1 | 기존 커버 있음 |
| ADMIN-001 | 관리자 | `adminBookingService.ts` | 승인 | super_admin/admin 권한 | approveBooking | RPC, audit log, user notification | 가능 | service mock | P0 | 기존 `adminBookingService.test.ts` |
| ADMIN-002 | 관리자 | `adminBookingService.ts` | 거절 | reason 입력 | rejectBooking | release slot action, reason notification | 가능 | service mock | P0 | 기존 커버 있음 |
| ADMIN-003 | 관리자 | `adminBookingService.ts` | 무권한 차단 | admin permission false/user role | approve/update | throw, RPC 미호출 | 가능 | negative service | P0 | 기존 커버 있음 |
| ADMIN-004 | 관리자 | `adminDemoBookingService.ts` | 시타 승인/반납/연체 | demo status 상태별 | approve/markReturned/markOverdue | 유효 전이만 허용 | 가능 | state transition service | P0 | 기존 일부 커버 |
| ADMIN-005 | 관리자 UI | `booking-action-buttons.tsx` | 승인/거절/취소 승인 버튼 | client action mock 필요 | click | loading, disabled, feedback dialog | 부분 가능 | 도구 추가 또는 static test | P1 | 새 `adminBookingActionButtons.test.tsx`는 admin runner 필요 |
| ADMIN-006 | 관리자 UI | `booking-status-menu.tsx` | 상태 메뉴 | currentStatus별 | open/select | action 호출, 완료/반납/노쇼 잠금 disabled | 부분 가능 | static + browser | P0 | 기존 `adminStatusLock.test.ts`, UI는 도구 추가 |
| ADMIN-007 | 관리자 페이지 | `bookings/page.tsx` | 승인 대기 목록 표시 | pendingRequests mock/static | render/build | pending section, count, action buttons | 가능 | static source/build | P1 | 새 `adminWebBookingsPage.test.js`, `npm run admin:build` |
| ADMIN-008 | 관리자 페이지 | `bookings/[type]/[id]/page.tsx` | 상세 페이지 | service/demo id | load 함수 mock 또는 static | 상세/메모/상태 메뉴 표시 | 부분 가능 | static/build | P1 | 새 static test, UI runner 필요 |
| ADMIN-009 | 관리자 필터 | `bookings-filter-panel.tsx` | 탭/검색/상태별 표시 | bookings fixture | tab/search/type/date | filtered rows/count reset | 부분 가능 | admin component test 도구 추가 | P1 | 도구 추가 필요 |
| ADMIN-010 | 관리자 | `admin-actions.ts` | 완료/반납/노쇼 이후 잠금 | locked status | update action | `COMPLETED_STATUS_LOCK_MESSAGE`, patch 미호출 | 가능 | static/server action mock | P0 | 기존 `adminStatusLock.test.ts` 보강 |
| ADMIN-011 | 관리자 | `admin-actions.ts` | service role key 없음 | env 없음 | update/load 호출 | 실패 메시지, 빌드 안전 | 가능 | static/unit | P1 | `adminWebOperationalPages.test.js` 보강 |
| ADMIN-012 | 관리자 | `adminBookingService.ts` | 감사 로그/알림 생성 | status update | updateStatus | audit insert, status notification | 가능 | service | P0 | 기존 일부 커버 |
| CROSS-001 | 교차 흐름 | `bookingService.ts`, `admin-data.ts` | 사용자 예약 생성 후 관리자 목록 변환 | created booking fixture | `toAdminBookingItem` | pendingRequests 포함 | 가능 | pure/static data test | P0 | 새 `adminBookingDataMapping.test.ts` |
| CROSS-002 | 교차 흐름 | `booking.tsx` | 관리자 상태 변경 후 사용자 목록 반영 | getMyBookings mock 변경 | focus callback | 새 status 표시 | 가능 | RN component regression | P1 | 기존 `bookingScreen.test.tsx` 보강 |
| CROSS-003 | 교차 흐름 | `booking-detail.tsx` | 관리자 상태 변경 후 상세 반영 | getBookingDetail mock 변경 | reload/cancel 후 fetch | 최신 status/timeline | 가능 | component | P1 | `bookingDetailScreen.test.tsx` 보강 |
| BUTTON-001 | 모든 버튼 | 로그인 | 로그인, Google, Kakao, 회원가입 링크 | render | label/role/press/disabled/loading | 전부 접근 가능 | 가능 | accessibility component | P0 | `loginScreen.test.tsx` |
| BUTTON-002 | 모든 버튼 | 회원가입 | 도메인 선택/닫기, 가입, OAuth, 로그인 링크 | render | role/label/press/loading | 가입 흐름 및 피드백 | 가능 | accessibility component | P1 | 기존 `registerScreen.test.tsx` 보강 |
| BUTTON-003 | 모든 버튼 | 마이 | 프로필 수정/저장, 라켓 추가, 메뉴, 로그아웃, stat pressable | render | 각 press | stat은 현재 no-op: 미구현/구현 필요 명시 | 가능 | component/static inventory | P1 | `meScreen.test.tsx`, 새 `buttonInventory.test.js` |
| BUTTON-004 | 모든 버튼 | 예약 생성 | 모드, 라켓, 스트링, 텐션 +/-/입력, 슬롯, 수령, 반납 단계, 재예약, 제출 | fixture | 각 press | selected/disabled/loading/DB mutation 검증 | 가능 | component BDD | P0 | `newBookingScreen.test.tsx` |
| BUTTON-005 | 모든 버튼 | 예약 목록/상세 | CTA, tabs, cards, back, cancel | fixture | press | routing/cancel dialog/feedback | 가능 | component | P1 | `bookingScreen.test.tsx`, `bookingDetailScreen.test.tsx` |
| BUTTON-006 | 모든 버튼 | 관리자 예약 | 내보내기, 새 예약, 목록 링크, 승인/거절/취소 승인, 상태 메뉴, 필터, reset/search clear | source scan | static inventory | 내보내기/새 예약은 현재 onClick 없음: 미구현/수동 확인/구현 필요 | 가능/부분 | static + admin E2E | P1 | 새 `adminButtonInventory.test.js`; UI는 도구 추가 |
| RLS-001 | RLS | migrations 015/018 | bookings RLS enabled/policy | migration SQL | parse/source assert | service/demo bookings own or booking manager | 가능 | static SQL test | P0 | 기존 `wave10Migration.test.js`, `wave13RlsSecurity.test.js` |
| RLS-002 | RLS | migrations 015/016/017 | booking RPC auth.uid guard | SQL | assert `auth.uid() <> p_user_id/admin_id` | anon/타인 호출 차단 구조 | 가능 | static SQL | P0 | 기존 migration tests 보강 |
| RLS-003 | RLS | migration 025 | anon execute revoke | SQL | parse/source assert | SECURITY DEFINER RPC anon 차단 | 가능 | static SQL | P0 | 기존 `wave13RlsSecurity.test.js` |
| RLS-004 | RLS | `supabase/tests/rls_tests.sql` | 실제 정책 시나리오 | local Supabase 필요 | SQL 실행 | user/admin/super_admin matrix 통과 | 조건부 가능 | DB integration | P0 | 로컬 DB 필요, 기본은 수동/스테이징 |
| RLS-005 | 보안 | `src`, `app` | service role 노출 금지 | source scan | grep/static | public app에 service role 없음 | 가능 | static security regression | P0 | 기존 `wave13RlsSecurity.test.js` |

## B. 사람이 직접 하거나 도와줘야 하는 테스트

| ID | 영역 | 대상 화면/파일 | 시나리오 | 사전 조건 | 테스트 절차 | 기대 결과 | 자동화 가능 여부 | 권장 테스트 유형 | 우선순위 | 작성/수정할 테스트 파일 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MANUAL-001 | OAuth | 로그인/회원가입 | 실제 Google 로그인 | Google OAuth 설정, 실기기/브라우저 | Google 버튼, 계정 선택, 앱 복귀 | 세션 생성, 차단 계정은 차단 | 수동 | provider E2E | P0 | 자동은 mock만 |
| MANUAL-002 | OAuth | 로그인/회원가입 | 실제 Kakao 로그인 | Kakao OAuth/redirect 설정 | Kakao 버튼, 동의, 앱 복귀 | 세션 생성/취소 처리 | 수동 | provider E2E | P0 | 자동은 mock만 |
| MANUAL-003 | 모바일 | Expo 앱 | Android/iOS 권한 팝업 | 실제 기기 | 알림/브라우저/딥링크 흐름 확인 | OS 팝업, 복귀, 실패 처리 정상 | 수동 | device QA | P1 | 없음 |
| MANUAL-004 | 푸시 | `bookingNotificationService.ts` | 예약/상태 변경 푸시 수신 | Expo push token, staging DB | 예약 생성, 관리자 승인 | 사용자/관리자 알림 수신 | 수동/스테이징 | integration | P0 | service mock은 자동 |
| MANUAL-005 | DB | Supabase staging | 실제 예약 생성 mutation | staging 계정 | 스트링/시타 예약 생성 | rows, slot count, notifications, logs 정합 | 수동 | DB E2E | P0 | 자동은 mock RPC |
| MANUAL-006 | 관리자+사용자 | 앱+admin web | 실시간/새로고침 반영 | 두 세션 | 사용자 예약, 관리자 승인, 앱 목록 focus | 상태 반영 | 부분 자동, 현재 도구 없음 | cross-app E2E | P0 | Playwright/Detox 도구 추가 필요 |
| MANUAL-007 | 결제/배송/외부 | 배송 수령 | 실제 배송 주소/외부 연동 | 운영 또는 staging 연동 | 배송 선택/주소 저장/예약 | 외부 연동 부작용 정상 | 수동 | integration | P2 | 없음 |
| MANUAL-008 | UX | 실제 모바일 | 터치감/레이아웃 | Android/iOS 다양한 크기 | 예약 생성 전 구간 터치 | 겹침 없음, 스크롤/키보드 정상 | 수동 | usability/accessibility | P1 | 자동 일부 가능 |
| MANUAL-009 | 네트워크 | 앱 | 네트워크 끊김/복구 | 실기기 | submit 중 airplane mode, 복구 | 중복 예약 없음, 오류/재시도 명확 | 수동 | resilience | P1 | mock test 보강 가능 |
| MANUAL-010 | RLS | Supabase staging | 타 사용자 데이터 접근 차단 | user A/B/admin 계정 | REST/RPC 직접 호출 | 타인 booking select/update 불가 | 스테이징 전용 | security QA | P0 | `supabase/tests/rls_tests.sql` 실행 권장 |

## 지금 당장 추가해야 할 테스트 TOP 10

1. `LOGOUT-004`: 로그아웃 실패 시 에러 표시.
2. `AUTH-004`: `useAuth` 차단 계정 snapshot/store 초기화.
3. `BOOKING-007`: 텐션 20/70/19/71 경계.
4. `BOOKING-009`: blocked/full/past slot disabled 상태.
5. `BOOKING-012`: 배송 주소 필수 component 레벨.
6. `ADMIN-010`: 완료/반납/노쇼 이후 상태 잠금 server action.
7. `CROSS-001`: 예약 생성 row가 관리자 pending list로 매핑되는지.
8. `BUTTON-006`: 관리자 버튼 inventory static test.
9. `RLS-002`: 예약 RPC별 `auth.uid()` guard와 anon revoke 회귀.
10. `ADMIN-005`: 승인/거절/취소 승인 버튼 loading/feedback. 단, admin UI runner 추가 필요.

## 기존 테스트에서 이미 커버되는 항목

로그인 실패/로딩/라우팅 책임 분리, Google OAuth mock, 로그아웃 성공/로딩, 스트링 예약 기본 생성, 시타 예약 기본 생성, 하이브리드 스트링, 재예약 프리필, 1주 반납 제한, 예약 목록/상세 이동, 취소 요청/무료 취소 서비스 로직, 관리자 승인/거절/권한 차단, demo 승인/반납 일부, RLS 마이그레이션 정적 검증은 이미 상당히 들어가 있다.

## 커버리지 공백

관리자 웹은 실제 컴포넌트 interaction 테스트가 약하다. `내보내기`, `새 예약` 버튼은 현재 `onClick`/링크가 없어 미구현/구현 필요로 분류된다. 예약 생성의 주소 필수 UI, 메모 payload, 슬롯 disabled 접근성, 로그아웃 실패 UI, 완료 이후 상태 잠금의 server action 회귀, 사용자 앱과 관리자 웹 간 end-to-end 반영은 공백이다.

## LLM이 바로 작성 가능한 테스트 파일 목록

- `__tests__/loginScreen.test.tsx`
- `__tests__/useAuth.test.ts`
- `__tests__/meScreen.test.tsx`
- `__tests__/newBookingScreen.test.tsx`
- `__tests__/bookingScreen.test.tsx`
- `__tests__/bookingDetailScreen.test.tsx`
- `__tests__/bookingService.test.ts`
- `__tests__/demoBookingService.test.ts`
- `__tests__/adminBookingService.test.ts`
- `__tests__/adminDemoBookingService.test.ts`
- 새 `__tests__/adminBookingDataMapping.test.ts`
- 새 `__tests__/adminButtonInventory.test.js`
- 새 `__tests__/adminWebBookingsPage.test.js`
- 새 `__tests__/bookingRlsRpcGuards.test.js`

실행 명령:

- `npm run test -- <파일명>`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run admin:build`

## 사람이 직접 확인해야 하는 체크리스트

- Google/Kakao 실제 OAuth 로그인, 취소, redirect 복귀.
- Android/iOS 실기기에서 OAuth 브라우저, 알림 권한, 키보드, 스크롤 확인.
- 스테이징 Supabase에서 예약 생성/승인/거절/취소 승인 후 row, slot count, audit log, notification 확인.
- 관리자와 사용자 앱을 동시에 열고 상태 반영 확인.
- 푸시 알림 실제 수신과 quiet hour 정책 확인.
- 네트워크 끊김/복구 중 중복 예약 방지 확인.
- RLS: user A가 user B 예약/주소/로그를 직접 조회·변경하지 못하는지 확인.

## 테스트 작성 순서 추천

1. P0 service/RLS부터: `bookingService`, `adminBookingService`, migration static.
2. P0 화면 흐름: login/logout/new-booking/booking-detail.
3. 버튼 inventory static test로 누락 버튼을 전체 목록화.
4. 관리자 웹 static/build 테스트 보강.
5. admin UI interaction runner 도입 검토.
6. 스테이징 수동 E2E 체크리스트 수행.

## 위험도가 높은 예약/관리자 상태 전이 목록

- `requested -> approved/rejected/cancelled_admin/cancelled_user`
- `requested -> in_progress/completed` 직접 전이 허용 여부 회귀
- `approved -> in_progress/completed/no_show/cancelled_*`
- `reschedule_requested -> approved/cancelled_*`
- `completed -> pickup_ready/delivered -> done`
- `done/cancelled_admin/cancelled_user/rejected/no_show/refund_done -> any` 잠금
- demo `requested -> approved/rejected/cancelled_admin`
- demo `approved -> in_use/no_show/cancelled_admin`
- demo `in_use -> returned/overdue`
- demo `returned/no_show/cancelled_* -> any` 잠금
