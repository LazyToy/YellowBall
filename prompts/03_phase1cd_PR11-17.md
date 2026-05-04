# Phase 1C/1D 프롬프트 (PR-11 ~ PR-17)

> ⚠️ 각 프롬프트 앞에 `00_common.md`의 공통 블록을 붙여서 전달하세요.

---

## PR-11 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-11: 내 라켓 라이브러리를 구현해줘.
현재: PR-06 완료

[구현 단계]
1. supabase/migrations/004_user_rackets.sql:
   CREATE TABLE user_rackets (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     brand TEXT NOT NULL, model TEXT NOT NULL,
     grip_size TEXT, weight INT, balance TEXT,
     photo_url TEXT, is_primary BOOLEAN DEFAULT false,
     memo TEXT, created_at TIMESTAMPTZ DEFAULT now()
   );
   ALTER TABLE user_rackets ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "rackets_own" ON user_rackets FOR ALL USING (auth.uid() = owner_id);

2. Supabase Storage: racket-photos 버킷 생성
   src/services/storageService.ts: uploadRacketPhoto, deleteRacketPhoto

3. src/services/racketService.ts:
   - getRackets(userId), getRacket(id), addRacket(data) — 첫 라켓 자동 primary
   - updateRacket(id, data), deleteRacket(id) — primary 삭제 시 이전
   - setPrimaryRacket(id) — 기존 primary 해제 후 설정

4. 라켓 목록(카드형), 등록 폼(브랜드/모델/그립/무게/밸런스/사진/메모), 상세+수정+삭제
   디자인 레퍼런스: YellowBall_v0.1/components/app/my-rackets.tsx + YellowBall_v0.1/app/(mobile)/me/rackets/ 참조
5. TDD: CRUD + setPrimary + 사진 업로드 모킹

[완료 조건]
- CRUD 동작, 메인 라켓 설정, 사진 업로드, RLS 본인만, 첫 라켓 자동 메인
```

## PR-11 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-11: 내 라켓 라이브러리

[정적] □ RLS owner_id □ ON DELETE CASCADE □ Storage 버킷 정책 □ setPrimary 기존 해제 로직
[동적] □ CRUD 테스트 □ 메인 변경 □ 사진 업로드 모킹 □ 첫 라켓 자동 메인 □ 전체 회귀
[보안] □ 타인 라켓 접근 불가
```

---

## PR-12 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-12: 스트링/텐션 조합 저장을 구현해줘.
현재: PR-11(라켓), PR-13(스트링 카탈로그) 완료

[구현 단계]
1. supabase/migrations: user_string_setups 테이블
   CREATE TABLE user_string_setups (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     racket_id UUID REFERENCES user_rackets(id) ON DELETE CASCADE,
     main_string_id UUID REFERENCES string_catalog(id),
     cross_string_id UUID REFERENCES string_catalog(id),
     tension_main INT CHECK (tension_main BETWEEN 20 AND 70),
     tension_cross INT CHECK (tension_cross BETWEEN 20 AND 70),
     is_hybrid BOOLEAN DEFAULT false,
     memo TEXT, last_strung_at TIMESTAMPTZ
   );
   ALTER TABLE user_string_setups ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "setups_own" ON user_string_setups FOR ALL USING (auth.uid() = user_id);

2. src/services/stringSetupService.ts: getSetups, getSetupsByRacket, addSetup, updateSetup, deleteSetup

3. 라켓 상세 하단 "스트링 세팅" 섹션:
   - 하이브리드 토글 (OFF시 cross = main 자동)
   - 카탈로그에서 스트링 선택
   - 텐션 입력 (메인/크로스)
   디자인 레퍼런스: YellowBall_v0.1/components/ui/switch.tsx, select.tsx, input.tsx 참조

4. TDD: CRUD, 텐션 범위, 하이브리드 로직

[완료 조건]
- CRUD 동작, 텐션 20~70 제한, 하이브리드 ON/OFF, CASCADE 삭제
```

## PR-12 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-12: 스트링/텐션 조합 저장 / 선행: PR-11, PR-13

[정적] □ tension CHECK 20~70 □ ON DELETE CASCADE □ is_hybrid false시 cross=main 로직
[동적] □ CRUD □ 텐션 초과 에러 □ 하이브리드 토글 □ 라켓 삭제시 연쇄 삭제 □ 전체 회귀
```

---

## PR-13 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-13: 스트링 카탈로그 조회(사용자)를 구현해줘.
현재: PR-17(관리자 CRUD) 완료, string_catalog 테이블에 데이터 존재

[구현 단계]
1. RLS 추가: CREATE POLICY "string_read_active" ON string_catalog FOR SELECT USING (is_active = true);

2. src/services/stringCatalogService.ts (사용자용):
   - getActiveStrings(): active만 조회
   - getStringById(id)
   - searchStrings(query): 브랜드/이름 검색
   - filterStrings(filters): 게이지/브랜드/스타일 필터

3. 카탈로그 화면:
   - 목록 (카드: 이미지/브랜드/이름/게이지/가격)
   - 검색바, 필터 (게이지/브랜드/스타일)
   - 상세 화면
   디자인 레퍼런스: YellowBall_v0.1/components/app/featured-strings.tsx + YellowBall_v0.1/app/(mobile)/booking/string/ 참조

4. TDD: 조회/검색/필터, 비활성 미노출, 빈 결과 처리

[완료 조건]
- 활성만 표시, 검색 동작, 필터 동작, 비활성 RLS 차단
```

## PR-13 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-13: 스트링 카탈로그 조회

[정적] □ RLS is_active=true 조건 □ 비활성 스트링 SELECT 불가
[동적] □ 조회 □ 검색 □ 필터 □ 빈 결과 UI □ 비활성 접근 거부 □ 전체 회귀
```

---

## PR-14 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-14: 권한 체계 + Super Admin을 구현해줘.
현재: PR-06 완료

[구현 단계]
1. supabase/migrations/005_admin_permissions.sql:
   CREATE TABLE admin_permissions (
     admin_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
     can_manage_strings BOOLEAN DEFAULT false,
     can_manage_demo_rackets BOOLEAN DEFAULT false,
     can_manage_bookings BOOLEAN DEFAULT false,
     can_ban_users BOOLEAN DEFAULT false,
     can_manage_products BOOLEAN DEFAULT false,
     can_manage_orders BOOLEAN DEFAULT false,
     can_post_notice BOOLEAN DEFAULT false,
     can_toggle_app_menu BOOLEAN DEFAULT false,
     can_manage_admins BOOLEAN DEFAULT false
   );
   ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
   -- Super Admin만 R/W, 본인 읽기
   CREATE POLICY "admin_perm_super" ON admin_permissions FOR ALL
     USING (EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='super_admin'));
   CREATE POLICY "admin_perm_own_read" ON admin_permissions FOR SELECT
     USING (auth.uid() = admin_id);

2. app_settings 테이블: key TEXT PK, value JSONB, updated_by, updated_at
   RLS: 전체 읽기, Super Admin만 쓰기

3. Super Admin: DB 시드/Dashboard 수동 생성 (코드에서 생성 불가)

4. src/hooks/usePermission.ts: usePermission(key) — super_admin은 모든 권한 true

5. app/(admin)/_layout.tsx: role 체크 + 하위 화면 세부 권한 체크

6. src/services/adminService.ts: getAdminPermissions, isAdmin, isSuperAdmin

7. TDD: usePermission, 비관리자 차단, super_admin 전체 권한

[완료 조건]
- 3단계 역할(user/admin/super_admin) 분기
- Super Admin 전체 권한
- 비관리자 admin 접근 차단
- admin_permissions/app_settings RLS
```

## PR-14 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-14: 권한 체계 + Super Admin

[정적] □ RLS super_admin 조건 □ role CHECK □ usePermission super_admin→전체 true
       □ admin_permissions 9개 필드 □ app_settings 전체 읽기+super_admin 쓰기
[동적] □ 역할 분기 테스트 □ 비관리자 차단 □ usePermission 훅 테스트 □ RLS 테스트
[보안] □ 일반 사용자 admin_permissions 수정 불가 □ 관리자 자기 권한 변경 불가
□ 전체 회귀 통과
```

---

## PR-15 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-15: 관리자 임명/해임 + 권한 토글을 구현해줘.
현재: PR-14 완료

[구현 단계]
1. src/services/adminService.ts 추가:
   - appointAdmin(userId): role→admin, admin_permissions 초기 레코드 생성(전부 false)
   - dismissAdmin(adminId): role→user, admin_permissions 삭제
   - updatePermissions(adminId, permissions): 9개 권한 개별 토글
   - 모든 작업 super_admin만 가능 (서비스 레이어 체크)

2. app/(admin)/manage-admins.tsx:
   - 관리자 목록 (닉네임, 권한 요약)
   - 사용자 검색 → 임명 버튼
   - 9개 권한 토글 스위치
   - 해임 버튼 + 확인 다이얼로그

3. 자기 자신 해임 방지
4. audit_logs 연동 (PR-16 완료 후, 미완료 시 TODO 주석)

[완료 조건]
- Super Admin만 임명/해임/권한변경 가능
- 9개 토글 동작
- 해임 시 permissions 삭제
- 자기 권한 변경 불가
```

## PR-15 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-15: 관리자 임명/해임 + 권한 토글

[정적] □ super_admin 체크 로직 □ 자기 해임 방지 □ 해임시 permissions DELETE
[동적] □ 임명 □ 해임 □ 9개 권한 토글 □ 비권한자(admin) 시도 에러 □ 전체 회귀
```

---

## PR-16 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-16: 관리자 행동 로그를 구현해줘.
현재: PR-14 완료

[구현 단계]
1. supabase/migrations: administrator_audit_logs
   CREATE TABLE administrator_audit_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     actor_id UUID REFERENCES profiles(id),
     action TEXT NOT NULL,
     target_table TEXT, target_id UUID,
     before_value JSONB, after_value JSONB,
     ip_address TEXT, user_agent TEXT,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ALTER TABLE administrator_audit_logs ENABLE ROW LEVEL SECURITY;
   -- Super Admin만 읽기, admin/super_admin INSERT
   CREATE POLICY "audit_read" ON administrator_audit_logs FOR SELECT
     USING (EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='super_admin'));
   CREATE POLICY "audit_insert" ON administrator_audit_logs FOR INSERT
     WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role IN ('admin','super_admin')));

2. src/services/auditService.ts: logAction(actor, action, target, before, after), getAuditLogs(filters)

3. withAudit(action, targetTable, fn) HOF 래퍼: 함수 실행 전후 자동 로그

4. 기록 대상: 사용자 제재, 권한 변경, 예약 강제 취소, 상품/스트링 비활성화, 시타 라켓 상태, 계정 삭제

[완료 조건]
- 로그 INSERT 성공, Super Admin만 조회, before/after JSONB, withAudit 래퍼 동작
```

## PR-16 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-16: 관리자 행동 로그

[정적] □ RLS super_admin SELECT □ admin/super_admin INSERT □ before/after JSONB □ withAudit 래퍼
[동적] □ logAction 테스트 □ getAuditLogs 테스트 □ withAudit 래퍼 테스트
       □ 일반 사용자 읽기 불가 □ 전체 회귀
```

---

## PR-17 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-17: 스트링 카탈로그 관리자 CRUD를 구현해줘.
현재: PR-14 완료

[구현 단계]
1. supabase/migrations: string_catalog
   CREATE TABLE string_catalog (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     brand TEXT NOT NULL, name TEXT NOT NULL,
     gauge TEXT, color TEXT, image_url TEXT,
     description TEXT, price INT,
     recommended_style TEXT, is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
   );
   ALTER TABLE string_catalog ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "string_admin_all" ON string_catalog FOR ALL
     USING (EXISTS (SELECT 1 FROM admin_permissions WHERE admin_id=auth.uid() AND can_manage_strings=true)
       OR EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='super_admin'));
   CREATE POLICY "string_admin_read" ON string_catalog FOR SELECT
     USING (EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role IN ('admin','super_admin')));

2. src/services/stringCatalogService.ts (관리자용):
   - addString(data), updateString(id, data)
   - deactivateString(id, reason), activateString(id)

3. Storage: string-photos 버킷

4. app/(admin)/strings/ — 목록(활성/비활성 필터), 등록 폼, 수정+비활성화
   디자인 레퍼런스: YellowBall_v0.1/app/admin/ 관리자 UI 스타일 참조 (사이드바, 테이블, 카드 레이아웃)

[완료 조건]
- CRUD 동작, can_manage_strings 권한 체크, 비활성 사용자 미노출, 이미지 업로드
```

## PR-17 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-17: 스트링 카탈로그 관리자 CRUD

[정적] □ RLS can_manage_strings □ is_active 기본 true □ 비활성 사유 기록 필드
[동적] □ CRUD □ 비활성화/활성화 □ 권한 없는 관리자 차단 □ 이미지 업로드 □ 전체 회귀
[보안] □ 일반 사용자 CUD 불가
```
