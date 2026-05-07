# DB Analysis

작성일: 2026-05-07  
조회 도구: Supabase MCP (`list_tables`, `list_migrations`, `execute_sql`)  
주요 분석 범위: `public` 스키마 테이블 21개, RLS, 인덱스, 주요 함수, 마이그레이션

## 1. Executive Summary

현재 데이터베이스는 Supabase가 관리하는 `auth`, `storage`, `realtime`, `cron`, `vault`, `supabase_migrations` 스키마와 애플리케이션용 `public` 스키마로 구성되어 있다.

애플리케이션이 직접 사용하는 스키마는 `public`이며, 현재 총 21개 테이블이 있다. 모든 `public` 테이블은 RLS가 활성화되어 있다.

도메인은 크게 다음 9개로 나눌 수 있다.

| Domain | Tables |
|---|---|
| 사용자/권한 | `profiles`, `admin_permissions`, `administrator_audit_logs` |
| 알림 | `notifications`, `notification_preferences` |
| 주소/배송 | `addresses` |
| 사용자 라켓/스트링 세팅 | `user_rackets`, `user_string_setups` |
| 스트링/상품 카탈로그 | `string_catalog`, `shop_products` |
| 데모 라켓/데모 예약 | `demo_rackets`, `demo_bookings`, `racket_condition_checks` |
| 스트링 서비스 예약 | `booking_slots`, `service_bookings`, `booking_status_logs`, `shop_schedule`, `closed_dates` |
| 앱 설정/콘텐츠 | `app_settings`, `app_content_blocks` |
| 쇼핑/주문 | `shop_orders` |

## 2. 이번 업데이트 반영 사항

이 문서는 2026-05-07 Supabase MCP 조회 결과를 기준으로 이전 문서 대비 추가/변경/삭제 사항을 반영했다.

### Added

- `shop_orders` 테이블이 추가되었다.
  - `id uuid` PK
  - `user_id uuid` FK -> `profiles.id`
  - `order_number text` unique
  - `status text` check: `pending`, `paid`, `preparing`, `shipping`, `delivered`, `cancelled`, `refunded`
  - `total_amount integer`, `items jsonb`, `created_at`, `updated_at`
- `string_catalog.shop_product_id` 컬럼이 추가되었다.
  - `text`, nullable
  - FK -> `shop_products.id`
  - 코멘트: 연결된 `shop_products` 항목 ID이며, `NULL`이면 실물 재고 추적 불가
- `get_store_info()` RPC가 추가되었다.
  - 반환: `json`
  - `SECURITY DEFINER`
  - `search_path=public`
- `ensure_booking_slots_for_date(...)` RPC가 현재 주요 애플리케이션 함수 목록에 포함되어 있다.
  - 특정 날짜와 서비스 타입 기준으로 예약 슬롯을 생성하는 보조 함수로 보인다.

### Changed

- `public` 테이블 수가 20개에서 21개로 증가했다.
- 주요 row count가 변경되었다.
  - `profiles`: 1 -> 4
  - `notification_preferences`: 1 -> 4
  - `user_rackets`: 1 -> 3
  - `app_settings`: 0 -> 2
  - `notifications`: 0 -> 7
  - `administrator_audit_logs`: 1 -> 12
  - `demo_rackets`: 2 -> 3
  - `user_string_setups`: 0 -> 1
  - `booking_slots`: 0 -> 54
  - `service_bookings`: 0 -> 7
  - `demo_bookings`: 0 -> 1
  - `booking_status_logs`: 0 -> 4
  - `shop_products`: 6 -> 10
- 최신 마이그레이션은 `20260506074659_add_get_store_info_rpc`까지 적용되어 있다.
- `string_catalog`가 `shop_products`와 연결되면서 스트링 카탈로그와 쇼핑 상품 재고/상품 정보의 연결 지점이 생겼다.

### Deleted / Removed

- Supabase MCP 기준으로 `public` 스키마에서 삭제된 테이블은 확인되지 않았다.
- 마이그레이션 이력상 `m031_remove_operational_content_blocks`가 존재하므로 일부 운영성 콘텐츠 블록 데이터는 정리된 것으로 보인다. 다만 `app_content_blocks` 테이블 자체는 유지되며 현재 4 rows가 있다.

## 3. Public Schema Overview

| Table | Rows | RLS | Primary Key | Purpose |
|---|---:|---|---|---|
| `profiles` | 4 | enabled | `id` | Supabase Auth 사용자 확장 프로필 |
| `notification_preferences` | 4 | enabled | `user_id` | 사용자별 알림 수신 설정 |
| `addresses` | 0 | enabled | `id` | 사용자 배송지 |
| `user_rackets` | 3 | enabled | `id` | 사용자 소유 라켓 |
| `admin_permissions` | 0 | enabled | `admin_id` | 관리자 세부 권한 |
| `app_settings` | 2 | enabled | `key` | 앱 전역 설정 |
| `notifications` | 7 | enabled | `id` | 사용자 알림 |
| `administrator_audit_logs` | 12 | enabled | `id` | 관리자 액션 감사 로그 |
| `string_catalog` | 4 | enabled | `id` | 스트링 상품/서비스 카탈로그 |
| `demo_rackets` | 3 | enabled | `id` | 데모 라켓 |
| `shop_schedule` | 7 | enabled | `day_of_week` | 요일별 영업시간 |
| `closed_dates` | 0 | enabled | `closed_date` | 특정 휴무일 |
| `user_string_setups` | 1 | enabled | `id` | 사용자 라켓별 스트링 세팅 |
| `booking_slots` | 54 | enabled | `id` | 예약 가능 시간 슬롯 |
| `service_bookings` | 7 | enabled | `id` | 스트링 작업 서비스 예약 |
| `demo_bookings` | 1 | enabled | `id` | 데모 라켓 예약 |
| `booking_status_logs` | 4 | enabled | `id` | 예약 상태 변경 이력 |
| `racket_condition_checks` | 0 | enabled | `id` | 데모 라켓 반출/반납 상태 점검 |
| `app_content_blocks` | 4 | enabled | `key` | 앱 화면 콘텐츠 블록 |
| `shop_products` | 10 | enabled | `id` | 쇼핑 상품 목록 |
| `shop_orders` | 0 | enabled | `id` | 쇼핑 주문 |

## 4. Relationship Summary

주요 관계는 `profiles`와 예약/상품 도메인을 중심으로 구성된다.

- `profiles.id`는 `auth.users.id`를 참조한다.
- 사용자 소유 데이터는 대부분 `profiles.id`를 FK로 가진다.
  - `addresses.user_id`
  - `user_rackets.owner_id`
  - `notification_preferences.user_id`
  - `notifications.user_id`
  - `user_string_setups.user_id`
  - `service_bookings.user_id`
  - `demo_bookings.user_id`
  - `shop_orders.user_id`
- 관리자/권한/감사 데이터도 `profiles.id`를 기준으로 한다.
  - `admin_permissions.admin_id`
  - `administrator_audit_logs.actor_id`
  - `app_settings.updated_by`
  - `closed_dates.created_by`
  - `booking_status_logs.changed_by`
  - `racket_condition_checks.checked_by`
- 예약 도메인은 `booking_slots`를 공통 슬롯 테이블로 사용한다.
  - `service_bookings.slot_id -> booking_slots.id`
  - `demo_bookings.slot_id -> booking_slots.id`
- 스트링 서비스는 `string_catalog`를 메인/크로스 스트링으로 참조한다.
  - `service_bookings.main_string_id`, `service_bookings.cross_string_id`
  - `user_string_setups.main_string_id`, `user_string_setups.cross_string_id`
- 스트링 카탈로그는 선택적으로 쇼핑 상품과 연결된다.
  - `string_catalog.shop_product_id -> shop_products.id`
- 데모 예약은 `demo_rackets`와 `racket_condition_checks`로 이어진다.
  - `demo_bookings.demo_racket_id -> demo_rackets.id`
  - `racket_condition_checks.demo_booking_id -> demo_bookings.id`
- 주문은 상품 스냅샷을 `shop_orders.items jsonb`에 담는 구조로 보인다.
  - 현재 `shop_orders.items` 내부 상품 항목에는 DB FK가 없다.

## 5. Public Table Details

`Required`는 MCP의 nullable 정보와 PK/FK/제약을 기준으로 해석했다.

### 5.1 `profiles`

Supabase Auth 사용자와 1:1 관계인 프로필 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, FK -> `auth.users.id` |
| `username` | `text` | yes | unique |
| `nickname` | `text` | yes |  |
| `phone` | `text` | no | unique |
| `role` | `text` | yes | default `'user'`; check `super_admin`, `admin`, `user` |
| `status` | `text` | yes | default `'active'`; check `active`, `suspended`, `deleted_pending`, `deleted` |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |
| `expo_push_token` | `text` | no |  |
| `email` | `text` | no | partial unique index when not null |

Notes:

- `role`과 `status`는 text + check constraint 구조다.
- `profiles`에는 민감 필드 직접 수정을 막는 BEFORE UPDATE trigger가 있다.

### 5.2 `notification_preferences`

사용자별 알림 설정.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `user_id` | `uuid` | yes | PK, FK -> `profiles.id` |
| `booking_notifications` | `boolean` | no | default `true` |
| `delivery_notifications` | `boolean` | no | default `true` |
| `string_life_notifications` | `boolean` | no | default `true` |
| `marketing_notifications` | `boolean` | no | default `false` |
| `quiet_hours_enabled` | `boolean` | no | default `false` |
| `quiet_hours_start` | `time` | no |  |
| `quiet_hours_end` | `time` | no |  |

### 5.3 `addresses`

배송지 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | yes | FK -> `profiles.id` |
| `recipient_name` | `text` | yes |  |
| `phone` | `text` | yes |  |
| `postal_code` | `text` | no |  |
| `address_line1` | `text` | yes |  |
| `address_line2` | `text` | no |  |
| `is_default` | `boolean` | no | default `false` |
| `created_at` | `timestamptz` | no | default `now()` |

Notes:

- `addresses_one_default_per_user_idx`로 사용자당 기본 배송지 1개를 제한한다.
- `service_bookings.address_id`에서 참조된다.

### 5.4 `user_rackets`

사용자 소유 라켓 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `owner_id` | `uuid` | yes | FK -> `profiles.id` |
| `brand` | `text` | yes |  |
| `model` | `text` | yes |  |
| `grip_size` | `text` | no |  |
| `weight` | `integer` | no |  |
| `balance` | `text` | no |  |
| `photo_url` | `text` | no |  |
| `is_primary` | `boolean` | no | default `false` |
| `memo` | `text` | no |  |
| `created_at` | `timestamptz` | no | default `now()` |

Notes:

- `user_rackets_one_primary_per_owner_idx`로 사용자당 대표 라켓 1개를 제한한다.

### 5.5 `admin_permissions`

관리자별 세부 권한 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `admin_id` | `uuid` | yes | PK, FK -> `profiles.id` |
| `can_manage_strings` | `boolean` | no | default `false` |
| `can_manage_demo_rackets` | `boolean` | no | default `false` |
| `can_manage_bookings` | `boolean` | no | default `false` |
| `can_ban_users` | `boolean` | no | default `false` |
| `can_manage_products` | `boolean` | no | default `false` |
| `can_manage_orders` | `boolean` | no | default `false` |
| `can_post_notice` | `boolean` | no | default `false` |
| `can_toggle_app_menu` | `boolean` | no | default `false` |
| `can_manage_admins` | `boolean` | no | default `false` |

### 5.6 `app_settings`

앱 전역 설정 key-value 저장소.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `key` | `text` | yes | PK |
| `value` | `jsonb` | yes | default `{}` |
| `updated_by` | `uuid` | no | FK -> `profiles.id` |
| `updated_at` | `timestamptz` | no | default `now()` |

Notes:

- `value`의 내부 JSON schema는 DB에서 강제되지 않는다.

### 5.7 `notifications`

사용자 알림 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | yes | FK -> `profiles.id` |
| `title` | `text` | yes |  |
| `body` | `text` | yes |  |
| `notification_type` | `text` | no |  |
| `data` | `jsonb` | no |  |
| `read` | `boolean` | no | default `false` |
| `sent_at` | `timestamptz` | no |  |
| `created_at` | `timestamptz` | no | default `now()` |

### 5.8 `administrator_audit_logs`

관리자 액션 감사 로그.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `actor_id` | `uuid` | no | FK -> `profiles.id` |
| `action` | `text` | yes |  |
| `target_table` | `text` | no |  |
| `target_id` | `uuid` | no |  |
| `before_value` | `jsonb` | no |  |
| `after_value` | `jsonb` | no |  |
| `ip_address` | `text` | no |  |
| `user_agent` | `text` | no |  |
| `created_at` | `timestamptz` | no | default `now()` |

### 5.9 `string_catalog`

스트링 카탈로그. 현재 쇼핑 상품과 선택적으로 연결된다.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `brand` | `text` | yes |  |
| `name` | `text` | yes |  |
| `gauge` | `text` | no |  |
| `color` | `text` | no |  |
| `image_url` | `text` | no |  |
| `description` | `text` | no |  |
| `price` | `integer` | no | check `price is null or price >= 0` |
| `recommended_style` | `text` | no |  |
| `is_active` | `boolean` | no | default `true` |
| `deactivation_reason` | `text` | no |  |
| `deactivated_at` | `timestamptz` | no |  |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |
| `shop_product_id` | `text` | no | FK -> `shop_products.id` |

Notes:

- `shop_product_id`는 이번 DB 확인에서 추가 확인된 컬럼이다.
- `brand + name`은 일반 인덱스만 있고 unique는 아니다.

### 5.10 `demo_rackets`

데모 라켓 카탈로그.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `brand` | `text` | yes |  |
| `model` | `text` | yes |  |
| `grip_size` | `text` | no |  |
| `weight` | `integer` | no |  |
| `head_size` | `text` | no |  |
| `photo_url` | `text` | no |  |
| `description` | `text` | no |  |
| `status` | `text` | no | default `active`; check `active`, `inactive`, `maintenance`, `damaged`, `sold`, `hidden` |
| `is_demo_enabled` | `boolean` | no | default `true` |
| `is_active` | `boolean` | no | default `true` |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

### 5.11 `shop_schedule`

요일별 매장 영업시간.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `day_of_week` | `smallint` | yes | PK; check `0 <= day_of_week <= 6` |
| `open_time` | `time` | yes |  |
| `close_time` | `time` | yes |  |
| `is_closed` | `boolean` | yes | default `false` |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

### 5.12 `closed_dates`

특정 날짜 휴무 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `closed_date` | `date` | yes | PK |
| `reason` | `text` | no |  |
| `created_by` | `uuid` | no | FK -> `profiles.id` |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

### 5.13 `user_string_setups`

사용자 라켓별 스트링 세팅 저장 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | yes | FK -> `profiles.id` |
| `racket_id` | `uuid` | yes | FK -> `user_rackets.id` |
| `main_string_id` | `uuid` | yes | FK -> `string_catalog.id` |
| `cross_string_id` | `uuid` | yes | FK -> `string_catalog.id` |
| `tension_main` | `integer` | yes | check `20 <= tension_main <= 70` |
| `tension_cross` | `integer` | yes | check `20 <= tension_cross <= 70` |
| `is_hybrid` | `boolean` | yes | default `false` |
| `memo` | `text` | no |  |
| `last_strung_at` | `timestamptz` | no |  |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

### 5.14 `booking_slots`

예약 슬롯 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `service_type` | `text` | yes | check `stringing`, `demo` |
| `start_time` | `timestamptz` | yes | unique with `service_type` |
| `end_time` | `timestamptz` | yes |  |
| `capacity` | `integer` | yes | default `1` |
| `reserved_count` | `integer` | yes | default `0`; check `reserved_count >= 0` |
| `is_blocked` | `boolean` | yes | default `false` |
| `block_reason` | `text` | no |  |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

Notes:

- `(service_type, start_time)` unique 제약이 있다.
- `reserved_count <= capacity` 제약은 확인되지 않았다.
- `ensure_booking_slots_for_date()` RPC가 슬롯 생성을 담당하는 것으로 보인다.

### 5.15 `service_bookings`

스트링 작업 서비스 예약 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | yes | FK -> `profiles.id` |
| `racket_id` | `uuid` | yes | FK -> `user_rackets.id` |
| `main_string_id` | `uuid` | yes | FK -> `string_catalog.id` |
| `cross_string_id` | `uuid` | yes | FK -> `string_catalog.id` |
| `tension_main` | `integer` | yes | check `20 <= tension_main <= 70` |
| `tension_cross` | `integer` | yes | check `20 <= tension_cross <= 70` |
| `slot_id` | `uuid` | yes | FK -> `booking_slots.id` |
| `delivery_method` | `text` | yes | check `store_pickup`, `local_quick`, `parcel` |
| `address_id` | `uuid` | no | FK -> `addresses.id` |
| `status` | `text` | yes | default `requested`; status check list |
| `user_notes` | `text` | no |  |
| `admin_notes` | `text` | no |  |
| `no_show_counted` | `boolean` | yes | default `false` |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

Allowed `status`:

`requested`, `approved`, `visit_pending`, `racket_received`, `in_progress`, `completed`, `pickup_ready`, `delivered`, `done`, `cancelled_user`, `cancelled_admin`, `rejected`, `reschedule_requested`, `no_show`, `refund_pending`, `refund_done`.

### 5.16 `demo_bookings`

데모 라켓 예약 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | yes | FK -> `profiles.id` |
| `demo_racket_id` | `uuid` | yes | FK -> `demo_rackets.id` |
| `slot_id` | `uuid` | yes | FK -> `booking_slots.id` |
| `start_time` | `timestamptz` | yes |  |
| `expected_return_time` | `timestamptz` | yes |  |
| `actual_return_time` | `timestamptz` | no |  |
| `status` | `text` | yes | default `requested`; status check list |
| `user_notes` | `text` | no |  |
| `admin_notes` | `text` | no |  |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

Allowed `status`:

`requested`, `approved`, `in_use`, `returned`, `cancelled_user`, `cancelled_admin`, `rejected`, `no_show`, `overdue`.

Notes:

- `demo_bookings_no_active_overlap`는 GiST 인덱스이며 exclusion constraint는 아니다.
- 같은 라켓의 활성 기간 겹침을 실제로 차단하려면 현재 구조에서 RPC 검증이 중요하다.

### 5.17 `booking_status_logs`

예약 상태 변경 이력.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `booking_type` | `text` | yes | check `service`, `demo` |
| `booking_id` | `uuid` | yes | polymorphic booking id |
| `previous_status` | `text` | no |  |
| `new_status` | `text` | yes |  |
| `changed_by` | `uuid` | no | FK -> `profiles.id` |
| `reason` | `text` | no |  |
| `changed_at` | `timestamptz` | no | default `now()` |

Notes:

- `booking_id`는 `booking_type`에 따라 `service_bookings` 또는 `demo_bookings`를 가리키는 다형 참조다.
- DB FK로 직접 강제되지 않으므로 상태 변경 RPC의 일관성이 중요하다.

### 5.18 `racket_condition_checks`

데모 라켓 상태 점검 기록.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `demo_booking_id` | `uuid` | yes | FK -> `demo_bookings.id` |
| `check_type` | `text` | yes | check `before_rental`, `after_return` |
| `photo_urls` | `text[]` | yes | default `{}` |
| `scratch_notes` | `text` | no |  |
| `string_condition` | `text` | no |  |
| `grip_condition` | `text` | no |  |
| `damage_detected` | `boolean` | yes | default `false` |
| `deposit_deduction` | `integer` | yes | default `0`; check `deposit_deduction >= 0` |
| `checked_by` | `uuid` | yes | FK -> `profiles.id` |
| `checked_at` | `timestamptz` | no | default `now()` |

### 5.19 `app_content_blocks`

앱 콘텐츠 블록 저장소.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `key` | `text` | yes | PK |
| `payload` | `jsonb` | yes |  |
| `description` | `text` | no |  |
| `is_active` | `boolean` | yes | default `true` |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

Notes:

- public read policy는 `is_active = true`만 허용한다.
- payload schema는 DB에서 강제되지 않는다.

### 5.20 `shop_products`

쇼핑 상품 목록.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `text` | yes | PK |
| `name` | `text` | yes |  |
| `category` | `text` | yes |  |
| `image_path` | `text` | no |  |
| `image_url` | `text` | no |  |
| `price` | `integer` | yes | check `price >= 0` |
| `sale_price` | `integer` | yes | check `sale_price >= 0` |
| `rating_average` | `numeric` | yes | default `0`; check `0 <= rating_average <= 5` |
| `review_count` | `integer` | yes | default `0`; check `review_count >= 0` |
| `tag` | `text` | no |  |
| `tone` | `text` | yes | default `card`; check `primary`, `accent`, `secondary`, `card` |
| `stock_quantity` | `integer` | yes | default `0`; check `stock_quantity >= 0` |
| `sort_order` | `integer` | yes | default `0` |
| `is_active` | `boolean` | yes | default `true` |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

Notes:

- `id`는 UUID가 아닌 text다.
- `sale_price <= price` 제약은 확인되지 않았다.
- `string_catalog.shop_product_id`에서 참조된다.

### 5.21 `shop_orders`

쇼핑 주문 테이블.

| Column | Type | Required | Default / Constraint |
|---|---|---:|---|
| `id` | `uuid` | yes | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | yes | FK -> `profiles.id` |
| `order_number` | `text` | yes | unique |
| `status` | `text` | yes | default `paid`; check status list |
| `total_amount` | `integer` | yes | default `0`; check `total_amount >= 0` |
| `items` | `jsonb` | yes | default `[]` |
| `created_at` | `timestamptz` | no | default `now()` |
| `updated_at` | `timestamptz` | no | default `now()` |

Allowed `status`:

`pending`, `paid`, `preparing`, `shipping`, `delivered`, `cancelled`, `refunded`.

Notes:

- 신규 테이블이며 현재 row count는 0이다.
- 주문 상세는 `items jsonb`에 저장된다. 상품 FK나 item schema는 DB에서 직접 강제되지 않는다.
- RLS는 본인 주문 조회와 관리자 조회/관리를 허용한다.

## 6. Indexes

주요 인덱스 요약:

| Table | Indexes |
|---|---|
| `addresses` | PK `id`, `user_id`, partial unique default address per user |
| `administrator_audit_logs` | PK `id`, `(actor_id, created_at desc)`, `(target_table, target_id)` |
| `booking_slots` | PK `id`, unique `(service_type, start_time)`, `(service_type, start_time)`, `(service_type, is_blocked, start_time)` |
| `booking_status_logs` | PK `id`, `(booking_type, booking_id, changed_at desc)`, `(changed_by, changed_at desc)` |
| `closed_dates` | PK `closed_date`, `closed_date` |
| `demo_bookings` | PK `id`, active overlap GiST index, `(demo_racket_id, start_time, expected_return_time)`, `slot_id`, `(user_id, created_at desc)` |
| `demo_rackets` | PK `id`, `(status, is_demo_enabled, is_active)` |
| `notifications` | PK `id`, `(user_id, created_at desc)` |
| `profiles` | PK `id`, unique `username`, unique `phone`, partial unique `email is not null` |
| `racket_condition_checks` | PK `id`, `(demo_booking_id, checked_at)`, `(checked_by, checked_at desc)` |
| `service_bookings` | PK `id`, `slot_id`, `status`, `(user_id, created_at desc)` |
| `shop_orders` | PK `id`, unique `order_number`, `(user_id, created_at desc)` |
| `shop_products` | PK `id`, `(is_active, sort_order, created_at)`, `category` |
| `string_catalog` | PK `id`, `is_active`, `(is_active, gauge)`, `(is_active, recommended_style)`, `(brand, name)` |
| `user_rackets` | PK `id`, `owner_id`, partial unique primary racket per owner |
| `user_string_setups` | PK `id`, `user_id`, `racket_id`, `main_string_id`, `cross_string_id` |

Observations:

- `closed_dates_date_idx`는 PK와 같은 컬럼이라 중복 가능성이 있다.
- `booking_slots_service_time_idx`는 unique `(service_type, start_time)`와 컬럼 구성이 같아 중복 가능성이 있다.
- `demo_bookings_no_active_overlap`는 이름상 overlap 방지처럼 보이지만 실제로는 GiST 인덱스다. exclusion constraint가 아니므로 DB 차원의 겹침 차단 보장은 별도 확인이 필요하다.

## 7. RLS Policies

모든 `public` 테이블은 RLS enabled 상태다.

정책 구조 요약:

| Pattern | Tables |
|---|---|
| 본인 소유 row 전체 접근 | `addresses`, `notification_preferences`, `notifications`, `user_rackets`, `user_string_setups` |
| 본인 조회 + 관리자 조회/관리 | `profiles`, `service_bookings`, `demo_bookings`, `booking_status_logs`, `racket_condition_checks`, `shop_orders` |
| 인증 사용자 읽기 + 관리자 쓰기 | `booking_slots`, `closed_dates`, `shop_schedule`, `app_settings` |
| public active read + 관리자 쓰기 | `app_content_blocks`, `shop_products` |
| 권한 함수 기반 관리자 관리 | `admin_permissions`, `administrator_audit_logs`, `string_catalog`, `demo_rackets` |

주요 권한 함수:

- `has_admin_role(uuid)`
- `has_super_admin_role(uuid)`
- `has_booking_manager_role(uuid)`
- `has_string_manager_role(uuid)`
- `has_demo_racket_manager_role(uuid)`
- `can_manage_bookings(uuid)`

Security observations:

- 주요 RPC와 권한 함수 대부분은 `SECURITY DEFINER`이며 `search_path=public`이 설정되어 있다.
- `prevent_super_admin_account_deletion()`은 `SECURITY INVOKER`이고 `search_path` config가 없다.
- 관리자 권한은 `profiles.role`과 `admin_permissions`의 granular permission을 함께 사용한다.

## 8. Application RPC / Functions

확인된 주요 애플리케이션 함수:

| Function | Purpose inferred | Security |
|---|---|---|
| `handle_new_user()` | 신규 auth user 생성 후 profile 생성 trigger | SECURITY DEFINER |
| `update_profile_push_token(p_user_id, p_expo_push_token)` | Expo push token 갱신 | SECURITY DEFINER |
| `request_profile_account_deletion(p_user_id)` | 계정 삭제 요청 | SECURITY DEFINER |
| `cleanup_deleted_accounts()` | 삭제 예정 계정 정리 | SECURITY DEFINER |
| `admin_set_profile_role(p_actor_id, p_target_id, p_role)` | 관리자 role 변경 | SECURITY DEFINER |
| `admin_set_profile_status(p_actor_id, p_target_id, p_status)` | 사용자 상태 변경 | SECURITY DEFINER |
| `admin_suspend_user_transaction(p_actor_id, p_target_id, p_reason)` | 사용자 정지 트랜잭션 | SECURITY DEFINER |
| `create_service_booking_transaction(...)` | 스트링 서비스 예약 생성 | SECURITY DEFINER |
| `create_demo_booking_transaction(...)` | 데모 예약 생성 | SECURITY DEFINER |
| `admin_update_service_booking_status(...)` | 서비스 예약 상태 변경 | SECURITY DEFINER |
| `admin_update_demo_booking_status(...)` | 데모 예약 상태 변경 | SECURITY DEFINER |
| `record_service_booking_no_show(p_booking_id, p_admin_id)` | 노쇼 기록 | SECURITY DEFINER |
| `user_cancel_service_booking(p_booking_id, p_user_id)` | 사용자 서비스 예약 취소 | SECURITY DEFINER |
| `ensure_booking_slots_for_date(p_date, p_service_type, p_duration_min, p_capacity)` | 날짜별 예약 슬롯 생성 | SECURITY DEFINER |
| `get_store_info()` | 매장 정보 JSON 반환 | SECURITY DEFINER |
| `prevent_direct_profile_sensitive_update()` | 민감 profile 필드 직접 수정 방지 trigger | SECURITY DEFINER |
| `allow_profile_sensitive_update()` | 민감 update 허용 context 함수 | SECURITY DEFINER |
| `prevent_super_admin_account_deletion()` | super admin 계정 삭제 방지 trigger | SECURITY INVOKER |

Note:

- `btree_gist` 등 extension에서 생성된 `gbt_*`, `*_dist` 함수들이 `public`에 다수 존재한다. 애플리케이션 함수와 extension 함수를 구분해서 관리하는 것이 좋다.

## 9. Triggers

`public` 스키마에서 확인된 trigger:

| Table | Trigger | Timing | Event | Function |
|---|---|---|---|---|
| `profiles` | `prevent_direct_profile_sensitive_update_trigger` | BEFORE | UPDATE | `prevent_direct_profile_sensitive_update()` |
| `profiles` | `prevent_super_admin_account_deletion_trigger` | BEFORE | UPDATE | `prevent_super_admin_account_deletion()` |

## 10. Migration Snapshot

적용된 주요 마이그레이션 흐름:

- `m001_create_profiles`부터 `m018_rls_security_hardening`까지 기본 사용자/예약/RLS 구조 생성 및 강화
- `m019`부터 `m026`까지 profile 민감 정보 보호, RPC 실행 권한, 계정 삭제 cleanup, cron 정리
- `email_oauth_auth_profiles`, `harden_signup_trigger_search_path`로 auth/profile 연동 강화
- `m029_app_content_blocks`와 app assets 관련 policy/storage/image path 마이그레이션
- `shop_products_and_content_cleanup`으로 상품 및 콘텐츠 정리
- `ensure_booking_slots_for_date`로 예약 슬롯 생성 RPC 추가
- `shop_orders`로 쇼핑 주문 테이블 추가
- `service_booking_work_status_options`로 서비스 예약 상태 옵션 확장
- `link_string_catalog_to_shop_products`로 `string_catalog.shop_product_id` 추가 및 `shop_products` 연결
- `add_get_store_info_rpc`로 매장 정보 조회 RPC 추가

Latest migration:

`20260506074659_add_get_store_info_rpc`

## 11. Managed Schemas

아래 스키마들은 Supabase 또는 extension이 관리하는 영역이다. 앱 마이그레이션에서 직접 변경하지 않는 것이 원칙이다.

### `auth`

Supabase Auth 내부 테이블이 위치한다.

중요 관계:

- `public.profiles.id -> auth.users.id`

### `storage`

Supabase Storage 내부 테이블이 위치한다.

대표 테이블:

- `buckets`
- `objects`
- `migrations`
- multipart upload 관련 테이블

### `realtime`

Supabase Realtime 내부 테이블이 위치한다.

대표 테이블:

- `messages`
- `schema_migrations`
- `subscription`

### `cron`

`pg_cron` 내부 테이블이 위치한다.

대표 테이블:

- `job`
- `job_run_details`

### `vault`

Supabase Vault 내부 테이블/뷰가 위치한다.

주의:

- `vault.decrypted_secrets`는 복호화된 secret을 노출할 수 있는 뷰이므로 실제 row 데이터는 문서나 로그에 출력하지 않는 것이 안전하다.

### `supabase_migrations`

Supabase migration history가 저장된다.

대표 테이블:

- `schema_migrations`

## 12. Design Strengths

- 모든 `public` 테이블에 RLS가 활성화되어 있다.
- 사용자 소유 데이터는 대부분 `auth.uid()` 기반 정책으로 격리된다.
- 예약 생성/취소/상태 변경 같은 중요한 작업은 RPC 트랜잭션 함수 중심으로 설계되어 있다.
- 관리자 액션 감사 로그 구조가 존재하며, 변경 전후 값을 JSON으로 저장할 수 있다.
- 예약, 알림, 목록 조회에 필요한 기본 인덱스가 대부분 구성되어 있다.
- 사용자당 기본 주소/대표 라켓 같은 partial unique index가 잘 잡혀 있다.
- `string_catalog`와 `shop_products` 연결이 추가되어 스트링 서비스와 쇼핑 재고/상품 데이터를 연결할 수 있는 기반이 생겼다.

## 13. Risks / Improvement Points

1. text status/check 값과 TypeScript 타입 동기화 필요

`profiles.role`, `profiles.status`, `service_bookings.status`, `demo_bookings.status`, `demo_rackets.status`, `shop_orders.status`, `shop_products.tone` 등은 text + check constraint 구조다. 앱 타입과 DB check 값이 어긋나면 런타임 오류가 날 수 있다.

2. 예약 상태 전이 규칙은 DB check만으로 부족

DB는 허용 가능한 상태 값만 제한한다. `requested -> approved -> in_progress` 같은 전이 순서는 RPC 또는 앱 레이어에서 보장해야 한다.

3. 다형 참조와 JSONB 구조는 FK/스키마 보장이 약함

`booking_status_logs.booking_id`는 다형 참조이며, `shop_orders.items`, `app_settings.value`, `app_content_blocks.payload`, `notifications.data`는 JSONB다. DB에서 내부 구조를 강제하지 않으므로 validator 또는 문서화가 필요하다.

4. 일부 비즈니스 제약이 DB에 없다

확인되지 않은 제약:

- `booking_slots.reserved_count <= capacity`
- `shop_products.sale_price <= price`
- `user_string_setups.is_hybrid = false`일 때 main/cross string 일치 여부
- `racket_condition_checks`의 `(demo_booking_id, check_type)` 중복 방지
- 배송 방식별 `service_bookings.address_id` required 여부
- `shop_orders.items` 항목별 상품 id, 수량, 가격 schema

5. 중복 가능 인덱스 정리 검토

`closed_dates_date_idx`는 PK와 동일 컬럼이고, `booking_slots_service_time_idx`는 unique `(service_type, start_time)`와 동일 컬럼 구성이므로 실제 사용량을 보고 정리할 수 있다.

6. 데모 예약 overlap 차단 보장 방식 확인 필요

`demo_bookings_no_active_overlap`는 GiST 인덱스이지 exclusion constraint가 아니다. 실제 중복 예약 방지는 `create_demo_booking_transaction` 함수에서 검증되는지 확인해야 한다.

7. `prevent_super_admin_account_deletion()` 보안 설정 검토

대부분의 보안 함수는 `SECURITY DEFINER` + `search_path=public`인데, 이 함수는 `SECURITY INVOKER`이며 별도 config가 없다. 의도된 설정인지 확인하는 것이 좋다.

## 14. Recommended Next Checks

- 코드의 TypeScript 타입과 DB check constraint 값 비교
- 예약 생성/취소/상태 변경이 모두 RPC 경유인지 확인
- `create_demo_booking_transaction`에서 데모 라켓 시간 겹침을 실제로 막는지 확인
- `SECURITY DEFINER` 함수의 권한 검증과 audit log 기록 여부 점검
- `shop_orders.items`, `app_settings.value`, `app_content_blocks.payload`의 JSON schema 문서화
- `pg_stat_user_indexes` 기준으로 중복 가능 인덱스 사용량 확인
- 필요한 비즈니스 제약을 migration으로 추가할지 검토
