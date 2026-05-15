# YellowBall 실기기 동적 테스트 결과

실행일: 2026-05-14  
기기: Samsung SM-N950N (`ce11171b800fcb04047e`)  
앱: `com.yellowball.mobile` dev-client 빌드 `1.0.0`, Expo Go `54.0.6`  
방식: USB ADB + `adb reverse` + Expo dev-client

## 실행 환경

| 항목 | 결과 |
| --- | --- |
| ADB 연결 | PASS - `adb devices -l`에서 `device` 상태 확인 |
| 설치 앱 | PASS - `com.yellowball.mobile`, `host.exp.exponent` 확인 |
| Expo Go 실행 | BLOCKED - `Something went wrong`, `java.io.IOException: Failed to download remote update` |
| Expo Go 캐시 초기화 | 수행 - `pm clear host.exp.exponent` 후에도 동일 오류 |
| Dev-client 실행 | PASS - `npx expo start --dev-client --offline --port 8122` + `yellowball://expo-development-client/?url=http://127.0.0.1:8122` |
| Metro/Expo 오류 대응 | PASS - `trouble_shooting.md`의 `adb reverse`, offline Metro, dev-client 경로 적용 |

## 동적 테스트 결과

| ID | 영역 | 시나리오 | 결과 | 증거/아티팩트 | 비고 |
| --- | --- | --- | --- | --- | --- |
| DEVICE-001 | 환경 | 실기기 ADB 연결 | PASS | `adb devices -l` | 기본 ADB 명령은 PATH에 없어 SDK 직접 경로 사용 |
| DEVICE-002 | Expo/Metro | Expo Go로 프로젝트 열기 | BLOCKED | `device-artifacts/yellowball-expogo-errorlog.xml` | `Failed to download remote update`; dev-client로 우회 필요 |
| DEVICE-003 | Expo/Metro | dev-client 딥링크로 앱 실행 | PASS | `device-artifacts/yellowball-devclient-8122.png` | 로그인 화면 정상 렌더링 |
| AUTH-DYN-001 | 로그인 | 로그인 화면 렌더링 | PASS | `device-artifacts/yellowball-devclient-8122.png` | 로고, 이메일/비밀번호, 로그인, Google/Kakao 버튼 표시 |
| AUTH-DYN-002 | 로그인 | 빈 값 로그인 제출 | PASS | `device-artifacts/yellowball-login-empty-submit.png` | `이메일과 비밀번호를 입력해 주세요.` 표시 |
| AUTH-DYN-003 | 로그인 | 비밀번호 보기 토글 | PASS | `device-artifacts/yellowball-password-show.xml` | `password=false`, label이 `비밀번호 숨기기`로 변경 |
| AUTH-DYN-004 | OAuth | Google 로그인 버튼 press | PASS/PARTIAL | `device-artifacts/yellowball-google-tap.png` | 외부 인증 흐름 시작, Android 연결 프로그램 선택 시트 표시. 실제 OAuth 완료는 수동 필요 |
| AUTH-DYN-005 | OAuth | Google 인증 취소 피드백 | PASS | `device-artifacts/yellowball-password-show.xml` | 뒤로 가기 후 `로그인이 취소되었습니다.` 표시 |
| AUTH-DYN-006 | 로그인 | 가짜 계정 로그인 실패 | INCONCLUSIVE | `device-artifacts/yellowball-login-invalid-result.png` | ADB 텍스트 입력이 이메일 필드에 합쳐져 API 실패 검증으로 인정 불가 |
| AUTH-DYN-007 | 보호 라우트 | 비로그인 상태에서 `yellowball://new-booking` 접근 | PARTIAL | `device-artifacts/yellowball-protected-new-booking.png` | 화면은 로그인 유지. Android가 기존 top instance로 전달해 라우트 전환 여부는 추가 검증 필요 |
| REGISTER-DYN-001 | 회원가입 | 로그인 화면에서 회원가입 진입 | PASS | `device-artifacts/yellowball-register-screen.png` | `회원가입` 화면 정상 표시 |
| REGISTER-DYN-002 | 회원가입 | 회원가입 필드 렌더링 | PASS | `device-artifacts/yellowball-register-screen.xml` | 이메일, 도메인, 아이디, 닉네임, 비밀번호, 비밀번호 확인 노출 |
| REGISTER-DYN-003 | 회원가입 | 이메일 도메인 메뉴 열기 | PASS | `device-artifacts/yellowball-register-domain.xml` | `naver.com`, `gmail.com`, `daum.net`, `hanmail.net`, `kakao.com`, `직접 입력` 노출 |
| REGISTER-DYN-004 | 회원가입 | 빈 값/placeholder 상태 가입 제출 | PASS | `device-artifacts/yellowball-register-empty-submit.xml` | 이메일/아이디/닉네임/비밀번호/확인 validation 메시지 표시 |
| A11Y-DYN-001 | 접근성 | 로그인 입력/주요 버튼 label 노출 | PASS/PARTIAL | XML 덤프 | 이메일/비밀번호/로그인/비밀번호 보기/회원가입은 `content-desc` 또는 Button으로 노출 |
| A11Y-DYN-002 | 접근성 | 소셜 로그인/가입 버튼 접근성 | FAIL/RISK | `yellowball-login-scrolled.xml`, `yellowball-register-screen.xml` | `google-social-*`, `kakao-social-*` surface가 `clickable=false`, `content-desc=""`로 보임. 시각 텍스트는 있으나 UIAutomator 접근성 노출이 부족 |

## 확인된 이슈

1. Expo Go 경로는 현재 실기기에서 동적 테스트 진입점으로 신뢰하기 어렵습니다. `Failed to download remote update`가 반복되어 dev-client 경로가 필요합니다.
2. 로그인/회원가입 소셜 버튼은 실제 tap 동작은 되지만, UIAutomator 기준으로 button role/label이 노출되지 않습니다. 접근성 테스트 기준에서는 개선 대상입니다.
3. ADB 텍스트 입력으로 로그인 실패 API 흐름을 검증하려면 입력 필드 clear/focus 안정화가 추가로 필요합니다.
4. 비로그인 보호 라우트 딥링크 검증은 Android가 기존 top instance로 intent를 전달해 명확히 판정하기 어렵습니다. 앱 내부 라우팅 이벤트 로그 또는 Detox/Appium류 도구가 있으면 더 안정적으로 검증할 수 있습니다.

## 수동 확인 필요

| 항목 | 이유 | 절차 |
| --- | --- | --- |
| 실제 Google OAuth 완료 | 계정/브라우저/리다이렉트 필요 | Google 버튼 → 브라우저 선택 → 실제 계정 로그인 → 앱 복귀 및 세션 생성 확인 |
| 실제 Kakao OAuth 완료 | Kakao 앱/계정/리다이렉트 필요 | Kakao 버튼 → 카카오톡/브라우저 인증 → 앱 복귀 및 세션 생성 확인 |
| 로그인 성공 후 예약 탭/신규 예약/마이 페이지 | 테스트 계정 필요 | 정상 계정 로그인 후 탭 이동, 예약 생성 전 단계, 로그아웃 확인 |
| 예약 생성/관리자 반영 | 실제 Supabase mutation 발생 | 스테이징 DB에서 예약 생성 → 관리자 페이지 표시 → 상태 변경 → 앱 목록/상세 반영 확인 |
| 푸시 알림 | OS 권한/실기기 토큰 필요 | 알림 권한 허용 → 예약 상태 변경 → 실제 푸시 수신 확인 |

## 재현 명령

```powershell
$adb="$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices -l
& $adb reverse tcp:8122 tcp:8122
npx expo start --dev-client --offline --port 8122
& $adb shell am start -a android.intent.action.VIEW -d "yellowball://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8122" com.yellowball.mobile
```

---

## 로그인 후 실기기 동적 테스트 추가 결과

실행일: 2026-05-14 17:30~17:36  
기기: Samsung SM-N950N (`ce11171b800fcb04047e`)  
앱: `com.yellowball.mobile`  
원칙: 실제 Supabase 예약 생성/예약 취소 확정처럼 운영 데이터가 바뀌는 동작은 누르지 않고, 마지막에 로그아웃만 실제 수행했다.

| ID | 영역 | 시나리오 | 결과 | 증거/아티팩트 | 비고 |
| --- | --- | --- | --- | --- | --- |
| HOME-DYN-001 | 홈 | 로그인 후 홈 화면 진입 및 사용자 정보 표시 | PASS | `device-artifacts/yellowball-after-login-current.png`, `.xml` | `Hy_test` 사용자, 하단 탭, 빠른 예약 버튼, 진행 중 예약 카드 확인 |
| HOME-DYN-002 | 홈 버튼 | 홈 빠른 액션 버튼 접근성 노출 | PASS | `yellowball-after-login-current.xml` | `스트링 작업`, `라켓 시타`, `용품 쇼핑`, `알림` content-desc 확인 |
| BOOKING-DYN-001 | 예약 목록 | 예약 탭 진입 및 진행 중 예약 표시 | PASS | `yellowball-booking-list.png`, `.xml` | `내 예약`, `새 예약 만들기`, `진행 중`, `지난 예약`, 예약 카드 표시 |
| BOOKING-DYN-002 | 예약 목록 버튼 | 스트링/시타 예약 CTA 접근성 노출 | PASS | `yellowball-booking-list.xml` | `booking-cta-string-booking`, `booking-cta-demo-booking` 버튼 확인 |
| BOOKING-DYN-003 | 예약 상세 | 진행 중 예약 상세 진입 | PASS | `yellowball-booking-detail-dyn.png`, `.xml` | 상태 `접수`, 예약 ID, 라켓/스트링/시간/텐션/수령 방식/타임라인 표시 |
| BOOKING-DYN-004 | 예약 취소 | 취소 버튼 클릭 시 확인 다이얼로그 표시 | PASS | `yellowball-booking-cancel-dialog.png`, `.xml` | `예약을 취소할까요?`, 취소/예약 취소 버튼 확인. 확정 버튼은 누르지 않음 |
| BOOKING-DYN-005 | 예약 취소 보호 | 취소 확인 다이얼로그에서 취소로 닫기 | PASS | ADB 조작, 이후 새 예약 진입 성공 | 실제 예약 취소 mutation 미수행 |
| NEWBOOKING-DYN-001 | 새 예약 | 스트링 예약 기본 화면 표시 | PASS | `yellowball-new-booking-initial.png`, `.xml` | 스트링/시타 세그먼트, 라켓 선택, 단일 스트링 선택 확인 |
| NEWBOOKING-DYN-002 | 새 예약 | 스트링 선택/하이브리드 텐션 UI 표시 | PASS | `yellowball-new-booking-middle.png`, `.xml` | 단일 스트링 목록, `균일 텐션`, `하이브리드 (메인/크로스)` 버튼 확인 |
| NEWBOOKING-DYN-003 | 새 예약 | 텐션 입력/증감 버튼 표시 | PASS | `yellowball-new-booking-lower.png`, `.xml` | 감소/직접 입력/증가 컨트롤, 기본값 `48` 확인 |
| NEWBOOKING-DYN-004 | 새 예약 | 날짜/영업시간/마감 슬롯 표시 | PASS | `yellowball-new-booking-bottom.png`, `.xml` | 2026-05-14 선택 시 예약 가능 0개, 영업시간 09:00-18:00, 선택 가능 항목 없음 |
| NEWBOOKING-DYN-005 | 새 예약 | 예약 가능 날짜 선택 시 슬롯 활성/비활성 표시 | PASS | `yellowball-new-booking-date-selected.png`, `.xml` | 2026-05-16 선택 시 예약 가능 6개, 10:00~15:00 enabled, 16:00 disabled |
| DEMO-DYN-001 | 시타 예약 | 시타 예약 세그먼트 및 라켓 선택 표시 | PASS | `yellowball-demo-booking-header.png`, `.xml` | `시타` selected, `시타 라켓 Bobolat pure drive` 버튼 확인 |
| DEMO-DYN-002 | 시타 예약 | 날짜/반납 예정 시간/메모/예약 접수 영역 표시 | PASS | `yellowball-demo-booking-screen.png`, `.xml` | 반납 예정 시간 `17:30`, 요청사항 입력, `예약 접수` 버튼 확인. 제출은 누르지 않음 |
| ME-DYN-001 | 마이 | 마이 탭 진입 및 프로필/통계 표시 | PASS | `yellowball-me-screen-logged-in.png`, `.xml` | Hy_test, MEMBER, 스트링 예약/데모 예약/내 라켓/진행 중 통계 확인 |
| ME-DYN-002 | 마이 버튼 | 프로필 수정/라켓 추가/라켓 관리 버튼 표시 | PASS/RISK | `yellowball-me-screen-logged-in.xml`, `yellowball-me-screen-lower.xml` | `프로필 수정`, `라켓 추가`, `Babolat Pure aero 관리` 확인. 두 번째 라켓은 `  관리`처럼 이름 없는 접근성 라벨 노출 |
| ME-DYN-003 | 마이 하단 | 주문/계정/고객지원/로그아웃 버튼 표시 | PASS | `yellowball-me-screen-account-actions.png`, `.xml` | `주문 내역`, `알림 설정`, `공지사항`, `문의하기`, `로그아웃` 버튼 확인 |
| LOGOUT-DYN-001 | 로그아웃 | 로그아웃 버튼 클릭 후 로그인 화면 이동 | PASS | `yellowball-logout-after-1s.png`, `.xml`, `yellowball-logout-final.png`, `.xml` | 1초 내 로그인 화면으로 이동, 이메일/비밀번호/소셜 로그인 영역 표시 |
| A11Y-DYN-003 | 접근성 | 사용자 예약/마이 주요 버튼 content-desc 확인 | PASS/PARTIAL | 각 XML | 대부분 주요 버튼 label 노출. 날짜 버튼은 `Select 2026-05-16`처럼 영문 라벨이고, 일부 라켓 카드 라벨이 비어 있어 개선 필요 |

## 로그인 후 동적 테스트에서 발견한 이슈/위험

1. 새 예약 라켓 선택과 마이 라켓 목록에서 이름 없는 라켓이 ` , 스펙 미등록`, `  관리`처럼 접근성 라벨이 비어 있는 상태로 노출된다.
2. 달력 날짜 접근성 라벨이 `Select 2026-05-16`처럼 영문으로 노출된다. 한국어 서비스 기준으로 `2026년 5월 16일 선택`처럼 현지화가 필요하다.
3. 예약 생성 `예약 접수`와 예약 취소 확정 `예약 취소`는 실제 DB mutation이라 이번 실기기 테스트에서는 누르지 않았다. 스테이징 DB에서 별도 확인해야 한다.
4. 로그아웃은 성공했지만 로딩 상태는 매우 짧아 육안/캡처로 별도 식별하지 못했다. 느린 네트워크 또는 authService 지연 mock이 가능한 자동화 테스트에서 보강이 필요하다.

스크린샷/XML 아티팩트는 `device-artifacts/`에 저장했습니다.

---

## 실제 DB/관리자 웹 통합 동적 테스트 추가 결과

실행일: 2026-05-15 10:00~10:23 KST  
기기: Samsung SM-S931N (`R3KYB04LA1B`)  
관리자 웹: `http://localhost:3000`  
Metro: `http://localhost:8122`  
테스트 예약 ID: `9172ad00-8033-4ad3-8473-dcdb748e5f92`

| ID | 영역 | 시나리오 | 결과 | 증거/아티팩트 | 비고 |
| --- | --- | --- | --- | --- | --- |
| INT-REAL-001 | 예약 생성 | 사용자 앱에서 실제 스트링 예약 생성 | PASS | `after-submit.png`, `after-submit.xml` | 예약 번호 `9172ad00-8033-4ad3-8473-dcdb748e5f92` |
| INT-REAL-002 | DB 검증 | 생성 후 DB row/slot/알림 확인 | PASS | DB 조회 | status `requested`, slot `reserved_count=1`, 사용자 알림 `service_requested` |
| INT-REAL-003 | 관리자 웹 목록 | 관리자 예약 관리 페이지에 신규 예약 표시 | PASS | `admin-bookings-after-create-*.png` | `YB-9172AD00`, Hy_test, 2026-05-16 10:00 표시 |
| INT-REAL-004 | 관리자 웹 상세 | 상세 페이지에서 메모/라켓/스트링/일시 표시 | PASS | `admin-booking-detail-requested-*.png` | 메모 `LLM-INTEGRATION-20260515-1010` 표시 |
| INT-REAL-005 | 관리자 승인 | 관리자 상세에서 승인 클릭 후 앱/DB 반영 | PASS/PARTIAL | `admin-booking-detail-approved-*.png`, `user-bookings-after-approve.png`, `user-detail-after-approve.png` | DB status `approved`, 앱/관리자 UI `승인` 표시 |
| INT-REAL-006 | 승인 로그/알림 | 관리자 승인 후 상태 로그/승인 알림 생성 | FAIL | DB 조회 | `booking_status_logs` 승인 로그 없음, 승인 알림 없음 |
| INT-REAL-007 | 사용자 취소 | 사용자 앱에서 승인 예약 무료 취소 | PASS | `user-cancel-dialog2.png`, `user-after-cancel-confirm.png` | 취소 성공 피드백 표시 |
| INT-REAL-008 | 슬롯 복구 | 취소 후 slot reserved_count 복구 | PASS | DB 조회 | `reserved_count=0` |
| INT-REAL-009 | 취소 로그/알림 | 취소 후 상태 로그/사용자 알림 생성 | PASS | DB 조회 | `approved -> cancelled_user` 로그, `service_cancelled_user` 알림 생성 |
| INT-REAL-010 | 취소 상태 라벨 | 취소 후 사용자 앱/관리자 웹 상태 표시 | FAIL | `user-after-cancel-detail.png`, `admin-booking-detail-after-user-cancel-*.png` | DB는 `cancelled_user`이나 화면 배지는 둘 다 `접수` 표시 |

추가 발견 사항:

1. 관리자 웹 `updateServiceBookingStatus`는 상태 변경 RPC를 쓰지 않고 직접 patch하여 승인 로그와 승인 알림이 누락된다.
2. `cancelled_user` 상태 라벨이 사용자 앱과 관리자 웹에서 `접수`로 잘못 표시된다.
3. 예약 생성/취소 시 사용자 알림은 생성됐지만 관리자 대상 알림 row는 확인되지 않았다.
4. 임시 관리자 계정은 테스트 후 삭제했고 `profiles`/`admin_permissions` 잔여 row가 없음을 확인했다.

## 발견 결함

| ID | 심각도 | 영역 | 결함 | 재현 절차 | 실제 결과 | 기대 결과 | 영향 | 권장 조치 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-INT-001 | P0 | 관리자 상태 변경 | 관리자 웹 승인 시 상태 로그와 승인 알림이 생성되지 않음 | 관리자 예약 상세에서 `승인` 클릭 후 DB의 `booking_status_logs`, `notifications` 조회 | `service_bookings.status`만 `approved`로 변경되고 승인 로그/승인 알림 없음 | 관리자 승인도 상태 변경 로그가 남고 사용자 알림이 생성되어야 함 | 감사 추적 불가, 사용자 알림 누락, 상태 변경 원인 분석 어려움 | `apps/admin-web/lib/admin-actions.ts`의 `updateServiceBookingStatus`가 직접 patch 대신 `admin_update_service_booking_status` RPC 또는 동일한 로그/알림 처리 경로를 사용하도록 수정 |
| BUG-INT-002 | P0 | 관리자 상태 변경/슬롯 정합성 | 관리자 웹 상태 변경이 RPC를 우회해 terminal 상태 전환 시 슬롯 카운트 정합성 위험 | 관리자 웹에서 승인/거절/관리자 취소/노쇼 등 상태 변경 | 현재 승인은 status만 변경됨. 취소/노쇼도 직접 patch 구조라 slot decrement 보장이 약함 | 상태 전환은 DB RPC에서 로그, 알림, 슬롯 카운트를 원자적으로 처리해야 함 | 이중 예약 가능성, 예약 가능 수 오염, 운영 데이터 불일치 | 관리자 웹 상태 변경 전체를 DB RPC 중심으로 통합하고 terminal 상태 전환 테스트 추가 |
| BUG-INT-003 | P1 | 사용자 앱/관리자 웹 상태 라벨 | `cancelled_user` 상태가 화면에서 `접수`로 표시됨 | 사용자 앱에서 예약 취소 후 사용자 앱 상세 및 관리자 상세 확인 | DB는 `cancelled_user`인데 화면 배지는 `접수` | 사용자 취소/취소됨 등 명확한 취소 상태로 표시 | 운영자와 사용자가 취소된 예약을 접수 상태로 오해 가능 | 상태 라벨 매핑에서 `cancelled_user`를 `사용자 취소` 또는 `취소`로 변경. 사용자 앱/관리자 웹 공통 매핑 테스트 추가 |
| BUG-INT-004 | P1 | 관리자 알림 | 예약 생성/취소 후 관리자 대상 알림 row가 확인되지 않음 | 사용자 앱에서 예약 생성/취소 후 `notifications` 테이블에서 해당 bookingId 포함 row 조회 | 사용자 알림은 생성되지만 관리자 대상 알림은 확인되지 않음 | 신규 예약/취소 이벤트는 관리자에게도 알림 또는 운영 알림 row가 남아야 함 | 관리자가 신규 예약/취소를 놓칠 수 있음 | `notifyAdmins`의 native/web 분기, Edge Function 실패 fallback, 관리자 notification 저장 정책 재검토 |
| BUG-A11Y-001 | P2 | 접근성 | 달력 날짜 접근성 라벨이 영문으로 노출됨 | 새 예약 달력 화면에서 XML dump 확인 | `Select 2026-05-16` | `2026년 5월 16일 선택` 같은 한국어 라벨 | 스크린리더 사용자 경험 저하 | 달력 날짜 버튼 `accessibilityLabel` 현지화 |
| BUG-A11Y-002 | P2 | 접근성 | 이름 없는 라켓 카드 accessibility label이 비어 있음 | 새 예약 라켓 선택/마이 라켓 목록 XML 확인 | ` , 스펙 미등록`, `  관리` | 라켓명 없을 때도 `이름 없는 라켓`, `라켓 관리` 등 의미 있는 라벨 | 스크린리더 사용자에게 버튼 목적 전달 실패 | 라켓명 fallback label 추가 및 빈 문자열 방어 |

## 결함별 증거

- BUG-INT-001: 관리자 승인 후 DB 조회에서 `service_bookings.status=approved`, `booking_status_logs=[]`, 승인 알림 없음.
- BUG-INT-002: 관리자 웹 `apps/admin-web/lib/admin-actions.ts`의 `updateServiceBookingStatus`가 `patchRow('service_bookings', ...)` 직접 호출.
- BUG-INT-003: `user-after-cancel-detail.png`, `admin-booking-detail-after-user-cancel-*.png`에서 DB `cancelled_user` 상태가 화면 `접수`로 표시.
- BUG-INT-004: `notifications` 조회 결과 해당 bookingId 기준 사용자 알림 `service_requested`, `service_cancelled_user`만 확인.
- BUG-A11Y-001: `after-date.xml`, `slots-visible.xml`에서 날짜 버튼 content-desc가 `Select 2026-05-16`.
- BUG-A11Y-002: 기존 로그인 후 동적 테스트 XML에서 이름 없는 라켓 관련 label 공백 확인.

---

## 외부 연동 제외 잔여 테스트 추가 실행

실행일: 2026-05-15 11:04~11:10 KST  
범위: Google/Kakao OAuth, 실제 푸시 수신, 실제 배송/외부 서비스는 제외  
방식: 실제 Supabase Auth/DB에 임시 사용자, 임시 관리자, 임시 슬롯/예약을 생성한 뒤 관리자 웹과 Supabase RLS를 검증했다. 테스트 후 임시 `service_bookings`, `booking_slots`, `booking_status_logs`, `profiles`, `admin_permissions`, Supabase Auth 사용자를 삭제했고 잔여 row가 없음을 확인했다.

| ID | 영역 | 시나리오 | 결과 | 증거/아티팩트 | 비고 |
| --- | --- | --- | --- | --- | --- |
| ADMIN-REAL-REJECT-001 | 관리자 거절 | 관리자 웹 상세에서 접수 예약 `거절` 클릭 | FAIL/PARTIAL | `remaining-admin-reject-result-*.png`, `remaining-integration-db-after-ui.json` | DB status는 `rejected`로 변경됐지만 화면 라벨은 `접수`, slot `reserved_count=1`, 상태 로그/알림 없음 |
| ADMIN-REAL-CANCEL-001 | 관리자 취소 승인 | `cancel_requested` 로그가 있는 예약에서 `취소 승인` 클릭 | FAIL/PARTIAL | `remaining-admin-cancel-approval-result-*.png`, `remaining-integration-db-after-ui.json` | DB status는 `cancelled_admin`으로 변경됐지만 slot `reserved_count=1`, 취소 승인 로그/알림 없음 |
| ADMIN-LOCK-001 | 완료 상태 잠금 | `completed` 예약 상세의 상태 변경 버튼 확인 | PASS | `remaining-admin-completed-locked-*.png` | `상태 변경` 버튼 disabled 및 title 표시 |
| ADMIN-LOCK-002 | 노쇼 상태 잠금 | `no_show` 예약 상세의 상태 변경 버튼 확인 | FAIL | `remaining-admin-noshow-not-locked-*.png` | 노쇼 상태에서도 상태 변경 메뉴가 열림 |
| ADMIN-AUTH-001 | 관리자 권한 없음 | role `admin`이지만 `can_manage_bookings=false` 계정으로 로그인 | PASS | `remaining-admin-no-permission-forbidden-*.png` | 로그인은 되지만 `접근 가능한 관리자 메뉴가 없습니다` 표시 |
| ADMIN-AUTH-002 | 일반 사용자 관리자 접근 | role `user` 계정으로 관리자 로그인 시도 | PASS | `remaining-admin-plain-user-blocked-*.png` | `관리자 또는 슈퍼 관리자 계정만 접근할 수 있습니다.` 표시 |
| RLS-REAL-001 | 타 사용자 조회 차단 | 사용자 B가 사용자 A의 예약 조회 | PASS | `remaining-integration-state.json` | select 결과 0건 |
| RLS-REAL-002 | 타 사용자 수정 차단 | 사용자 B가 사용자 A의 예약 update | PASS | `remaining-integration-state.json` | update 결과 0건 |
| RLS-REAL-003 | 타 사용자 취소 RPC 차단 | 사용자 B가 사용자 A 예약 `user_cancel_service_booking` 호출 | PASS | `remaining-integration-state.json` | `본인 예약만 취소할 수 있습니다.` |
| RLS-REAL-004 | anon 예약 조회/생성 차단 | anon key로 예약 조회 및 생성 RPC 호출 | PASS | `remaining-integration-state.json` | 조회 0건, RPC `permission denied` |
| CANCEL-REQ-001 | 마감 임박 취소 요청 | 사용자 권한으로 `cancel_requested` 상태 로그 insert | FAIL | `remaining-integration-state.json` | RLS `42501`: `booking_status_logs` insert 차단 |
| NEG-REAL-001 | 배송 주소 필수 | `parcel` 예약을 주소 없이 생성 RPC 호출 | PASS | `remaining-integration-state.json` | `Delivery bookings require an address.` |
| NEG-REAL-002 | blocked slot 차단 | `is_blocked=true` 슬롯으로 생성 RPC 호출 | PASS | `remaining-integration-state.json` | `Stringing slot is not available.` |
| NEG-REAL-003 | full slot 차단 | capacity 초과 슬롯으로 생성 RPC 호출 | PASS | `remaining-integration-state.json` | `Stringing slot is not available.` |
| NEG-REAL-004 | 노쇼 제한 | `no_show_counted=true` 3건 보유 사용자의 예약 생성 | PASS | `remaining-integration-state.json` | `Users with unresolved repeated no-shows cannot create bookings.` |
| STATE-REAL-001 | 상태 전이 | DB RPC로 `requested -> completed` 직접 전이 시도 | FAIL | `remaining-integration-state.json` | 전이가 성공함. 중간 상태를 건너뛰는 전이가 허용됨 |
| CLEANUP-REAL-001 | 테스트 데이터 정리 | 임시 계정/예약/슬롯/로그 삭제 검증 | PASS | `remaining-integration-cleanup.json` | bookings, slots, profiles, permissions, logs 모두 0건 |

## 추가 발견 결함

| ID | 심각도 | 영역 | 결함 | 재현 절차 | 실제 결과 | 기대 결과 | 영향 | 권장 조치 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-INT-005 | P0 | 사용자 취소 요청/RLS | 마감 임박 취소 요청이 `booking_status_logs` RLS에 막힘 | 시작 6시간 이내 예약에서 사용자 권한으로 취소 요청 로그 insert | `new row violates row-level security policy for table "booking_status_logs"` | 사용자는 본인 예약에 대해 `cancel_requested` 로그를 생성할 수 있어야 함 | 마감 임박 취소 요청 기능이 실제 DB에서 실패 가능 | 사용자 취소 요청 전용 RPC를 만들거나 `booking_status_logs`에 제한된 INSERT policy 추가 |
| BUG-INT-006 | P0 | 관리자 거절/취소 승인 | 관리자 웹 거절/취소 승인이 슬롯을 release하지 않음 | 관리자 웹에서 `거절` 또는 `취소 승인` 클릭 후 slot 조회 | terminal 상태인데 `reserved_count=1` 유지 | `rejected`, `cancelled_admin` 전환 시 slot count가 감소해야 함 | 예약 가능 슬롯이 막혀 매출/운영 손실 가능 | 관리자 웹 상태 변경을 `admin_update_service_booking_status` RPC로 통합 |
| BUG-INT-007 | P0 | 관리자 상태 로그/알림 | 관리자 웹 거절/취소 승인 시 상태 로그와 알림이 생성되지 않음 | 관리자 웹 상태 변경 후 `booking_status_logs`, `notifications` 조회 | 거절/취소 승인 로그 및 알림 없음 | 모든 관리자 상태 변경은 감사 가능한 로그와 사용자 알림을 남겨야 함 | 감사 추적/사용자 안내 누락 | RPC 또는 service layer에서 로그/알림 생성까지 원자 처리 |
| BUG-INT-008 | P1 | 상태 라벨 | `rejected` 상태가 관리자 웹에서 `접수`로 표시됨 | 관리자 웹에서 예약 거절 후 상세 확인 | DB는 `rejected`, 화면은 `접수` | `거절`로 표시 | 운영자가 거절 예약을 접수 예약으로 오해 | `statusLabels.rejected`를 `거절`로 수정하고 회귀 테스트 추가 |
| BUG-INT-009 | P1 | 노쇼 상태 잠금 | `no_show` 상태에서도 관리자 상태 변경 메뉴가 열림 | no_show 예약 상세에서 `상태 변경` 클릭 | 상태 변경 옵션 노출 | 노쇼 이후 상태 변경 잠금 | 확정된 노쇼 상태가 임의 변경될 수 있음 | `LOCKED_SERVICE_STATUSES`에 `no_show` 추가 |
| BUG-INT-010 | P1 | 노쇼 카운트 | 관리자 RPC로 `no_show` 전환해도 `no_show_counted`가 true가 되지 않음 | 예약을 `visit_pending -> no_show`로 전환 후 row 확인 | status `no_show`, `no_show_counted=false` | 노쇼 처리 시 제한 카운트가 반영되어야 함 | 반복 노쇼 제한이 우회될 수 있음 | no_show 전환 RPC에서 `no_show_counted=true` 설정 및 정책 테스트 추가 |
| BUG-INT-011 | P1 | 상태 전이 | `requested -> completed` 직접 전이가 DB RPC에서 허용됨 | `admin_update_service_booking_status`로 `completed` 직접 호출 | 성공 | 정해진 상태 전이 그래프 외 전이는 거부 | 작업 상태/타임라인 무결성 훼손 | RPC 조건을 명시적 이전 상태 기반으로 재작성 |

## 잔여 수동/외부 연동 항목

이번 요청 범위에서 제외한 항목만 남아 있다.

- 실제 Google OAuth 완료
- 실제 Kakao OAuth 완료
- 실제 OS 푸시 알림 수신
- 실제 Android/iOS 권한 팝업 UX
- 실제 배송/외부 서비스 연동

---

## 사용자 앱 실기기 동적 테스트 보강

실행일: 2026-05-15 11:13~11:20 KST  
기기: Samsung SM-N950N (`ce11171b800fcb04047e`)  
범위: 사용자 앱을 실제 기기에서 실행해 새 예약 UI를 직접 조작했다. 외부 OAuth/푸시/배송 실서비스는 제외했다.

| ID | 영역 | 시나리오 | 결과 | 증거/아티팩트 | 비고 |
| --- | --- | --- | --- | --- | --- |
| MOBILE-DYN-001 | 앱 실행 | Expo dev-client URL로 사용자 앱 실행 | PASS | `mobile-dyn-current.png`, `.xml` | 로그인 화면 렌더링 확인 |
| MOBILE-DYN-002 | 로그인/세션 | 앱 로그인 이후 기존 세션/이전 화면 복귀 | PASS/PARTIAL | `mobile-dyn-after-login.png`, `.xml` | 라켓 상세 화면으로 복귀. 임시 사용자로 새 로그인됐는지는 화면상 확인 불충분 |
| MOBILE-DYN-003 | 새 예약 UI | 하단 `새 예약` 탭 진입 | PASS | `mobile-dyn-newbooking-open.png`, `.xml` | 스트링/시타 세그먼트, 라켓 선택, 스트링 선택 UI 확인 |
| MOBILE-DYN-004 | 접근성 | 새 예약 라켓 카드 accessibility label 확인 | FAIL/RISK | `mobile-dyn-newbooking-open.xml` | 이름 없는 라켓 카드가 ` , 스펙 미등록`으로 노출됨 |
| MOBILE-DYN-005 | 날짜/시간 UI | 새 예약 날짜/시간/수령 방식/메모/예약 접수 영역 확인 | PASS | `mobile-dyn-newbooking-bottom.png`, `.xml` | 날짜 버튼, 예약 가능 슬롯, `매장 픽업`, 요청사항, `예약 접수` 표시 |
| MOBILE-DYN-006 | 예약 접수 동작 | 새 예약 화면 하단 `예약 접수` 탭 | FAIL/RISK | `mobile-dyn-submit-missing-time.png`, `.xml`, `mobile-dyn-accidental-booking-cleanup.json` | 명시적으로 새 슬롯을 선택하지 않았는데 실제 예약이 생성됨. 예약 `3ac97497-b9ee-454e-ab69-57ae22084932` 생성 후 즉시 삭제 및 slot 복구 |
| MOBILE-CLEANUP-001 | 테스트 데이터 정리 | 동적 테스트 중 생성된 예약/임시 사용자/노쇼 이력 정리 | PASS | `mobile-dyn-accidental-booking-cleanup.json`, `mobile-dyn-test-user-cleanup.json` | 예약 삭제, 알림 삭제, slot `reserved_count=0` 복구, 임시 사용자/이력 삭제 확인 |

## 사용자 앱 동적 테스트 추가 결함

| ID | 심각도 | 영역 | 결함 | 재현 절차 | 실제 결과 | 기대 결과 | 영향 | 권장 조치 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-MOBILE-001 | P0 | 예약 생성 UI 상태 | 새 예약 화면에서 명시적인 현재 세션 슬롯 선택 없이 `예약 접수`가 실제 예약을 생성함 | 새 예약 화면 진입 후 하단까지 스크롤하고 `예약 접수` 클릭 | 예약 `3ac97497-b9ee-454e-ab69-57ae22084932` 생성 | 현재 화면에서 사용자가 명시적으로 선택한 날짜/시간이 없으면 제출 차단 또는 선택 상태를 명확히 표시해야 함 | 사용자가 의도하지 않은 슬롯으로 예약 생성 가능 | 새 예약 화면 진입 시 이전 선택 상태 초기화, 선택된 날짜/시간 고정 표시, 제출 전 validation 강화 |
| BUG-MOBILE-002 | P2 | 접근성 | 이름 없는 라켓 카드 label이 공백으로 시작함 | 새 예약 라켓 선택 영역 XML 확인 | ` , 스펙 미등록` | `이름 없는 라켓, 스펙 미등록` 등 의미 있는 label | 스크린리더 사용자가 대상 라켓을 구분하기 어려움 | 라켓 brand/model fallback label 추가 |
