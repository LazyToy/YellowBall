# Admin Web Test Report

검증일: 2026-05-08  
범위: `apps/admin-web` 관리자 웹, 관련 Expo 사용자 앱(`app`, `src`), Supabase 스키마/RLS/실제 DB 상태  
원칙: 소스 수정 없음. DB 변경 없음. 검증 결과 문서만 생성.

## 기준 문서 확인

- Supabase 공식 문서 기준: public schema 테이블은 RLS를 켜야 하며, service role key는 RLS를 우회하므로 브라우저/고객에게 노출하면 안 됨.
  - https://supabase.com/docs/guides/database/postgres/row-level-security
  - https://supabase.com/docs/guides/database/secure-data
  - https://supabase.com/docs/guides/security/product-security
- Next.js 16 공식 문서 기준: Server Actions는 페이지가 보호되어 있어도 별도 공개 엔드포인트처럼 취급하고 action 내부에서 인증/권한 검사를 다시 해야 함.
  - Context7: `/vercel/next.js/v16.2.2`, data security/authentication docs
- Expo SDK 54 공식 문서 기준: Expo Router는 모든 라우트가 정의/접근 가능하므로 `Stack.Protected` 또는 redirect 기반 보호가 필요함.
  - Context7: `/expo/expo/__branch__sdk-54`
  - https://docs.expo.dev/router/advanced/authentication/
- Callstack RN 전용 local skill은 현재 설치 목록에서 찾지 못함. 대신 공식 Callstack React Native Testing Library 문서를 Context7로 확인함.
  - Context7: `/callstack/react-native-testing-library/v13.3.3`

## 실행 결과

- `npm run test -- adminWebPermissions adminWebOperationalPages adminWebSuperAdminData adminService adminBookingService adminDemoBookingService adminNotificationService useRoleGuard usePermission --runInBand`
  - 통과: 9 suites, 47 tests
- `npm --prefix apps/admin-web run lint`
  - 실패 없음, warnings 6개
- `npm --prefix apps/admin-web run build`
  - 최초 sandbox 실행은 Google Fonts 네트워크 차단으로 실패
  - 네트워크 허용 재실행 결과 production build 통과
- Supabase MCP 실제 DB 확인
  - public base table 21개 모두 RLS enabled
  - profiles: `super_admin active` 1명, `user active` 3명
  - admin_permissions: 0 rows
  - app_settings: `app_menu_visibility`, `store_profile` 2개, 둘 다 JSON object
  - app_content_blocks: 6개, `announcement:*`, `brand_assets`, `home_categories`, `home_store_hours`, `shop_filters`, `shop_sale_banner`
- 로컬 HTTP 동적 라우트 접근 테스트
  - `next dev`는 sandbox에서 `spawn EPERM`으로 실패
  - `next start`는 로그상 Ready까지 확인됐으나 같은 세션에서 listener/request 결과를 안정적으로 확보하지 못함
  - 따라서 브라우저 클릭/HTTP redirect 동적 검증은 제한사항으로 남김

## 확인된 양호 사항

1. 관리자 페이지 접근은 중앙 proxy와 admin layout에서 이중으로 보호됨.
   - `apps/admin-web/proxy.ts:63` 비로그인 redirect
   - `apps/admin-web/proxy.ts:87` 권한 없는 admin path redirect
   - `apps/admin-web/proxy.ts:99` matcher가 `/admin/:path*` 포함
   - `apps/admin-web/app/admin/layout.tsx:12` admin layout 재확인

2. 관리자 세션 생성 API는 전달된 access token을 그대로 신뢰하지 않고 `loadAdminFromAccessToken()`으로 실제 Supabase Auth user와 profiles role/status를 다시 확인함.
   - `apps/admin-web/app/admin-auth/session/route.ts:71`
   - `apps/admin-web/lib/admin-auth-core.ts:208`

3. 실제 DB RLS는 전 테이블에 켜져 있고, 관리자성 테이블/기능은 대부분 role 또는 permission 함수 기반 정책이 있음.
   - `admin_permissions`, `administrator_audit_logs`, `service_bookings`, `demo_bookings`, `shop_products`, `string_catalog` 등 확인

4. 운영성 데이터는 대부분 정규 테이블에 있음.
   - 예약: `service_bookings`, `demo_bookings`, `booking_slots`
   - 상품/재고: `shop_products`
   - 스트링: `string_catalog`
   - 시타 라켓: `demo_rackets`
   - 고객/프로필: `profiles`, `addresses`, `user_rackets`
   - 일정: `shop_schedule`

## 주요 문제

### High 1. 관리자 Server Action 조회 헬퍼가 항상 빈 배열을 반환함

`apps/admin-web/lib/admin-actions.ts:65`의 `fetchRows<T>()`가 Supabase 응답 JSON을 반환하지 않고 `return [] as T[]`만 수행함 (`admin-actions.ts:88`).

영향:
- `getProfile()`이 항상 실패 가능 (`appointAdminFromWeb`, `dismissAdminFromWeb`, `updateAdminPermissionsFromWeb`, `loadProfileById`)
- `loadNotificationTargets()`가 항상 빈 배열이 되어 공지 알림 발송 대상 0명 가능
- `loadAnnouncementBlock()`이 항상 공지 없음으로 판단하여 공지 상태 변경/삭제 실패 가능
- 설정 저장 시 before 값이 비어 감사 로그 신뢰도 저하

### High 2. 일부 예약 상태 변경 Action이 DB RPC 검증을 우회함

DB에는 상태 전환을 검증하고 slot count/status log를 처리하는 RPC가 있음:
- `admin_update_service_booking_status`
- `admin_update_demo_booking_status`

하지만 관리자 웹 action은 service role REST PATCH로 `status`만 직접 수정함.
- `apps/admin-web/lib/admin-actions.ts:407`
- `apps/admin-web/lib/admin-actions.ts:426`

영향:
- payload 조작 시 허용되지 않은 상태 순서로 전환 가능
- `booking_status_logs` 누락
- 취소/거절 시 `booking_slots.reserved_count` 정합성 누락
- 사용자 앱 예약 상태 표시와 운영 큐가 불일치할 수 있음

### High 3. Exported Server Action `bulkInsertNotifications`에 권한 검사가 없음

`bulkInsertNotifications()`는 exported server action인데 내부에서 `requireAdminPermission()` 또는 `requireSuperAdmin()`을 호출하지 않고 service role로 `notifications`에 insert함.

- `apps/admin-web/lib/admin-actions.ts:309`
- `apps/admin-web/lib/admin-actions.ts:317`

`sendAnnouncementNotification()` 경유 시에는 권한 검사가 있지만, exported action 자체는 독립 엔드포인트 기준으로 방어되지 않음. Next.js 공식 방향과 맞지 않음.

### High 4. Next mobile preview 라우트가 service role 기반 loader를 직접 사용함

`apps/admin-web/app/(mobile)/layout.tsx:15`에서 `loadAppMenuSettings()`, `loadStoreProfile()`을 직접 호출하고, 이 함수들은 `fetchAdminRows()`를 통해 service role key로 DB를 읽음.

- `apps/admin-web/lib/super-admin-data.ts:989`
- `apps/admin-web/lib/super-admin-data.ts:1000`
- `apps/admin-web/lib/super-admin-data.ts:1011`

현재 proxy matcher가 `/`, `/booking`, `/shop`, `/me`도 관리자 로그인 뒤로 묶고 있어 즉시 공개 노출로 보이진 않지만, 라우트 자체에는 admin guard가 없음. matcher 변경, 배포 환경 proxy 미적용, loader 재사용 시 RLS 의도보다 강한 server-side read가 발생할 수 있음.

### Medium 5. 서버단 payload 검증이 부족함

예시:
- `updateOrderStatus()`는 `newStatus`를 서버에서 enum 검증하지 않고 PATCH (`admin-actions.ts:485`)
- `updateDemoRacketStatus()`도 서버 enum 검증 부족 (`admin-actions.ts:504`)
- `updateProductDetail()`과 `updateDemoRacketDetail()`은 payload spread로 service role PATCH (`admin-actions.ts:1019`, `admin-actions.ts:1051`)
- `uploadStorageImage()`는 런타임 folder 값이 `'products'`가 아니면 demo 권한으로 처리하고 raw folder를 경로에 사용 (`admin-actions.ts:1086`)

TypeScript 타입과 UI 옵션은 payload 조작을 막지 못하므로 Server Action 내부 whitelist/validation이 필요함.

### Medium 6. 사용자 앱 연동 데이터가 일부 hardcoded/fallback으로 동작함

Expo 사용자 앱은 다음 데이터를 DB에서 읽음:
- 홈 콘텐츠: `app/(tabs)/index.tsx:377`, `home_banners`, `home_categories`, `home_store_hours`
- 쇼핑 콘텐츠: `app/(tabs)/shop.tsx:73`, `shop_filters`, `shop_sale_banner`
- 상품: `src/services/shopProductService.ts`
- 스트링: `src/services/stringCatalogService.ts`
- 시타 라켓: `src/services/demoRacketService.ts`

하지만 fallback/default가 강하게 존재함:
- 메뉴 설정 오류 시 기본값 사용: `src/services/appMenuSettingsService.ts:84`, `src/services/appMenuSettingsService.ts:90`
- hook 오류 시 기본값 사용: `src/hooks/useAppMenuSettings.ts:25`
- 홈 배너 DB 누락 시 default banner 사용: `app/(tabs)/index.tsx:437`

관리자에서 메뉴/콘텐츠를 꺼도 DB 조회 실패 상황에서는 사용자 앱이 기본 활성 상태로 보일 수 있음.

### Medium 7. 관리자 preview 컴포넌트 일부는 실제 사용자 앱 DB 데이터와 다름

Next preview의 일부 컴포넌트가 하드코딩 데이터 사용:
- shop filters: `apps/admin-web/components/app/shop/shop-filters.tsx:5`
- shop categories: `apps/admin-web/components/app/shop-categories.tsx:6`
- shop featured: `apps/admin-web/components/app/shop/shop-featured.tsx:8`
- featured strings: `apps/admin-web/components/app/featured-strings.tsx:7`
- demo rackets: `apps/admin-web/components/app/demo-rackets.tsx:7`
- shop hours: `apps/admin-web/components/app/shop-hours.tsx:13`

사용자 Expo 앱의 실제 데이터 경로와 preview가 달라 관리자 preview를 “실제 사용자 앱 동작 검증”으로 신뢰하기 어려움.

### Medium 8. 동작하지 않는 장식 버튼이 다수 있음

예시:
- 예약 Export/새 예약: `apps/admin-web/app/admin/bookings/page.tsx:32`, `:36`
- 고객 Export: `apps/admin-web/app/admin/customers/page.tsx:42`
- 재고 감사/발주 생성: `apps/admin-web/app/admin/inventory/page.tsx:97`, `:100`
- 작업 큐 새로고침: `apps/admin-web/app/admin/queue/page.tsx:29`
- 상품 가져오기/카테고리 필터: `apps/admin-web/app/admin/products/page.tsx:23`, `:46`
- Topbar 새 예약/알림: `apps/admin-web/components/admin/admin-topbar.tsx:42`, `:47`
- Dashboard 카드 내 더보기류: `admin-low-stock.tsx:48`, `admin-recent-orders.tsx:27`, `admin-queue-board.tsx:25`

요청하신 “버튼 포함 전체 기능” 기준에서는 미구현/장식 버튼으로 분류해야 함.

### Info 9. JSONB 사용 경계

JSONB 사용 자체가 모두 문제는 아님. 현재 경계는 대체로 다음처럼 나뉨.

적절한 설정/콘텐츠성 JSONB:
- `app_settings.value`: 메뉴/매장/정책 설정
- `app_content_blocks.payload`: 홈/쇼핑/공지 콘텐츠 블록
- `notifications.data`: 알림 부가 데이터
- `administrator_audit_logs.before_value/after_value`: 감사 snapshot

주의 필요한 JSONB:
- `shop_orders.items`: 주문 라인 아이템이 JSONB 배열. 현재 주문 수 0이라 실제 정합성은 판단 불가. 결제/환불/재고 차감까지 확장되면 별도 `shop_order_items` 정규 테이블이 더 안전함.

## 권한 우회 판단

- 일반 사용자가 `/admin/*` URL 직접 입력으로 관리자 페이지에 들어가는 경로는 현재 코드상 발견하지 못함.
- admin/super_admin만 로그인 가능하도록 `loadAdminFromAccessToken()`에서 profile role/status를 확인함.
- 다만 Server Actions는 별도 공격면이므로, unguarded action과 service-role PATCH action은 권한/무결성 리스크가 있음.
- DB RPC는 `auth.uid() = p_admin_id` 및 role/permission 검사를 포함해 payload 조작 방어가 더 강함. 관리자 웹 action이 이 RPC를 사용하지 않는 부분이 핵심 취약점임.

## 제한사항

- 실제 관리자 계정 credential을 사용한 브라우저 클릭 테스트는 수행하지 않음.
- DB mutation 테스트는 수행하지 않음. 운영 DB 변경 방지를 위해 read-only MCP 쿼리와 정적/빌드/테스트만 수행함.
- 로컬 HTTP 서버 기반 redirect 테스트는 환경 문제로 안정적인 응답을 확보하지 못함.
- Callstack RN local skill은 설치되어 있지 않아 Context7 공식 문서로 대체 확인함.

## 우선순위 권고

1. `admin-actions.ts`의 `fetchRows()`가 실제 `await response.json()`을 반환하도록 수정 필요.
2. 예약 상태 변경은 REST PATCH 대신 DB RPC(`admin_update_service_booking_status`, `admin_update_demo_booking_status`)를 호출하도록 통일 필요.
3. 모든 exported Server Action 시작부에 독립적인 `requireAdminPermission()`/`requireSuperAdmin()` 추가.
4. Server Action payload에 zod 등 런타임 validation/whitelist 적용.
5. preview/mobile loader에서 service role 직접 사용을 제거하거나 route/layout 단위 guard를 명시.
6. 장식 버튼은 구현하거나 disabled/숨김 처리.
7. 사용자 앱 fallback은 “DB 조회 실패 시 기능 활성화”가 아닌 보수적 비활성/오류 표시 방향으로 재검토.
