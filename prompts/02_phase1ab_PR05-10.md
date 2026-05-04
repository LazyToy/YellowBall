# Phase 1A/1B 프롬프트 (PR-05 ~ PR-10)

> ⚠️ 각 프롬프트 앞에 `00_common.md`의 공통 블록을 붙여서 전달하세요.

---

## PR-05 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-05: 회원가입을 구현해줘.
현재 프로젝트 상태: PR-04까지 완료 (Expo+Supabase+디자인+네비게이션)

[구현 단계]
1. src/services/authService.ts: signUp(phone, password, username, nickname)
   - Supabase Auth signUp (phone+password)
   - raw_user_meta_data에 username/nickname 포함
   > 판단 분기: OTP 인증 여부. 옵션A: phone+password만(MVP 권장), 옵션B: OTP 필수(Phase 1.5). PRD 기준 옵션A 권장

2. src/utils/validation.ts:
   - validatePhone: 010-xxxx-xxxx 형식, 한국어 에러
   - validatePassword: 최소 8자, 영문+숫자+특수문자
   - validateUsername: 영문소문자+숫자+언더스코어, 3~20자, 중복 불가
   - validateNickname: 2~10자

3. username 중복 체크:
   > 판단 분기: RLS public vs Edge Function. Edge Function 권장(보안)

4. app/(auth)/register.tsx: 5개 Input + 실시간 유효성 + 가입 버튼 + 에러 표시 + 로그인 이동 링크
   디자인 레퍼런스: YellowBall_v0.1/components/ui/input.tsx, button.tsx, field.tsx 참조

5. profiles INSERT 트리거 (supabase/migrations/002):
   CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO profiles (id, username, nickname, phone)
     VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'nickname', NEW.phone);
     RETURN NEW;
   END; $$ LANGUAGE plpgsql SECURITY DEFINER;
   CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

6. notification_preferences 테이블 생성 + 트리거에서 초기 레코드 INSERT:
   CREATE TABLE notification_preferences (
     user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
     booking_notifications BOOLEAN DEFAULT true,
     delivery_notifications BOOLEAN DEFAULT true,
     string_life_notifications BOOLEAN DEFAULT true,
     marketing_notifications BOOLEAN DEFAULT false,
     quiet_hours_enabled BOOLEAN DEFAULT false,
     quiet_hours_start TIME, quiet_hours_end TIME
   );
   ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "noti_pref_own" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

7. TDD: validation 정상/비정상, authService signUp 모킹, register 화면 렌더/인터랙션

[경계 조건]
- 비밀번호 평문 저장/로그 절대 금지
- username 중복체크가 타인 정보를 노출하지 않도록

[완료 조건]
- 유효 정보로 가입 성공
- 중복 username 에러 표시
- 비밀번호 불일치 시 가입 차단
- profiles + notification_preferences 자동 생성 (트리거)
- 전체 테스트 통과
```

## PR-05 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-05: 회원가입 / 선행: PR-04

[정적 검증]
□ validation.ts에 4개 함수 존재 + 한국어 에러 메시지
□ signUp에 raw_user_meta_data에 username/nickname 포함
□ 트리거가 SECURITY DEFINER
□ notification_preferences에 RLS 활성화
□ register.tsx에 try-catch + 에러 UI 피드백

[동적 검증]
□ validation: 정상 전화번호 통과, 비정상(길이/문자) 실패
□ validation: 비밀번호 8자 미만 실패, 영문만 실패
□ validation: username 특수문자 포함 시 실패
□ authService: 모킹 signUp 성공 시 user/session 반환
□ register 화면: 빈 필드로 가입 시 유효성 에러 표시

[보안 검증]
□ 비밀번호가 평문으로 로그/저장되지 않음
□ username 중복체크가 타인 정보를 노출하지 않음
□ 전체 회귀 테스트 통과
```

---

## PR-06 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-06: 로그인 + 세션 + 로그아웃을 구현해줘.
현재 프로젝트 상태: PR-05까지 완료 (회원가입)

[구현 단계]
1. src/services/authService.ts 추가:
   - signIn(phone, password): { session, user, error }
   - signOut(): void — Supabase signOut + SecureStore 삭제
   - getSession(): session | null
   - onAuthStateChange(callback): subscription

2. app/_layout.tsx 수정:
   - 앱 시작 시 SecureStore에서 세션 토큰 복원
   - getSession() 호출 → 유효하면 (tabs), 무효하면 (auth)
   - 세션 만료 시 자동 갱신 (refreshSession)

3. app/(auth)/login.tsx:
   - Input: 전화번호, 비밀번호
   - 로그인 버튼 (로딩 상태)
   - 에러 메시지 (틀린 비밀번호, 계정 없음, 제재 계정)
   - 회원가입 화면 이동 링크
   디자인 레퍼런스: YellowBall_v0.1/components/ui/input.tsx, button.tsx 참조

4. 제재 사용자 차단:
   - 로그인 성공 후 profiles.status 확인
   - suspended → "계정이 제재되었습니다" 표시, 로그인 차단
   - deleted_pending → "탈퇴 처리 중인 계정입니다" 표시, 로그인 차단

5. 프로필 탭에 로그아웃 버튼:
   - signOut() + SecureStore 토큰 삭제 + Zustand 상태 초기화
   - (auth) 그룹으로 리다이렉트

6. src/hooks/useAuth.ts 보강: signIn/signOut 메서드, profile 로딩

7. TDD: signIn 성공/실패, signOut, suspended 차단, login 화면 렌더

[완료 조건]
- 유효 정보 로그인 성공
- 잘못된 비밀번호 에러 표시
- 제재 사용자 로그인 차단
- 앱 재실행 자동 로그인
- 로그아웃 → (auth) 리다이렉트
- 전체 테스트 통과
```

## PR-06 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-06: 로그인 + 세션 + 로그아웃 / 선행: PR-05

[정적 검증]
□ authService에 signIn, signOut, getSession, onAuthStateChange 메서드 존재
□ login.tsx에 에러 처리 (try-catch + 사용자 피드백)
□ 제재 사용자 차단 로직이 profiles.status 확인
□ 로그아웃 시 SecureStore 삭제 코드 존재
□ _layout.tsx에 자동 로그인 로직 존재

[동적 검증]
□ signIn 성공 테스트
□ signIn 실패 (잘못된 비밀번호) 테스트
□ suspended 사용자 차단 테스트
□ signOut 후 상태 초기화 테스트
□ login 화면 렌더링 + 인터랙션 테스트

[회귀 검증]
□ PR-05 회원가입 정상 동작
□ 기존 테스트 전체 통과
```

---

## PR-07 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-07: 프로필 조회/수정을 구현해줘.
현재: PR-06 완료

[구현 단계]
1. profileService 보강: getProfile, updateProfile(닉네임/전화번호), 전화번호 변경 시 Auth도 업데이트
2. app/(tabs)/me.tsx: 정보 표시(username 읽기전용), 수정 모드, 설정 메뉴 링크
   디자인 레퍼런스: YellowBall_v0.1/app/(mobile)/me/page.tsx + components/app/me/ 참조
3. TDD: updateProfile 모킹, 화면 렌더/수정 테스트

[경계 조건]
- username 변경 불가 (읽기전용)
- 전화번호 변경 시 중복 체크

[완료 조건]
- 프로필 정보 표시
- 닉네임 수정 성공
- username readonly
- 설정 메뉴 링크 동작
```

## PR-07 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-07: 프로필 조회/수정

[정적] □ username editable=false □ 전화번호 중복 체크 로직
[동적] □ 프로필 렌더링 □ 닉네임 수정→저장 □ 전체 회귀
```

---

## PR-08 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-08: 주소 관리를 구현해줘.
현재: PR-06 완료

[구현 단계]
1. supabase/migrations/003_addresses.sql:
   CREATE TABLE addresses (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     recipient_name TEXT NOT NULL, phone TEXT NOT NULL,
     postal_code TEXT, address_line1 TEXT NOT NULL, address_line2 TEXT,
     is_default BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "addresses_own" ON addresses FOR ALL USING (auth.uid() = user_id);

2. src/services/addressService.ts:
   - getAddresses(userId), addAddress(data) — 첫 주소 자동 기본
   - updateAddress(id, data), deleteAddress(id) — 기본 삭제 시 다른 주소로 이전
   - setDefaultAddress(id) — 기존 기본 해제 후 설정

3. 주소 목록/등록/수정 화면
   디자인 레퍼런스: YellowBall_v0.1/app/(mobile)/me/settings/ 참조
4. TDD: CRUD, 기본 주소 변경, 첫 주소 자동 기본

[완료 조건]
- CRUD 동작, 기본 주소 설정, RLS 본인만, 첫 주소 자동 기본
```

## PR-08 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-08: 주소 관리

[정적] □ ON DELETE CASCADE □ RLS auth.uid()=user_id □ setDefault 기존 해제 로직
[동적] □ CRUD 테스트 □ 기본 주소 변경 □ 첫 주소 자동 기본 □ 기본 삭제시 이전 □ 전체 회귀
[보안] □ 타인 주소 접근 불가
```

---

## PR-09 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-09: 알림 수신 설정을 구현해줘.
현재: PR-06 완료 (notification_preferences 테이블은 PR-05에서 생성됨)

[구현 단계]
1. src/services/notificationPrefService.ts: getPreferences(userId), updatePreferences(userId, data)
2. 설정 화면: 예약/작업(기본ON, OFF시 경고), 배송, 스트링교체, 마케팅(별도 동의 문구), 야간제한+시간설정
   디자인 레퍼런스: YellowBall_v0.1/components/ui/switch.tsx, card.tsx 참조
3. TDD: 조회/수정, 토글 인터랙션

[완료 조건]
- 모든 토글 렌더링, 토글 변경시 서비스 호출, 야간 시간 설정, 마케팅 동의 문구
```

## PR-09 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-09: 알림 수신 설정

[정적] □ 마케팅 동의 별도 문구 □ 예약 OFF 시 경고 문구 □ quiet_hours 필드 연동
[동적] □ 서비스 테스트 □ 화면 토글 인터랙션 □ 전체 회귀
```

---

## PR-10 구현 프롬프트

```
{공통 구현 블록}

[작업 지시]
PR-10: 계정 삭제/탈퇴를 구현해줘.
현재: PR-06 완료

[구현 단계]
1. authService.requestAccountDeletion(userId):
   - profiles.status = 'deleted_pending'
   - 활성 예약 있으면 취소 처리 (또는 경고)
   - Supabase Auth 세션 무효화
   - 로그아웃 처리
2. 탈퇴 화면:
   - 잃게 되는 데이터 안내 (라켓, 예약 내역, 주소 등)
   - 진행 중 예약 경고
   - 확인 다이얼로그 ("정말 탈퇴하시겠습니까?")
   - 비밀번호 재입력 확인
3. Super Admin 탈퇴 차단
4. 물리 삭제 안 함 (상태만 변경)

[경계 조건]
- Super Admin은 절대 탈퇴 불가
- 물리 삭제 금지 (법적 보관)

[완료 조건]
- 탈퇴시 deleted_pending 상태, 탈퇴 후 로그인 불가, 비밀번호 재입력, Super Admin 차단
```

## PR-10 검증 프롬프트

```
{공통 검증 블록}

[검증 대상] PR-10: 계정 삭제/탈퇴

[정적] □ status='deleted_pending' 변경 □ Super Admin 차단 로직 □ 비밀번호 재입력 □ 안내 문구
[동적] □ 탈퇴→status 변경 □ 탈퇴 후 로그인 차단 □ Super Admin 거부 □ 전체 회귀
[보안] □ 본인만 탈퇴 가능(RLS) □ 물리 삭제 안 함
```
