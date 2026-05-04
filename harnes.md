# 🎯 YellowBall — 하네스 엔지니어링 문서

| 항목 | 값 |
|------|-----|
| 문서 버전 | v1.0 |
| 작성일 | 2026-04-29 |
| 대상 프로젝트 | YellowBall (가칭: RallyHub / StringIt / CourtLab) |
| PRD 버전 | Tennis_Pickleball_App_PRD_v2.0 |
| 총 PR 수 | 32개 |
| Phase 범위 | Phase 0 (기반) + Phase 1 (MVP) |

---

## 1. 공통 컨텍스트

> 모든 PR의 구현/검증 프롬프트 앞에 주입되는 프로젝트 정보.

### 역할 지정
너는 YellowBall 프로젝트의 풀스택 개발자야. 테니스·피클볼 샵 운영을 디지털화하는 예약/커머스 기반 모바일 앱을 만든다.

### 기술 스택
- **모바일 앱**: React Native + Expo (Managed Workflow)
- **백엔드**: Supabase (Auth, Postgres, Storage, Realtime, Edge Functions)
- **상태관리**: TanStack Query (서버 상태) + Zustand (로컬 상태)
- **UI**: NativeWind (TailwindCSS for RN) — 확정
- **네비게이션**: Expo Router (파일 기반 라우팅)
- **알림**: Expo Notifications + Supabase Edge Functions
- **이미지**: Supabase Storage + expo-image
- **테스트**: Jest + React Native Testing Library
- **린트**: ESLint + Prettier
- **언어**: TypeScript 필수

### 프로젝트 폴더 구조 (권장)

```
app/                    # Expo Router 페이지
  (auth)/               # 인증 전 화면 (로그인, 회원가입)
  (tabs)/               # 인증 후 탭 화면
  (admin)/              # 관리자 전용 화면
src/
  components/           # 공통 UI 컴포넌트
  hooks/                # 커스텀 훅
  services/             # Supabase API 호출 레이어
  stores/               # Zustand 스토어
  types/                # TypeScript 타입 정의
  utils/                # 유틸리티 함수
  constants/            # 상수
supabase/
  migrations/           # SQL 마이그레이션 파일
  functions/            # Edge Functions
  seed.sql              # 시드 데이터
__tests__/              # 테스트 파일
YellowBall_v0.1/        # 디자인 레퍼런스 (Next.js 웹 초안) — 참조 전용, 수정 금지
```

### 디자인 레퍼런스

> 모든 화면 구현 시 `YellowBall_v0.1/` 폴더의 Next.js 웹 초안을 **디자인 레퍼런스**로 참조한다.
> 이 폴더는 읽기 전용이며 수정하지 않는다. React Native로 동일한 룩앤필을 재현한다.

**디자인 레퍼런스 ↔ 앱 화면 매핑:**

| 앱 화면 | 디자인 레퍼런스 경로 |
|---------|---------------------|
| **[사용자] 홈** | `YellowBall_v0.1/app/(mobile)/page.tsx` + `components/app/greeting-hero.tsx`, `quick-services.tsx`, `booking-status.tsx`, `my-rackets.tsx`, `shop-hours.tsx`, `demo-rackets.tsx`, `promo-banner.tsx`, `featured-strings.tsx`, `shop-categories.tsx` |
| **[사용자] 하단 탭바** | `YellowBall_v0.1/components/app/bottom-nav.tsx` — 홈/예약/+/샵/마이 5탭 |
| **[사용자] 상단바** | `YellowBall_v0.1/components/app/top-bar.tsx` |
| **[사용자] 예약 화면** | `YellowBall_v0.1/app/(mobile)/booking/page.tsx` + `components/app/booking/` |
| **[사용자] 스트링 선택** | `YellowBall_v0.1/app/(mobile)/booking/string/` |
| **[사용자] 마이페이지** | `YellowBall_v0.1/app/(mobile)/me/page.tsx` + `components/app/me/` |
| **[사용자] 내 라켓** | `YellowBall_v0.1/app/(mobile)/me/rackets/` |
| **[사용자] 설정** | `YellowBall_v0.1/app/(mobile)/me/settings/` |
| **[사용자] 샵** | `YellowBall_v0.1/app/(mobile)/shop/page.tsx` + `components/app/shop/` |
| **[사용자] 모바일 레이아웃** | `YellowBall_v0.1/app/(mobile)/layout.tsx` |
| **[관리자] 대시보드** | `YellowBall_v0.1/app/admin/page.tsx` + `components/admin/admin-kpis.tsx`, `admin-queue-board.tsx`, `admin-sales-chart.tsx`, `admin-demo-calendar.tsx`, `admin-low-stock.tsx`, `admin-recent-orders.tsx` |
| **[관리자] 사이드바** | `YellowBall_v0.1/components/admin/admin-sidebar.tsx` |
| **[관리자] 상단바** | `YellowBall_v0.1/components/admin/admin-topbar.tsx` |
| **[관리자] 예약 관리** | `YellowBall_v0.1/app/admin/bookings/page.tsx` |
| **[관리자] 시타 라켓** | `YellowBall_v0.1/app/admin/demo/` |
| **[관리자] 고객 관리** | `YellowBall_v0.1/app/admin/customers/` |
| **[관리자] 설정** | `YellowBall_v0.1/app/admin/settings/page.tsx` |
| **[관리자] 슈퍼 관리자** | `YellowBall_v0.1/app/admin/super/` |
| **[공통] 글로벌 CSS 토큰** | `YellowBall_v0.1/app/globals.css` — 컬러, 타이포, 스페이싱 토큰 |
| **[공통] 폰트** | Geist(본문) + Manrope(디스플레이) → React Native에서 유사 폰트 적용 |

**디자인 재현 원칙:**
- 컬러: `globals.css`의 CSS 변수에서 HSL 값 추출 → `theme.ts`에 매핑
- 라운딩/그림자: 웹 디자인과 동일한 `borderRadius`, `shadow` 적용
- 카드/리스트: 웹의 카드형 레이아웃을 React Native `FlatList` + 카드 컴포넌트로 재현
- 아이콘: 웹은 lucide-react → 앱은 lucide-react-native 또는 동일 아이콘셋
- 애니메이션: 웹의 hover/transition → 앱의 press 피드백/Reanimated로 대체

### 코딩 규칙

**Always:**
- 모든 주석/에러 메시지는 한국어로 작성
- 모든 구현은 Red→Green→Refactor TDD 사이클 엄수
- 테스트 없이 코드를 단 한 줄도 작성하지 않음
- 에러 발생 가능 구간에 try-catch + 사용자 피드백(UI) 포함
- Supabase 쿼리는 반드시 services/ 레이어를 통해 호출
- 변경 후 npx expo lint + npm run test 실행
- 정보 부족·판단 분기 시 즉시 멈추고 객관적 옵션을 제시
- 변경 작업 시 영향 최소화 + 확장성 고려
- 독립적 작업은 서브 에이전트에 병렬 위임
- **화면 구현 시 반드시 YellowBall_v0.1의 디자인 레퍼런스를 참조하여 동일한 룩앤필을 구현**

**Never:**
- 기존 API 인터페이스를 breaking change 하지 않음
- 테스트 없이 로직 변경 금지
- console.log를 production 코드에 남기지 않음
- Supabase 서비스 키를 클라이언트 코드에 노출하지 않음
- RLS 비활성화 상태로 테이블을 public에 노출하지 않음
- YellowBall_v0.1/ 폴더의 파일을 수정하지 않음 (읽기 전용 레퍼런스)

### TDD 원칙 (구현 AI 필수 준수)

1. RED: 실패하는 테스트를 먼저 작성
   - 서비스 레이어: Jest 단위 테스트 (Supabase 클라이언트 모킹)
   - 컴포넌트: React Native Testing Library
   - DB: migration 후 RLS 정책 테스트 SQL
2. GREEN: 테스트를 통과하는 최소한의 코드 작성
3. REFACTOR: 코드 품질 개선 (중복 제거, 네이밍 등)

### 보고 형식 (구현 AI)

```
✅ 수정/추가된 파일 목록
✅ 변경 내용 (diff 형식)
✅ 변경 이유
✅ 영향 범위
✅ 다음 단계
✅ 테스트 결과 (통과/실패 수)
```

### 보고 형식 (검증 AI)

```
전체 결과: ✅ 통과 / ❌ 실패
- 각 검증 항목별 ✅/❌ + 근거
- 실패 항목: 재현 단계 + 로그/스크린샷
- 논리적 결함/오류 발견 시: 항목에 없어도 지적사항에 추가
- 수정 제안 (있는 경우)
```

---

## 2. 전체 이슈 목록

### Phase 0: 기반 구축

| # | 이슈 | 복잡도 | 핵심 산출물 | 선행 |
|---|------|--------|------------|------|
| PR-01 | Expo 프로젝트 초기화 | ⬜ 낮음 | 프로젝트 골격, ESLint, Prettier, Jest | 없음 |
| PR-02 | Supabase 연동 + 핵심 스키마 | 🟨 중간 | Supabase 클라이언트, profiles, RLS 기초 | PR-01 |
| PR-03 | 디자인 시스템 기반 | 🟨 중간 | 토큰, 공통 컴포넌트 | PR-01 |
| PR-04 | 네비게이션 + 인증 가드 | 🟨 중간 | Expo Router, 인증/비인증 분기, 탭 | PR-02,03 |

### Phase 1A: 인증

| # | 이슈 | 복잡도 | 핵심 산출물 | 선행 |
|---|------|--------|------------|------|
| PR-05 | 회원가입 | 🟨 중간 | 가입 화면 + API + profiles 생성 | PR-04 |
| PR-06 | 로그인 + 세션 + 로그아웃 | 🟨 중간 | 로그인 화면, 자동 로그인, 세션 갱신 | PR-05 |

### Phase 1B: 사용자 관리

| # | 이슈 | 복잡도 | 핵심 산출물 | 선행 |
|---|------|--------|------------|------|
| PR-07 | 프로필 조회/수정 | ⬜ 낮음 | 프로필 화면, 닉네임/전화번호 수정 | PR-06 |
| PR-08 | 주소 관리 | 🟨 중간 | addresses CRUD UI, 기본주소 | PR-06 |
| PR-09 | 알림 수신 설정 | ⬜ 낮음 | notification_preferences, 설정 UI | PR-06 |
| PR-10 | 계정 삭제/탈퇴 | 🟨 중간 | 탈퇴 플로우, 상태 변경 | PR-06 |

### Phase 1C: 라켓/스트링

| # | 이슈 | 복잡도 | 핵심 산출물 | 선행 |
|---|------|--------|------------|------|
| PR-11 | 내 라켓 라이브러리 | 🟨 중간 | user_rackets CRUD, 사진 업로드 | PR-06 |
| PR-12 | 스트링/텐션 조합 저장 | 🟨 중간 | user_string_setups CRUD | PR-11,13 |
| PR-13 | 스트링 카탈로그 조회 | ⬜ 낮음 | 카탈로그 목록/필터/상세 | PR-17 |

### Phase 1D: 관리자 기반

| # | 이슈 | 복잡도 | 핵심 산출물 | 선행 |
|---|------|--------|------------|------|
| PR-14 | 권한 체계 + Super Admin | 🟥 높음 | 역할 분기, admin_permissions, RLS | PR-06 |
| PR-15 | 관리자 임명/해임 + 권한 토글 | 🟨 중간 | 관리자 목록, 권한 UI | PR-14 |
| PR-16 | 관리자 행동 로그 | 🟨 중간 | audit_logs, 트리거 | PR-14 |
| PR-17 | 스트링 카탈로그 관리자 CRUD | 🟨 중간 | 등록/수정/비활성화 | PR-14 |

### Phase 1E: 스케줄

| # | 이슈 | 복잡도 | 핵심 산출물 | 선행 |
|---|------|--------|------------|------|
| PR-18 | 영업시간 + 휴무일 | 🟨 중간 | shop_schedule, closed_dates + UI | PR-14 |
| PR-19 | 예약 슬롯 관리 | 🟥 높음 | booking_slots, 슬롯 생성/차단 | PR-18 |

### Phase 1F: 스트링 작업 예약

| # | 이슈 | 복잡도 | 핵심 산출물 | 선행 |
|---|------|--------|------------|------|
| PR-20 | 예약 생성 (사용자) | 🟥 높음 | service_bookings, 예약 폼 | PR-11,13,19 |
| PR-21 | 예약 조회 (사용자) | 🟨 중간 | 내 예약 목록/상세 | PR-20 |
| PR-22 | 예약 관리 (관리자) | 🟥 높음 | 승인/거절/상태변경, booking_status_logs | PR-20,14 |
| PR-23 | 예약 취소 + 노쇼 | 🟨 중간 | 취소 정책, 노쇼 카운트 | PR-22 |

### Phase 1G: 시타 예약

| # | 이슈 | 복잡도 | 핵심 산출물 | 선행 |
|---|------|--------|------------|------|
| PR-24 | 시타 라켓 관리 | 🟨 중간 | demo_rackets CRUD + 상태 관리 | PR-14 |
| PR-25 | 시타 예약 생성 + 조회 | 🟥 높음 | demo_bookings, 예약 UI | PR-24,19 |
| PR-26 | 시타 예약 관리 (관리자) | 🟨 중간 | 승인/거절/반납 처리 | PR-25 |
| PR-27 | 시타 전후 상태 체크 | 🟨 중간 | racket_condition_checks, 사진 | PR-26 |

### Phase 1H: 제재 + 알림 + 보안

| # | 이슈 | 복잡도 | 핵심 산출물 | 선행 |
|---|------|--------|------------|------|
| PR-28 | 사용자 제재 | 🟨 중간 | suspend/unsuspend, 예약 제한 | PR-14,16 |
| PR-29 | 푸시 알림 인프라 | 🟨 중간 | Expo Notifications, notifications 테이블 | PR-06 |
| PR-30 | 예약/작업 알림 트리거 | 🟥 높음 | Edge Functions, 상태변경 자동 푸시 | PR-29,22 |
| PR-31 | 관리자 알림센터 | 🟨 중간 | 관리자 알림 목록, 읽음 처리 | PR-29,14 |
| PR-32 | RLS 종합 검증 + 보안 강화 | 🟥 높음 | 전체 RLS 테스트, 취약점 보강 | 전체 |

---

## 3. 의존성 다이어그램

```
PR-01 → PR-02 → PR-04 → PR-05 → PR-06
PR-01 → PR-03 → PR-04                │
                                      ├→ PR-07, PR-08, PR-09, PR-10 (병렬)
                                      ├→ PR-11 → PR-12
                                      ├→ PR-14 → PR-15, PR-16, PR-17, PR-24 (병렬)
                                      │           ├→ PR-18 → PR-19
                                      │           └→ PR-28
                                      └→ PR-29 → PR-30, PR-31

PR-17 → PR-13 → PR-12
PR-11 + PR-13 + PR-19 → PR-20 → PR-21
PR-20 + PR-14 → PR-22 → PR-23
PR-24 + PR-19 → PR-25 → PR-26 → PR-27
PR-29 + PR-22 → PR-30
전체 → PR-32
```

### 병렬 실행 가능 그룹

| 그룹 | 병렬 가능 PR | 선행 조건 |
|------|-------------|----------|
| A | PR-01 | 없음 |
| B | PR-02, PR-03 | PR-01 |
| C | PR-04 | PR-02, PR-03 |
| D | PR-05 | PR-04 |
| E | PR-06 | PR-05 |
| F | PR-07, PR-08, PR-09, PR-10, PR-11, PR-14, PR-29 | PR-06 |
| G | PR-15, PR-16, PR-17, PR-24 | PR-14 |
| H | PR-13, PR-18, PR-28 | PR-17 / PR-14 |
| I | PR-12, PR-19 | PR-11+13 / PR-18 |
| J | PR-20, PR-25 | PR-11+13+19 / PR-24+19 |
| K | PR-21, PR-22, PR-26, PR-30, PR-31 | 각 선행 |
| L | PR-23, PR-27 | 각 선행 |
| M | PR-32 | 전체 |

---

<!-- PART_SPLIT: 이하 PR 상세 -->


## PR-01: Expo 프로젝트 초기화 + 개발 환경

### 문제 정의
프로젝트가 존재하지 않음. Expo + TypeScript 기반 프로젝트를 생성하고 개발 환경을 구성해야 함.

### 구현 지시

**전제 조건:** 없음

**단계 1: Expo 프로젝트 생성**
```bash
npx -y create-expo-app@latest ./ --template blank-typescript
```

**단계 2: 핵심 의존성 설치**
```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar
npm install @tanstack/react-query zustand
npm install -D jest @testing-library/react-native @testing-library/jest-native eslint prettier eslint-config-expo
```

**단계 3: 폴더 구조 생성** — app/(auth), app/(tabs), app/(admin), src/components, src/hooks, src/services, src/stores, src/types, src/utils, src/constants, supabase/migrations, __tests__

**단계 4: 설정 파일** — tsconfig.json(strict, path alias @/→src/), .eslintrc.js, .prettierrc, jest.config.js, .vscode/settings.json, .gitignore

**단계 5:** `npx expo lint` + `npm run test -- --passWithNoTests` 통과 확인

**경계 조건:** NativeWind는 PR-03에서, Supabase는 PR-02에서 처리. UI 라이브러리는 NativeWind 확정.

### 완료 판정 기준

| # | 기준 | 검증 방법 |
|---|------|----------|
| AC-1 | npx expo start 에러 없이 번들링 | 터미널 확인 |
| AC-2 | TypeScript strict 모드 활성화 | tsconfig.json 확인 |
| AC-3 | Jest 실행 가능 | npm run test 통과 |
| AC-4 | ESLint/Prettier 실행 가능 | npx expo lint 통과 |
| AC-5 | 폴더 구조 일치 | 파일 트리 확인 |
| AC-6 | .vscode/settings.json 존재 | 파일 확인 |

### 검증 지시
```
[1단계: 정적 검증]
□ package.json에 expo, expo-router, typescript, jest 의존성 존재
□ tsconfig.json에 "strict": true
□ path alias (@/) 설정이 tsconfig + jest 양쪽에 있는지
□ .gitignore에 node_modules, .expo, dist 포함

[2단계: 동적 검증]
□ npx expo start → 에러 없이 QR코드 출력
□ npm run test -- --passWithNoTests → exit code 0
□ npx expo lint → 에러 0개

[3단계: 구조 검증]
□ app/(auth), app/(tabs), app/(admin) 폴더 존재
□ src/ 하위 7개 폴더 존재
□ supabase/migrations, __tests__ 존재
```

---

## PR-02: Supabase 연동 + 핵심 DB 스키마

### 문제 정의
백엔드가 없음. Supabase 클라이언트를 설정하고 profiles 테이블을 생성해야 함.

### 구현 지시

**전제 조건:** PR-01 완료, Supabase 프로젝트 생성 완료 (URL + anon key 확보)

**단계 1:** `npm install @supabase/supabase-js` + `npx expo install expo-secure-store`

**단계 2:** .env.local 생성 (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY), .gitignore에 추가

**단계 3:** src/services/supabase.ts — SecureStore adapter로 토큰 영속화, 싱글톤 패턴

**단계 4: profiles 마이그레이션** supabase/migrations/001_create_profiles.sql:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin','admin','user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted_pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

**단계 5:** src/types/database.ts — 타입 정의 (수동 또는 supabase gen types)

**단계 6:** src/services/profileService.ts — getProfile(userId), updateProfile(userId, data)

**단계 7: TDD** — supabase 클라이언트 생성 테스트, profileService 모킹 테스트

**경계 조건:** service_role 키 클라이언트 미노출, RLS 비활성 테이블 금지

### 완료 판정 기준

| # | 기준 | 검증 방법 |
|---|------|----------|
| AC-1 | Supabase 클라이언트 초기화 성공 | 단위 테스트 |
| AC-2 | profiles 테이블 + RLS 활성화 | SQL 확인 |
| AC-3 | profileService 모킹 테스트 통과 | npm run test |
| AC-4 | TypeScript 타입 파일 존재 | database.ts 확인 |
| AC-5 | 환경변수가 .gitignore에 포함 | 파일 확인 |

### 검증 지시
```
[정적] □ .env.local이 .gitignore에 포함 □ supabase.ts에 service_role 키 없음
       □ profiles SQL에 RLS ENABLE 존재 □ role/status CHECK 제약조건 확인
       □ ON DELETE CASCADE 확인
[동적] □ profileService 테스트 통과 □ SQL 문법 검증
[보안] □ RLS가 auth.uid()=id 조건 사용 □ INSERT 정책 없음 확인 (트리거로 처리 예정)
```

---

## PR-03: 디자인 시스템 기반

### 문제 정의
UI 컴포넌트가 없음. 일관된 디자인을 위한 토큰과 공통 컴포넌트를 구축해야 함.

### 구현 지시

**전제 조건:** PR-01 완료

**디자인 레퍼런스:** `YellowBall_v0.1/app/globals.css`에서 컬러/타이포/스페이싱 CSS 변수 추출

**단계 1:** NativeWind 설치 (확정)

**단계 2:** src/constants/theme.ts — `YellowBall_v0.1/app/globals.css`의 CSS 변수에서 HSL 값을 추출하여 colors, typography, spacing, borderRadius 토큰 정의. 폰트는 Geist(본문)+Manrope(디스플레이) 대응 폰트 설정.

**단계 3: 공통 컴포넌트 (각각 TDD)**
1. Button.tsx — Primary/Secondary/Outline/Disabled, 로딩 스피너 (레퍼런스: `YellowBall_v0.1/components/ui/button.tsx`)
2. Input.tsx — 라벨, 에러 메시지, 비밀번호 토글 (레퍼런스: `YellowBall_v0.1/components/ui/input.tsx`, `field.tsx`)
3. Card.tsx — 그림자, 패딩, 둥근 모서리 (레퍼런스: `YellowBall_v0.1/components/ui/card.tsx`)
4. Typography.tsx — h1/h2/body/caption 매핑
5. LoadingSpinner.tsx — 전체 화면 / 인라인 (레퍼런스: `YellowBall_v0.1/components/ui/spinner.tsx`)
6. Badge.tsx — 상태 뱃지 (레퍼런스: `YellowBall_v0.1/components/ui/badge.tsx`)
7. Tabs.tsx — 탭 전환 (레퍼런스: `YellowBall_v0.1/components/ui/tabs.tsx`)

**단계 4: TDD** — 각 컴포넌트 렌더+스냅샷, Button onPress/disabled, Input onChange/에러 표시

**경계 조건:** 다크모드는 토큰만 준비, 애니메이션은 이 PR에서 미포함

### 완료 판정 기준

| # | 기준 | 검증 방법 |
|---|------|----------|
| AC-1 | 5개 컴포넌트 렌더링 가능 | 테스트 통과 |
| AC-2 | Button disabled시 onPress 미호출 | 테스트 |
| AC-3 | Input 에러 메시지 표시 | 테스트 |
| AC-4 | 디자인 토큰 정의 완료 | theme.ts 확인 |
| AC-5 | 모든 컴포넌트 TypeScript Props 타입 | 코드 확인 |

### 검증 지시
```
[정적] □ theme.ts에 colors/typography/spacing/borderRadius 정의
       □ 각 컴포넌트 Props 인터페이스 export □ theme 토큰 사용 (하드코딩 없음)
[동적] □ 전체 컴포넌트 테스트 통과 □ Button press/disabled □ Input 에러 표시
```

---

## PR-04: 네비게이션 + 인증 가드

### 문제 정의
화면 간 이동 구조가 없음. 인증/비인증/관리자 화면 분기를 구현해야 함.

### 구현 지시

**전제 조건:** PR-02, PR-03 완료

**디자인 레퍼런스:** 탭 구조는 `YellowBall_v0.1/components/app/bottom-nav.tsx` 참조 (홈/예약/+새예약/샵/마이 5탭)

**단계 1:** app/_layout.tsx — onAuthStateChange 구독, 세션 유무 분기, QueryClientProvider 래핑

**단계 2:** app/(auth)/ — Stack: login.tsx(빈 껍데기), register.tsx(빈 껍데기)

**단계 3:** app/(tabs)/ — Bottom Tab: index(홈), booking(예약), new-booking(+), shop(샵), me(마이) — 디자인 레퍼런스의 5탭 구조에 맞춤

**단계 4:** app/(admin)/ — Stack: index.tsx(빈 껍데기), role 체크 가드

**단계 5:** src/hooks/useAuth.ts — session, user, profile, isLoading, isAdmin, isSuperAdmin

**단계 6:** src/hooks/useRoleGuard.ts — admin 아닌 사용자 리다이렉트

**단계 7: TDD** — useAuth 상태 전환, useRoleGuard 차단 확인

**경계 조건:** 화면 UI는 Placeholder, 딥링크 미포함

### 완료 판정 기준

| # | 기준 | 검증 방법 |
|---|------|----------|
| AC-1 | 비인증 시 로그인 화면 | 앱 실행 확인 |
| AC-2 | 인증 시 탭 화면 | 모킹 테스트 |
| AC-3 | 비관리자 admin 접근 차단 | useRoleGuard 테스트 |
| AC-4 | 4개 탭 렌더링 | 앱 실행 |
| AC-5 | useAuth 테스트 통과 | npm run test |

### 검증 지시
```
[정적] □ _layout.tsx에 onAuthStateChange □ (auth) Stack □ (tabs) Bottom Tab
       □ (admin) role 가드 □ useAuth에 isAdmin/isSuperAdmin
[동적] □ useAuth/useRoleGuard 테스트 □ 비인증→로그인 □ 탭 표시
[회귀] □ PR-02/03 정상 임포트 □ 기존 테스트 전체 통과
```

---

## PR-05: 회원가입

### 문제 정의
사용자가 앱에 가입할 수 없음. 전화번호 + 비밀번호 기반 가입 구현.

### 구현 지시

**전제 조건:** PR-04 완료

**단계 1:** src/services/authService.ts — signUp(phone, password, username, nickname)
> 판단 분기: OTP 인증 여부. 옵션A: phone+password만(MVP 권장), 옵션B: OTP 필수(Phase 1.5)

**단계 2:** src/utils/validation.ts — validatePhone(010형식), validatePassword(8자+영문+숫자+특수), validateUsername(영문소문자+숫자+_, 3~20자), validateNickname(2~10자)

**단계 3:** username 중복 체크 — Edge Function 권장 (RLS 전체공개 보안 위험 방지)

**단계 4:** app/(auth)/register.tsx — 5개 Input + 실시간 유효성 + 가입 버튼 + 에러 표시

**단계 5:** profiles INSERT 트리거 (SECURITY DEFINER):
```sql
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, nickname, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'nickname', NEW.phone);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**단계 6:** notification_preferences 테이블 생성 + 초기 레코드 트리거

**단계 7: TDD** — validation 정상/비정상, authService signUp 모킹, register 화면 렌더/인터랙션

### 완료 판정 기준

| # | 기준 | 검증 방법 |
|---|------|----------|
| AC-1 | 유효 정보로 가입 성공 | authService 테스트 |
| AC-2 | 중복 username 에러 | 테스트 |
| AC-3 | 비밀번호 불일치 시 차단 | UI 테스트 |
| AC-4 | profiles 자동 생성 | 트리거 SQL 확인 |
| AC-5 | notification_preferences 초기화 | 트리거 확인 |

### 검증 지시
```
[정적] □ validation 4개 함수 + 한국어 에러 □ signUp에 raw_user_meta_data 포함
       □ 트리거 SECURITY DEFINER □ notification_preferences RLS 활성화
       □ register.tsx try-catch + 에러 UI
[동적] □ 전화번호/비밀번호/username/닉네임 검증 □ signUp 성공/실패
       □ register 화면 렌더+인터랙션
[보안] □ 비밀번호 평문 저장/로그 없음 □ username 중복체크 보안
```

---

## PR-06: 로그인 + 세션 + 로그아웃

### 문제 정의
가입한 사용자가 로그인할 수 없음.

### 구현 지시

**전제 조건:** PR-05 완료

**단계 1:** authService — signIn(phone, password), signOut(), getSession(), onAuthStateChange()

**단계 2:** app/_layout.tsx — SecureStore 세션 복원, 자동 로그인, refreshSession

**단계 3:** app/(auth)/login.tsx — 전화번호+비밀번호 Input, 에러 메시지, 가입 링크

**단계 4:** 제재 사용자 차단 — 로그인 후 profiles.status 확인 (suspended/deleted_pending → 차단)

**단계 5:** 프로필 탭에 로그아웃 버튼 — signOut + SecureStore 삭제 + 상태 초기화

**단계 6:** useAuth 보강 — signIn/signOut 메서드, profile 로딩

**단계 7: TDD** — signIn 성공/실패, signOut, suspended 차단, login 화면

### 완료 판정 기준

| # | 기준 | 검증 방법 |
|---|------|----------|
| AC-1 | 유효 정보 로그인 성공 | 테스트 |
| AC-2 | 잘못된 비밀번호 에러 | UI 테스트 |
| AC-3 | 제재 사용자 차단 | 테스트 |
| AC-4 | 앱 재실행 자동 로그인 | useAuth 테스트 |
| AC-5 | 로그아웃 → (auth) 리다이렉트 | 테스트 |

### 검증 지시
```
[정적] □ authService 4개 메서드 □ login.tsx 에러 처리 □ status 확인 로직
       □ 로그아웃 시 SecureStore 삭제 □ _layout 자동 로그인
[동적] □ signIn 성공/실패 □ suspended 차단 □ signOut 상태 초기화 □ 화면 테스트
[회귀] □ PR-05 회원가입 정상 □ 전체 테스트 통과
```

---

## PR-07: 프로필 조회/수정

### 문제 정의
사용자가 프로필을 확인/수정할 수 없음.

### 구현 지시

**전제 조건:** PR-06 완료

- profileService — getProfile, updateProfile(닉네임/전화번호), 전화번호 변경 시 Auth도 업데이트
- app/(tabs)/profile.tsx — 정보 표시 (username 읽기전용), 수정 모드, 설정 메뉴 링크
- TDD — updateProfile 모킹, 화면 렌더/수정

**경계 조건:** username 변경 불가(읽기전용), 전화번호 변경 시 중복 체크

### 완료 판정 기준
| AC-1 | 프로필 표시 | AC-2 | 닉네임 수정 | AC-3 | username readonly | AC-4 | 설정 메뉴 링크 |

### 검증 지시
```
[정적] □ username editable=false □ 전화번호 중복 체크
[동적] □ 프로필 렌더링 □ 닉네임 수정→저장 □ 전체 회귀
```

---

## PR-08: 주소 관리

### 문제 정의
배송/퀵/택배 서비스를 위한 주소 등록 불가.

### 구현 지시

**전제 조건:** PR-06 완료

**마이그레이션:**
```sql
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
```

- addressService — getAddresses, addAddress(첫 주소 자동 기본), updateAddress, deleteAddress(기본 삭제 시 이전), setDefaultAddress
- 주소 목록/등록/수정 화면
- TDD — CRUD, 기본 주소 변경, 첫 주소 자동 기본

### 완료 판정 기준
| AC-1 | CRUD 동작 | AC-2 | 기본 주소 설정 | AC-3 | RLS 본인만 | AC-4 | 첫 주소 자동 기본 |

### 검증 지시
```
[정적] □ ON DELETE CASCADE □ RLS auth.uid()=user_id □ setDefault 기존 해제 로직
[동적] □ CRUD 테스트 □ 기본 주소 □ 첫 주소 자동 □ 전체 회귀
```

---

## PR-09: 알림 수신 설정

### 문제 정의
사용자가 알림 수신 범위를 제어할 수 없음.

### 구현 지시

**전제 조건:** PR-06 완료 (notification_preferences는 PR-05에서 생성)

- notificationPrefService — getPreferences, updatePreferences
- 설정 화면: 예약/작업(기본ON, OFF시 경고), 배송, 스트링교체, 마케팅(별도 동의), 야간제한+시간설정
- TDD — 조회/수정, 토글 인터랙션

### 완료 판정 기준
| AC-1 | 모든 토글 렌더링 | AC-2 | 토글 변경시 서비스 호출 | AC-3 | 야간 시간 설정 | AC-4 | 마케팅 동의 문구 |

### 검증 지시
```
[정적] □ 마케팅 동의 문구 □ 예약 OFF 경고 □ quiet_hours 연동
[동적] □ 서비스 테스트 □ 화면 토글 □ 전체 회귀
```

---

## PR-10: 계정 삭제/탈퇴

### 문제 정의
앱 내 계정 삭제 불가. App Store/Play Store 심사 필수.

### 구현 지시

**전제 조건:** PR-06 완료

- authService.requestAccountDeletion(userId) — status='deleted_pending', 활성 예약 취소, 세션 무효화, 로그아웃
- 탈퇴 UI: 잃게 되는 데이터 안내, 진행 중 예약 경고, 확인 다이얼로그, 비밀번호 재입력
- Super Admin 탈퇴 차단
- 물리 삭제 안 함 (상태만 변경), 법적 보관 데이터 분리는 Phase 2

### 완료 판정 기준
| AC-1 | 탈퇴시 deleted_pending | AC-2 | 탈퇴 후 로그인 불가 | AC-3 | 비밀번호 재입력 | AC-4 | Super Admin 차단 |

### 검증 지시
```
[정적] □ status 변경 □ Super Admin 차단 □ 비밀번호 재입력 □ 안내 문구
[동적] □ 탈퇴→status 변경 □ 로그인 차단 □ Super Admin 거부 □ 전체 회귀
[보안] □ 본인만 탈퇴 가능(RLS) □ 물리 삭제 안 함
```


## PR-11: 내 라켓 라이브러리

### 문제 정의
사용자가 보유 라켓을 등록·관리할 수 없음. 예약 시 라켓 선택의 기반.

### 구현 지시
**전제 조건:** PR-06 완료

**마이그레이션:** user_rackets (id, owner_id→profiles, brand, model, grip_size, weight, balance, photo_url, is_primary, memo, created_at) + RLS (auth.uid()=owner_id)

**Storage:** racket-photos 버킷, storageService — uploadRacketPhoto, deleteRacketPhoto

**서비스:** racketService — getRackets, getRacket, addRacket(첫 라켓 자동 primary), updateRacket, deleteRacket(primary 삭제 시 이전), setPrimaryRacket

**화면:** 라켓 목록(카드형), 등록 폼(브랜드/모델/그립/무게/밸런스/사진/메모), 상세+수정+삭제

**TDD:** CRUD + setPrimary + 사진 업로드 모킹

### 완료 판정 기준
| AC-1 | CRUD 동작 | AC-2 | 메인 라켓 설정 | AC-3 | 사진 업로드 | AC-4 | RLS 본인만 | AC-5 | 첫 라켓 자동 메인 |

### 검증 지시
```
[정적] □ RLS □ ON DELETE CASCADE □ Storage 버킷 정책
[동적] □ CRUD □ 메인 변경 □ 사진 업로드 □ 전체 회귀
```

---

## PR-12: 스트링/텐션 조합 저장

### 문제 정의
라켓별 선호 스트링/텐션 조합을 저장할 수 없음. "다시 예약" 기능의 기반.

### 구현 지시
**전제 조건:** PR-11, PR-13 완료

**마이그레이션:** user_string_setups (id, user_id→profiles, racket_id→user_rackets, main_string_id→string_catalog, cross_string_id→string_catalog, tension_main INT CHECK 20~70, tension_cross INT CHECK 20~70, is_hybrid, memo, last_strung_at) + RLS

**서비스:** stringSetupService — getSetups, getSetupsByRacket, addSetup, updateSetup, deleteSetup

**UI:** 라켓 상세 하단 "스트링 세팅" 섹션, 하이브리드 토글(OFF시 cross=main), 카탈로그에서 선택, 텐션 입력

**TDD:** CRUD, 텐션 범위 검증, 하이브리드 로직

### 완료 판정 기준
| AC-1 | CRUD | AC-2 | 텐션 20~70 제한 | AC-3 | 하이브리드 ON/OFF | AC-4 | CASCADE 삭제 |

### 검증 지시
```
[정적] □ tension CHECK □ ON DELETE CASCADE □ is_hybrid 로직
[동적] □ CRUD □ 텐션 범위 초과 에러 □ 하이브리드 토글 □ 전체 회귀
```

---

## PR-13: 스트링 카탈로그 조회 (사용자)

### 문제 정의
사용자가 이용 가능한 스트링 목록을 확인할 수 없음.

### 구현 지시
**전제 조건:** PR-17 완료 (string_catalog에 데이터 존재)

**RLS 추가:** `CREATE POLICY "string_read_active" ON string_catalog FOR SELECT USING (is_active = true);`

**서비스:** stringCatalogService — getActiveStrings, getStringById, searchStrings(브랜드/이름), filterStrings(게이지/브랜드/스타일)

**화면:** 목록(카드: 이미지/브랜드/이름/게이지/가격), 검색바, 필터, 상세

**TDD:** 조회/검색/필터, 빈 결과 처리

### 완료 판정 기준
| AC-1 | 활성만 표시 | AC-2 | 검색 | AC-3 | 필터 | AC-4 | 비활성 미노출(RLS) |

### 검증 지시
```
[정적] □ RLS is_active=true □ 비활성 접근 불가
[동적] □ 조회/검색/필터 □ 빈 결과 UI □ 전체 회귀
```

---

## PR-14: 권한 체계 + Super Admin

### 문제 정의
관리자/슈퍼 관리자 역할 미구현. 모든 관리자 기능의 기반.

### 구현 지시
**전제 조건:** PR-06 완료

**마이그레이션 1:** admin_permissions (admin_id→profiles, can_manage_strings, can_manage_demo_rackets, can_manage_bookings, can_ban_users, can_manage_products, can_manage_orders, can_post_notice, can_toggle_app_menu, can_manage_admins) + RLS (Super Admin만 R/W, 본인 읽기)

**마이그레이션 2:** app_settings (key PK, value JSONB, updated_by, updated_at) + RLS (전체 읽기, Super Admin만 쓰기)

**시드:** Super Admin은 DB 시드/Dashboard에서 수동 생성

**훅:** usePermission(permissionKey) — super_admin은 모든 권한 true

**가드:** app/(admin)/_layout.tsx — role 체크, 하위 화면 세부 권한 체크

**서비스:** adminService — getAdminPermissions, isAdmin, isSuperAdmin

**TDD:** usePermission 훅, 비관리자 차단, super_admin 전체 권한, RLS 테스트

### 완료 판정 기준
| AC-1 | 3단계 역할 분기 | AC-2 | Super Admin 전체 권한 | AC-3 | 비관리자 차단 | AC-4 | admin_permissions RLS | AC-5 | app_settings RLS |

### 검증 지시
```
[정적] □ RLS super_admin 조건 □ role CHECK □ usePermission super_admin 전체 true
[동적] □ 역할 분기 □ 비관리자 차단 □ RLS 테스트
[보안] □ 일반 사용자 admin_permissions 수정 불가 □ 관리자 자기 권한 변경 불가
```

---

## PR-15: 관리자 임명/해임 + 권한 토글

### 문제 정의
Super Admin이 관리자를 임명/해임하고 권한을 부여할 수 없음.

### 구현 지시
**전제 조건:** PR-14 완료

- adminService 추가: appointAdmin(userId→admin+permissions 초기화), dismissAdmin(admin→user+permissions 삭제), updatePermissions(adminId, permissions)
- 모든 작업 super_admin만 (서비스 레이어 체크)
- app/(admin)/manage-admins.tsx — 관리자 목록, 사용자 검색→임명, 9개 권한 토글, 해임(확인)
- audit_logs 연동 (PR-16 완료 후, 미완료 시 TODO)

### 완료 판정 기준
| AC-1 | Super Admin만 가능 | AC-2 | 9개 토글 | AC-3 | 해임 시 permissions 삭제 | AC-4 | 자기 권한 변경 불가 |

### 검증 지시
```
[정적] □ super_admin 체크 □ 자기 해임 방지
[동적] □ 임명/해임 □ 권한 토글 □ 비권한자 에러 □ 전체 회귀
```

---

## PR-16: 관리자 행동 로그

### 문제 정의
관리자 중요 행동 기록 없음. 감사 추적 필수.

### 구현 지시
**전제 조건:** PR-14 완료

**마이그레이션:** administrator_audit_logs (id, actor_id→profiles, action, target_table, target_id, before_value JSONB, after_value JSONB, ip_address, user_agent, created_at) + RLS (Super Admin만 읽기, admin/super_admin INSERT)

**서비스:** auditService — logAction, getAuditLogs(Super Admin 전용)

**래퍼:** withAudit(action, targetTable, fn) — HOF로 자동 로그 기록

**기록 대상:** 사용자 제재, 권한 변경, 예약 강제 취소, 상품/스트링 비활성화, 시타 라켓 상태 변경, 계정 삭제

### 완료 판정 기준
| AC-1 | 로그 INSERT | AC-2 | Super Admin만 조회 | AC-3 | before/after JSONB | AC-4 | withAudit 래퍼 |

### 검증 지시
```
[정적] □ RLS super_admin □ before/after JSONB □ 일반 사용자 읽기 불가
[동적] □ logAction □ getAuditLogs □ withAudit □ 전체 회귀
```

---

## PR-17: 스트링 카탈로그 관리자 CRUD

### 문제 정의
관리자가 스트링 목록을 관리할 수 없음.

### 구현 지시
**전제 조건:** PR-14 완료

**마이그레이션:** string_catalog (id, brand, name, gauge, color, image_url, description, price, recommended_style, is_active DEFAULT true, created_at, updated_at) + RLS (인증 사용자 active 읽기, 관리자 전체 읽기, can_manage_strings 권한 CUD)

**서비스:** stringCatalogService — addString, updateString, deactivateString(reason), activateString

**화면:** app/(admin)/strings/ — 목록(활성/비활성 필터), 등록 폼, 수정+비활성화

**Storage:** string-photos 버킷

### 완료 판정 기준
| AC-1 | CRUD | AC-2 | can_manage_strings 체크 | AC-3 | 비활성 사용자 미노출 | AC-4 | 이미지 업로드 |

### 검증 지시
```
[정적] □ RLS can_manage_strings □ is_active 기본 true □ 비활성 사유 기록
[동적] □ CRUD □ 비활성화/활성화 □ 권한 없는 관리자 차단 □ 전체 회귀
[보안] □ 일반 사용자 CUD 불가 □ 비활성 쿼리 미포함
```


## PR-18: 영업시간 + 휴무일 관리

### 문제 정의
예약 가능 시간의 기준이 없음.

### 구현 지시
**전제 조건:** PR-14 완료

**마이그레이션:** shop_schedule (day_of_week INT 0~6 UNIQUE, open_time, close_time, is_closed) + closed_dates (date DATE UNIQUE, reason, created_by) + RLS (전체 읽기, 관리자 쓰기)

**서비스:** scheduleService — getSchedule, updateSchedule, getClosedDates, addClosedDate, removeClosedDate

**화면:** app/(admin)/schedule.tsx — 요일별 시간 설정 + 휴무일 캘린더

**시드:** 기본 영업시간 7일분

**TDD:** CRUD + open_time < close_time 검증 + 중복 요일 방지

### 완료 판정 기준
| AC-1 | 영업시간 CRUD | AC-2 | 휴무일 CRUD | AC-3 | 일반 사용자 읽기O 쓰기X |

### 검증 지시
```
[정적] □ day_of_week UNIQUE □ RLS 읽기/쓰기 분리 □ open < close 검증
[동적] □ CRUD □ 쓰기 차단 □ 전체 회귀
```

---

## PR-19: 예약 슬롯 관리

### 문제 정의
예약 가능 시간대가 없음.

### 구현 지시
**전제 조건:** PR-18 완료

**마이그레이션:** booking_slots (id, service_type CHECK('stringing','demo'), start_time, end_time, capacity DEFAULT 1, reserved_count DEFAULT 0, is_blocked, block_reason, CHECK start<end, CHECK count<=capacity, CHECK count>=0) + RLS

**서비스:** slotService — generateSlots(date, type, durationMin, capacity): 영업시간 기반 분할, 휴무일 체크 / getAvailableSlots(date, type): blocked=false, count<capacity / blockSlot, unblockSlot

**화면:** app/(admin)/slots.tsx — 날짜 선택→슬롯 목록, 자동 생성, 개별 차단/해제

**TDD:** 9~18시 60분→9슬롯, 휴무일→0, 차단/만석 제외, 중복 방지

### 완료 판정 기준
| AC-1 | 영업시간 기반 생성 | AC-2 | 휴무일 미생성 | AC-3 | 차단/해제 | AC-4 | count<=capacity | AC-5 | 중복 방지 |

### 검증 지시
```
[정적] □ CHECK 3개 □ 중복 방지 □ 휴무일 체크
[동적] □ 생성 □ 가용 조회 □ 차단 □ 경계값 □ 전체 회귀
```

---

## PR-20: 스트링 작업 예약 생성 (사용자)

### 문제 정의
사용자가 스트링 작업을 예약할 수 없음. 앱 핵심 기능.

### 구현 지시
**전제 조건:** PR-11, PR-13, PR-19 완료

**마이그레이션:** service_bookings (id, user_id, racket_id, main_string_id, cross_string_id, tension_main/cross CHECK 20~70, slot_id, delivery_method CHECK('store_pickup','local_quick','parcel'), address_id, status DEFAULT 'requested' CHECK 16개 상태값, user_notes, admin_notes, no_show_counted DEFAULT false, created_at, updated_at) + RLS (본인 읽기/생성, 관리자 전체)

**서비스:** bookingService.createBooking(data): 1.suspended 체크 2.노쇼3회 체크(PR-23 TODO) 3.슬롯 가용 확인 4.배송시 주소 필수 5.INSERT status='requested' 6.reserved_count+1(트랜잭션)

**화면:** Step1:라켓선택 → Step2:스트링선택 → Step3:텐션 → Step4:날짜/시간(가용슬롯) → Step5:수령방식 → Step6:메모+확인

**"다시 예약":** 이전 세팅 프리필 (라켓/스트링/텐션), 날짜만 새로 선택

**유효성:** bookingValidation — 텐션범위, 배송시 주소, 슬롯 가용, 제재 상태

**TDD:** 정상 생성, 만석 거부, 차단 거부, 제재 거부, 배송+주소없음 거부, 다시예약 프리필

### 완료 판정 기준
| AC-1 | 생성 성공(requested) | AC-2 | 슬롯 검증 | AC-3 | count 증가 | AC-4 | 제재 거부 | AC-5 | 배송시 주소 필수 | AC-6 | 다시예약 | AC-7 | 텐션 제한 |

### 검증 지시
```
[정적] □ status CHECK 16값 □ tension CHECK □ count 증가 트랜잭션 □ 제재 체크 위치
[동적] □ 정상 □ 만석/차단/제재/주소/텐션 거부 □ 다시예약 □ 전체 회귀
[보안] □ RLS 타인 user_id 불가 □ 본인만 조회
```

---

## PR-21: 예약 조회 (사용자)

### 문제 정의
사용자가 예약 목록/상세를 확인할 수 없음.

### 구현 지시
**전제 조건:** PR-20 완료

- bookingService 추가: getMyBookings(userId, filters), getBookingDetail(bookingId) JOIN
- 목록 화면: 진행중/완료/취소 탭, 카드(라켓/스트링/날짜/상태 뱃지)
- 상세 화면: 전체 정보, 상태 타임라인, 관리자 메모
- bookingStatus 유틸: 상태별 한국어 라벨, 색상, 타임라인 순서

### 완료 판정 기준
| AC-1 | 목록 조회 | AC-2 | 상태 필터 | AC-3 | 상세 표시 | AC-4 | 타임라인 |

### 검증 지시
```
[정적] □ 상태 라벨이 전체 status 커버 □ JOIN 테이블 완전
[동적] □ 목록/상세 □ 필터 □ 빈 목록 □ 전체 회귀
```

---

## PR-22: 예약 관리 (관리자)

### 문제 정의
관리자가 예약을 승인/거절/상태관리할 수 없음.

### 구현 지시
**전제 조건:** PR-20, PR-14 완료

**마이그레이션:** booking_status_logs (id, booking_type CHECK('service','demo'), booking_id, previous_status, new_status, changed_by, reason, changed_at) + RLS

**상태 전환 규칙:** statusTransition.ts — VALID_TRANSITIONS 맵, isValidTransition(current, new)
```
requested → approved/rejected/reschedule_requested/cancelled_admin
approved → visit_pending/cancelled_admin/cancelled_user
visit_pending → racket_received/no_show/cancelled_user
racket_received → in_progress / in_progress → completed
completed → pickup_ready/delivered / pickup_ready|delivered → done
```

**서비스:** adminBookingService — getAllBookings, approveBooking, rejectBooking(count-1), rescheduleRequest, updateStatus(유효 전환만), addAdminNote / 모든 변경 시 booking_status_logs + audit_logs

**화면:** app/(admin)/bookings/ — 목록(상태 필터), 상세+액션 버튼(유효 전환만 표시)

**TDD:** 상태 전환 유효/무효, approve, reject+count감소, 로그 기록, 권한 체크

### 완료 판정 기준
| AC-1 | 승인/거절 | AC-2 | 전환 규칙 | AC-3 | 무효 전환 거부 | AC-4 | 로그 기록 | AC-5 | 거절시 count-1 | AC-6 | can_manage_bookings |

### 검증 지시
```
[정적] □ VALID_TRANSITIONS 완전성 □ 로그 INSERT □ count 감소 조건 □ 권한 체크
[동적] □ 승인 □ 거절+count □ 무효 전환 □ 로그 □ 권한 차단 □ 전체 회귀
[보안] □ 일반 사용자 상태 변경 불가
```

---

## PR-23: 예약 취소 + 노쇼

### 문제 정의
취소 정책과 노쇼 관리 없음.

### 구현 지시
**전제 조건:** PR-22 완료

- bookingService.cancelBooking: 24h전→자동 취소(count-1), 24h이내→관리자 확인, 작업시작 후→불가
- noShowService: recordNoShow, getNoShowCount, isBookingRestricted(3회 이상→true)
- cancellationPolicy 유틸: canCancelFreely, getCancellationDeadline, getRemainingTime
- 예약 상세에 취소 가능 여부 + 남은 시간 표시

### 완료 판정 기준
| AC-1 | 24h전 자동 취소 | AC-2 | 24h이내 관리자 필요 | AC-3 | 노쇼 3회 차단 | AC-4 | count-1 | AC-5 | 작업중 취소 불가 |

### 검증 지시
```
[정적] □ 24h 기준=슬롯 start_time □ no_show_counted=true만 카운트 □ in_progress 이후 차단
[동적] □ 24h전/이내 □ 노쇼 3회 □ 작업중 거부 □ count 감소 □ 전체 회귀
```

---

## PR-24: 시타 라켓 관리 (관리자)

### 문제 정의
시타용 라켓 목록이 없음.

### 구현 지시
**전제 조건:** PR-14 완료

**마이그레이션:** demo_rackets (id, brand, model, grip_size, weight, head_size, photo_url, description, status CHECK 6값(active/inactive/maintenance/damaged/sold/hidden), is_demo_enabled, is_active, created_at) + RLS (사용자: active+enabled만, 관리자: can_manage_demo_rackets)

**서비스:** demoRacketService — getDemoRackets(사용자), getAllDemoRackets(관리자), addDemoRacket, updateDemoRacket, updateStatus

**예약 가능 로직:** isAvailableForBooking(racket, slot) — status=active + is_demo_enabled + 시간 중복 없음 + 영업시간 미충돌

### 완료 판정 기준
| AC-1 | CRUD | AC-2 | 6개 상태 | AC-3 | 비활성 미노출 | AC-4 | 권한 체크 |

### 검증 지시
```
[정적] □ status CHECK 6값 □ RLS 분리 □ is_demo_enabled
[동적] □ CRUD □ 상태 변경 □ 비활성 미노출 □ 전체 회귀
```

---

## PR-25: 시타 예약 생성 + 조회

### 문제 정의
사용자가 시타 라켓을 예약할 수 없음.

### 구현 지시
**전제 조건:** PR-24, PR-19 완료

**마이그레이션:** demo_bookings (id, user_id, demo_racket_id, slot_id, start_time, expected_return_time, actual_return_time, status CHECK 9값, user_notes, admin_notes, created_at, updated_at) + RLS (본인 읽기/생성, 관리자 전체)

**서비스:** createDemoBooking: 라켓 가용+제재+시간중복 체크, INSERT, count+1 / getMyDemoBookings, getDemoBookingDetail

**화면:** 시타 가능 라켓 목록 → 선택 → 날짜/시간 → 반납 예정 → 확인 (스트링/텐션 선택 없음)

### 완료 판정 기준
| AC-1 | 생성 성공 | AC-2 | 시간 중복 거부 | AC-3 | 비활성 거부 | AC-4 | 스트링/텐션 없음 |

### 검증 지시
```
[정적] □ 스트링/텐션 필드 없음 □ 시간 중복 로직 □ expected_return_time 필수
[동적] □ 정상 □ 중복/비활성/제재 거부 □ 조회 □ 전체 회귀
```

---

## PR-26: 시타 예약 관리 (관리자)

### 문제 정의
관리자가 시타 예약을 처리할 수 없음.

### 구현 지시
**전제 조건:** PR-25 완료

- adminDemoBookingService: approveDemo, rejectDemo(count-1), markInUse, markReturned(actualReturnTime), markOverdue + booking_status_logs 기록

### 완료 판정 기준
| AC-1 | 승인/거절 | AC-2 | 반납 처리 | AC-3 | 로그 기록 |

### 검증 지시
```
[정적] □ 전환 규칙 □ booking_type='demo'
[동적] □ 각 전환 □ 무효 거부 □ 로그 □ 전체 회귀
```

---

## PR-27: 시타 전후 상태 체크

### 문제 정의
라켓 파손 분쟁 방지용 상태 기록 없음.

### 구현 지시
**전제 조건:** PR-26 완료

**마이그레이션:** racket_condition_checks (id, demo_booking_id, check_type CHECK('before_rental','after_return'), photo_urls TEXT[], scratch_notes, string_condition, grip_condition, damage_detected, deposit_deduction, checked_by, checked_at) + RLS (관리자 CRUD, 본인 읽기)

**서비스:** conditionCheckService — addCheck(사진 업로드 포함), getChecks(bookingId)

**Storage:** condition-photos 버킷

### 완료 판정 기준
| AC-1 | 전/후 체크 기록 | AC-2 | 사진 업로드 | AC-3 | 본인 조회 가능 |

### 검증 지시
```
[정적] □ check_type CHECK □ RLS 분리 □ photo_urls 배열
[동적] □ 전/후 기록 □ 사진 □ 사용자 조회 □ 전체 회귀
```

---

## PR-28: 사용자 제재

### 문제 정의
문제 사용자를 제재할 수 없음.

### 구현 지시
**전제 조건:** PR-14, PR-16 완료

- userManagementService: suspendUser(status='suspended', 활성 예약 취소, audit_logs), unsuspendUser(status='active', audit_logs), getSuspendedUsers
- app/(admin)/users/ — 검색, 제재/해제, 노쇼 카운트 표시

### 완료 판정 기준
| AC-1 | 제재 status | AC-2 | 활성 예약 취소 | AC-3 | 해제 후 정상 | AC-4 | can_ban_users | AC-5 | audit |

### 검증 지시
```
[정적] □ can_ban_users □ 활성 예약 취소 □ audit 연동
[동적] □ 제재/해제 □ 예약 취소 연쇄 □ 로그인 차단 □ 전체 회귀
```

---

## PR-29: 푸시 알림 인프라

### 문제 정의
앱에서 푸시 알림을 보낼 수 없음.

### 구현 지시
**전제 조건:** PR-06 완료

**마이그레이션:** notifications (id, user_id→profiles CASCADE, title, body, notification_type, data JSONB, read DEFAULT false, sent_at, created_at) + RLS (본인만)

- expo-notifications 설치, 권한 요청, 토큰 → profiles 또는 별도 테이블
- notificationService: registerPushToken, getNotifications, markAsRead, markAllAsRead
- 알림 목록 화면 (읽음/미읽음, 타입별 아이콘)

### 완료 판정 기준
| AC-1 | 토큰 등록 | AC-2 | 알림 목록 | AC-3 | 읽음 처리 | AC-4 | RLS 본인만 |

### 검증 지시
```
[정적] □ RLS □ CASCADE □ data JSONB
[동적] □ 토큰 □ 목록 □ 읽음 □ 전체 회귀
```

---

## PR-30: 예약/작업 알림 트리거

### 문제 정의
예약 상태 변경 시 알림이 가지 않음.

### 구현 지시
**전제 조건:** PR-29, PR-22 완료

- Edge Function (supabase/functions/send-notification/): 상태 변경 시 notifications INSERT + Expo Push API
- 알림 메시지: requested→접수, approved→승인, rejected→거절+사유, in_progress→작업시작, completed→완료, reschedule→변경제안, 신규→관리자알림
- notification_preferences 연동: OFF시 미발송, quiet_hours 지연/무음

### 완료 판정 기준
| AC-1 | 상태변경시 알림 | AC-2 | 수신설정 존중 | AC-3 | 한국어 내용 | AC-4 | 관리자 알림 |

### 검증 지시
```
[정적] □ 모든 상태에 메시지 정의 □ preferences 체크 □ Edge Function 구조
[동적] □ 각 상태 알림 □ 수신 OFF 미발송 □ 전체 회귀
```

---

## PR-31: 관리자 알림센터

### 문제 정의
관리자가 주요 이벤트를 한곳에서 확인할 수 없음.

### 구현 지시
**전제 조건:** PR-29, PR-14 완료

- 관리자 알림 대상: 신규 예약, 취소, 변경 요청, 재고 부족(Phase2), 반납 지연, 노쇼 위험 예약
- notifications 테이블 활용 (notification_type으로 구분)
- app/(admin)/notifications.tsx — 관리자 알림 목록, 미읽음 뱃지, 타입 필터

### 완료 판정 기준
| AC-1 | 관리자 알림 목록 | AC-2 | 미읽음 뱃지 | AC-3 | 타입 필터 |

### 검증 지시
```
[정적] □ notification_type이 PRD 이벤트 커버
[동적] □ 목록 □ 읽음 □ 필터 □ 전체 회귀
```

---

## PR-32: RLS 종합 검증 + 보안 강화

### 문제 정의
개별 PR RLS 정책의 전체 정합성 및 보안 취약점 검증 필요.

### 구현 지시
**전제 조건:** 전체 PR 완료

**단계 1:** 전체 테이블 x 역할(user/admin/super_admin/anon) x 작업(CRUD) 매트릭스 작성

**단계 2:** RLS 테스트 SQL (supabase/tests/rls_tests.sql):
- 타인 데이터 접근 불가
- 관리자 테이블 일반 사용자 접근 불가
- 관리자 권한 범위 제한
- Super Admin 전체 접근
- 비인증(anon) 완전 차단

**단계 3: 보안 체크리스트**
- [ ] profiles: 본인 R/W, 관리자 읽기
- [ ] addresses, user_rackets, user_string_setups, notification_preferences: 본인만
- [ ] string_catalog: 전체 읽기(active), 관리자 CRUD
- [ ] admin_permissions: Super Admin만, 본인 읽기
- [ ] audit_logs: Super Admin 읽기, admin INSERT
- [ ] shop_schedule, closed_dates, booking_slots: 전체 읽기, 관리자 CRUD
- [ ] service_bookings, demo_bookings: 본인 읽기/생성, 관리자 전체
- [ ] demo_rackets: 활성만 읽기, 관리자 CRUD
- [ ] racket_condition_checks: 관리자 CRUD, 본인 읽기
- [ ] notifications: 본인만
- [ ] app_settings: 전체 읽기, Super Admin 쓰기

**단계 4:** service_role 클라이언트 미노출 grep 검증, 관리자 세션 만료 확인

### 완료 판정 기준
| AC-1 | 전체 RLS 테스트 통과 | AC-2 | 타인 접근 불가 | AC-3 | anon 차단 | AC-4 | 관리자 범위 제한 | AC-5 | service_role 미노출 |

### 검증 지시
```
[정적] □ 모든 public 테이블 RLS ENABLE (하나라도 빠지면 FAIL)
       □ 모든 테이블 최소 1개 정책 □ service_role grep 검색 □ .env .gitignore
[동적] □ 전체 매트릭스 테스트 □ 역할별 접근 □ 타인 거부 □ 권한 밖 거부
[논리] □ SELECT 정책 과도 공개 여부 □ 불필요 DELETE 정책 □ FOR ALL 의도 확인
```

---

## 실행 계획

### 권장 실행 순서 (13 Wave)

```
Wave 1:  PR-01
Wave 2:  PR-02 + PR-03 (병렬)
Wave 3:  PR-04
Wave 4:  PR-05
Wave 5:  PR-06
Wave 6:  PR-07 + PR-08 + PR-09 + PR-10 + PR-11 + PR-14 + PR-29 (병렬)
Wave 7:  PR-15 + PR-16 + PR-17 + PR-24 (병렬)
Wave 8:  PR-13 + PR-18 + PR-28 (병렬)
Wave 9:  PR-12 + PR-19 (병렬)
Wave 10: PR-20 + PR-25 (병렬)
Wave 11: PR-21 + PR-22 + PR-26 + PR-30 + PR-31 (병렬)
Wave 12: PR-23 + PR-27 (병렬)
Wave 13: PR-32
```

### 크리티컬 패스

```
PR-01 → PR-02 → PR-04 → PR-05 → PR-06 → PR-14 → PR-18 → PR-19 → PR-20 → PR-22
```

---

## 장애 대응

### 검증 실패 시
```
[작업 지시] 이전 구현에서 아래 검증 결과가 나왔어. 수정해줘.
{검증 AI 보고서 붙여넣기}
해당 이슈의 구현 지시를 다시 확인하고 위 버그들을 모두 수정해줘.
```

### 구현 중 문서 충돌 시
1. 즉시 중단
2. 충돌 내용 + 해결 옵션(최소 2개) 보고
3. 문서 수정 후 재개

### 판단 분기점

| # | 분기점 | 옵션 | 결정 |
|---|--------|------|------|
| D-1 | UI 라이브러리 | NativeWind vs Tamagui | **NativeWind (확정)** |
| D-2 | OTP 인증 | 필수 vs 생략 | MVP 생략 |
| D-3 | username 중복체크 | RLS public vs Edge Function | Edge Function |
| D-4 | 우편번호 API | 다음 API vs 수동 | MVP 수동 |
| D-5 | 알림 방식 | DB 트리거 vs Edge Function | Edge Function |
| D-6 | 슬롯 생성 | 자동 vs 수동 | 자동+수동보정 |
| D-7 | 디자인 레퍼런스 | 직접 디자인 vs 웹 초안 참조 | **YellowBall_v0.1/ 참조 (확정)** |

### 롤백
1. git stash 또는 git checkout -- .
2. 실패 원인 분석
3. 문서 수정 후 재시도

### 테스트 실패 대응
1. 실패 테스트 격리: npm run test -- --testPathPattern="파일명"
2. 원인 분류: 로직 버그 / 모킹 불일치 / 의존성 문제
3. 수정 후 전체 재실행

---

## 부록: 프롬프트 조립 가이드

### 구현 AI에게 전달할 프롬프트 구조

각 PR의 구현 프롬프트는 아래 3개 블록을 **순서대로 합쳐서** 하나의 메시지로 전달합니다:

```
① 공통 컨텍스트 (1장 전체 — 역할, 기술스택, 폴더구조, 코딩규칙, TDD원칙, 보고형식)
② 해당 PR의 "구현 지시" 섹션 전체
③ 해당 PR의 "완료 판정 기준" 테이블
```

### 검증 AI에게 전달할 프롬프트 구조

```
① 공통 컨텍스트 (1장 전체)
② 해당 PR의 "완료 판정 기준" 테이블
③ 해당 PR의 "검증 지시" 섹션 전체
```

---

### 예시: PR-01 구현 프롬프트 (그대로 복사하여 전달)

```
[역할]
너는 YellowBall 프로젝트의 풀스택 개발자야.
테니스·피클볼 샵 운영을 디지털화하는 예약/커머스 기반 모바일 앱을 만든다.

[기술 스택]
- React Native + Expo (Managed Workflow)
- Supabase (Auth, Postgres, Storage, Realtime, Edge Functions)
- TanStack Query + Zustand
- Expo Router (파일 기반 라우팅)
- TypeScript 필수
- 테스트: Jest + React Native Testing Library

[코딩 규칙]
Always:
- 모든 주석/에러 메시지는 한국어
- Red→Green→Refactor TDD 사이클 엄수 (테스트 없이 코드 한 줄도 금지)
- 에러 구간에 try-catch + 사용자 피드백 포함
- Supabase 쿼리는 services/ 레이어 통해 호출
- 정보 부족·판단 분기 시 즉시 멈추고 객관적 옵션 제시
- 독립적 작업은 서브 에이전트에 병렬 위임

Never:
- breaking change 금지
- console.log production 코드에 남기지 않음
- Supabase 서비스 키 클라이언트 노출 금지
- RLS 비활성 테이블 금지

[작업 지시]
harnes 문서 "PR-01: Expo 프로젝트 초기화 + 개발 환경"을 구현해줘.

[구현 단계]

== 단계 1: Expo 프로젝트 생성 ==
npx -y create-expo-app@latest ./ --template blank-typescript

== 단계 2: 핵심 의존성 설치 ==
npx expo install expo-router expo-constants expo-linking expo-status-bar
npm install @tanstack/react-query zustand
npm install -D jest @testing-library/react-native @testing-library/jest-native eslint prettier eslint-config-expo

== 단계 3: 폴더 구조 생성 ==
app/(auth)/_layout.tsx, app/(tabs)/_layout.tsx, app/(admin)/_layout.tsx, app/_layout.tsx
src/components, src/hooks, src/services, src/stores, src/types, src/utils, src/constants
supabase/migrations, __tests__

== 단계 4: 설정 파일 ==
- tsconfig.json: strict 모드, path alias (@/ → src/)
- .eslintrc.js: expo 기본 + custom
- .prettierrc: singleQuote, trailingComma, semi
- jest.config.js: react-native preset, moduleNameMapper
- .vscode/settings.json: terminal.integrated.cwd: "${workspaceFolder}"
- .gitignore: node_modules, .expo, dist

== 단계 5: 확인 ==
npx expo lint + npm run test -- --passWithNoTests 통과

[경계 조건 — 하지 말 것]
- NativeWind/Tamagui 설치하지 않음 (PR-03에서 처리)
- Supabase 패키지 설치하지 않음 (PR-02에서 처리)

[완료 조건]
- npx expo start 에러 없이 번들링
- TypeScript strict 모드 활성화 (tsconfig.json)
- Jest 실행 가능 (npm run test 통과)
- ESLint/Prettier 실행 가능 (npx expo lint 통과)
- 폴더 구조가 권장 구조와 일치
- .vscode/settings.json 존재

[보고 형식]
✅ 수정/추가된 파일 목록
✅ 변경 내용 (diff 형식)
✅ 변경 이유
✅ 영향 범위
✅ 다음 단계
✅ 테스트 결과 (통과/실패 수)
```

---

### 예시: PR-01 검증 프롬프트 (그대로 복사하여 전달)

```
[역할]
너는 YellowBall 프로젝트의 독립적인 코드 검증자야.
구현 AI가 "PR-01: Expo 프로젝트 초기화"를 완료했다고 한다. 검증해줘.

[검증 원칙]
- 객관적이고 제시된 항목대로 소스를 하나씩 분석
- 정말 제대로 구현이 됐는지 꼼꼼하게 검증
- 논리적 결함이나 오류 사항이 있으면 항목에 없어도 지적사항에 추가

[1단계: 정적 검증]
□ package.json에 expo, expo-router, typescript, jest 의존성 존재 확인
□ tsconfig.json에 "strict": true 설정 확인
□ path alias (@/) 설정이 tsconfig + jest 양쪽에 있는지 확인
□ .gitignore에 node_modules, .expo, dist 포함 확인

[2단계: 동적 검증]
□ npx expo start → 에러 없이 QR코드 출력
□ npm run test -- --passWithNoTests → exit code 0
□ npx expo lint → 에러 0개

[3단계: 구조 검증]
□ app/(auth), app/(tabs), app/(admin) 폴더 존재
□ src/ 하위 7개 폴더 존재 (components, hooks, services, stores, types, utils, constants)
□ supabase/migrations 폴더 존재
□ __tests__ 폴더 존재
□ .vscode/settings.json 존재하며 terminal.integrated.cwd 설정 포함

[4단계: 추가 검증]
□ NativeWind/Tamagui가 설치되어 있지 않은가 (PR-03 범위)
□ Supabase 패키지가 설치되어 있지 않은가 (PR-02 범위)
□ 불필요한 파일이나 보일러플레이트가 남아있지 않은가

[보고 형식]
전체 결과: ✅ 통과 / ❌ 실패
- 각 항목별 ✅/❌ + 근거
- 실패 항목: 재현 단계 + 로그
- 논리적 결함/오류 발견 시: 지적사항에 추가
- 수정 제안 (있는 경우)
```

---

### 나머지 PR 프롬프트 조립 방법

위 PR-01 예시와 동일한 패턴으로, 각 PR에 대해:

1. **구현 프롬프트** = `[역할]` + `[기술 스택]` + `[코딩 규칙]` (공통) + `[작업 지시]` + `[구현 단계]` + `[경계 조건]` + `[완료 조건]` + `[보고 형식]` (해당 PR 섹션에서 발췌)

2. **검증 프롬프트** = `[역할: 검증자]` + `[검증 원칙]` (공통) + `[1~3단계 검증 항목]` (해당 PR 검증 지시에서 발췌) + `[보고 형식]`

> **팁**: 선행 PR이 있는 경우, 구현 프롬프트의 `[작업 지시]` 앞에 "현재 프로젝트 상태: PR-XX까지 완료됨"을 추가하면 구현 AI가 맥락을 더 잘 파악합니다.
