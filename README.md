# 🎾 YellowBall

> 테니스·피클볼 샵 운영을 디지털화하는 예약/커머스 기반 모바일 앱

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-black)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)

---

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [핵심 기능](#-핵심-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [데이터베이스](#-데이터베이스)
- [권한 체계](#-권한-체계)
- [테스트](#-테스트)
- [개발 현황](#-개발-현황)
- [로드맵](#-로드맵)

---

## 🎯 프로젝트 소개

YellowBall은 테니스·피클볼 매장의 **스트링 작업 예약**, **라켓 시타(데모) 예약**, **용품 판매**를 하나의 앱으로 통합하는 플랫폼입니다.

### 해결하는 문제

| 대상 | 기존 문제 | YellowBall 해결 |
|------|----------|----------------|
| **동호인** | 스트링 교체 시 이전 세팅을 기억하기 어려움 | 라켓별 스트링/텐션 조합 저장 + 원클릭 재예약 |
| **시타 희망자** | 매장에 직접 연락해야 시타 가능 여부 확인 | 앱에서 실시간 시타 라켓 확인 + 예약 |
| **매장 관리자** | 예약·재고·작업 상태를 수기로 관리 | 디지털 예약 관리 + 상태 추적 + 알림 자동화 |

### 타깃 사용자

- **테니스 동호인**: 스트링 교체 예약, 이전 세팅 재활용
- **라켓 구매 예정자**: 시타 라켓 확인 및 예약
- **피클볼 사용자**: 패들·공·액세서리 구매
- **매장 관리자**: 예약 승인/거절, 작업 상태 관리, 유저 제재
- **슈퍼 관리자**: 관리자 권한 설정, 앱 정책 관리

---

## ✨ 핵심 기능

### 사용자 기능
- 🔐 **회원가입/로그인** — 이메일 + 비밀번호, Google/Kakao OAuth 인증 (Supabase Auth)
- 🎾 **내 라켓 라이브러리** — 보유 라켓 등록/관리, 사진 업로드
- 🧵 **스트링/텐션 조합 저장** — 라켓별 선호 세팅 저장, "다시 예약" 기능
- 📅 **스트링 작업 예약** — 라켓·스트링·텐션·시간 선택, 상태 추적
- 🏸 **라켓 시타 예약** — 데모 라켓 대여 예약, 반납 관리
- 📦 **스트링 카탈로그 조회** — 브랜드/게이지/스타일별 검색·필터
- 🔔 **알림 수신 설정** — 예약/작업/마케팅 알림 개별 제어
- 📍 **주소 관리** — 배송/퀵/택배용 주소록

### 관리자 기능
- ✅ **예약 관리** — 승인/거절/상태 변경, 내부 메모
- 🧵 **스트링 카탈로그 CRUD** — 등록/수정/비활성화
- 🏸 **시타 라켓 관리** — 상태(active/maintenance/damaged 등) 관리
- 📆 **영업시간/휴무일** — 요일별 시간 설정, 임시 휴무 등록
- ⏰ **예약 슬롯 관리** — 서비스별 슬롯 생성/차단
- 🚫 **사용자 제재** — suspend/unsuspend, 노쇼 관리
- 👥 **관리자 권한 토글** — Super Admin이 세부 권한 부여
- 📝 **감사 로그** — 중요 관리자 행동 자동 기록
- 🔔 **관리자 알림센터** — 신규 예약, 취소, 반납 지연 등

### 보안
- 🔒 **RLS (Row Level Security)** — 모든 테이블 Supabase RLS 적용
- 🛡️ **권한 기반 접근 제어** — 9개 세부 권한 토글
- 📋 **감사 로그** — 관리자 행동 before/after 기록

---

## 🛠 기술 스택

| 영역 | 기술 | 버전/비고 |
|------|------|----------|
| **프레임워크** | React Native + Expo | SDK 54, Managed Workflow |
| **언어** | TypeScript | Strict 모드 |
| **백엔드** | Supabase | Auth, Postgres, Storage, Edge Functions |
| **상태관리 (서버)** | TanStack React Query | v5 |
| **상태관리 (로컬)** | Zustand | v5 |
| **UI 스타일링** | NativeWind (TailwindCSS) | v4 |
| **네비게이션** | Expo Router | 파일 기반 라우팅 |
| **알림** | Expo Notifications | Edge Function 연동 |
| **보안 저장소** | expo-secure-store | 토큰 영속화 |
| **애니메이션** | react-native-reanimated | v4 |
| **테스트** | Jest + React Native Testing Library | TDD 기반 |
| **린트** | ESLint + Prettier | expo-config 기반 |

---

## 📁 프로젝트 구조

```
YellowBall/
├── app/                          # Expo Router 페이지
│   ├── (auth)/                   # 인증 전 화면
│   │   ├── login.tsx             #   로그인
│   │   └── register.tsx          #   회원가입
│   ├── (tabs)/                   # 인증 후 탭 화면 (14개 화면)
│   │   ├── index.tsx             #   홈
│   │   ├── booking.tsx           #   예약 목록
│   │   ├── new-booking.tsx       #   새 예약 생성
│   │   ├── booking-detail.tsx    #   예약 상세
│   │   ├── rackets.tsx           #   내 라켓 라이브러리
│   │   ├── string-catalog.tsx    #   스트링 카탈로그
│   │   ├── string-setups.tsx     #   스트링/텐션 조합
│   │   ├── me.tsx                #   마이페이지
│   │   ├── addresses.tsx         #   주소 관리
│   │   ├── notifications.tsx     #   알림 목록
│   │   ├── notification-settings.tsx  # 알림 설정
│   │   ├── account-deletion.tsx  #   계정 삭제
│   │   └── shop.tsx              #   샵
│   └── _layout.tsx               # 루트 레이아웃 (인증 가드)
│
├── src/
│   ├── components/               # 공통 UI 컴포넌트 (7개)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Typography.tsx
│   │   ├── Badge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── Tabs.tsx
│   ├── hooks/                    # 커스텀 훅
│   │   ├── useAuth.ts            #   인증 상태 관리
│   │   ├── useRoleGuard.ts       #   역할 기반 접근 제어
│   │   └── usePermission.ts      #   세부 권한 확인
│   ├── services/                 # Supabase API 레이어 (24개)
│   │   ├── supabase.ts           #   Supabase 클라이언트 초기화
│   │   ├── authService.ts        #   인증 (가입/로그인/탈퇴)
│   │   ├── profileService.ts     #   프로필 CRUD
│   │   ├── addressService.ts     #   주소 CRUD
│   │   ├── racketService.ts      #   라켓 CRUD
│   │   ├── stringCatalogService.ts  # 스트링 카탈로그
│   │   ├── stringSetupService.ts #   스트링/텐션 조합
│   │   ├── bookingService.ts     #   스트링 작업 예약
│   │   ├── demoBookingService.ts #   시타 예약
│   │   ├── demoRacketService.ts  #   시타 라켓 관리
│   │   ├── slotService.ts        #   예약 슬롯
│   │   ├── scheduleService.ts    #   영업시간/휴무일
│   │   ├── adminService.ts       #   관리자 권한
│   │   ├── adminBookingService.ts  # 관리자 예약 관리
│   │   ├── adminDemoBookingService.ts  # 관리자 시타 관리
│   │   ├── auditService.ts       #   감사 로그
│   │   ├── notificationService.ts  # 알림
│   │   ├── notificationPrefService.ts  # 알림 설정
│   │   ├── bookingNotificationService.ts  # 예약 알림 트리거
│   │   ├── adminNotificationService.ts  # 관리자 알림
│   │   ├── noShowService.ts      #   노쇼 관리
│   │   ├── conditionCheckService.ts  # 라켓 상태 체크
│   │   ├── storageService.ts     #   이미지 업로드
│   │   └── userManagementService.ts  # 사용자 제재
│   ├── stores/                   # Zustand 스토어
│   ├── types/                    # TypeScript 타입 (database.ts ~990줄)
│   ├── utils/                    # 유틸리티 (6개)
│   └── constants/                # 상수 (theme.ts 포함)
│
├── supabase/
│   ├── migrations/               # SQL 마이그레이션
│   ├── functions/                # Edge Functions
│   │   ├── check-username/       #   username 중복 확인
│   │   └── send-notification/    #   푸시 알림 발송
│   └── tests/                    # RLS 테스트 SQL
│
├── __tests__/                    # 테스트 (58 suites, 203 tests)
├── docs/security/                # 보안 문서 (RLS 접근 매트릭스)
├── prompts/                      # AI 구현/검증 프롬프트 (6개 파일)
├── YellowBall_v0.1/              # 디자인 레퍼런스 (Next.js 웹, 읽기전용)
├── harnes.md                     # 하네스 엔지니어링 문서 (32개 PR 정의)
└── Tennis_Pickleball_App_PRD_v2.md  # PRD v2.0
```

---

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18+
- **npm** 또는 **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Supabase 프로젝트** (URL + anon key 필요)
- **Android Studio** 또는 **Xcode** (에뮬레이터/시뮬레이터 실행 시)

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd YellowBall

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
# .env.local 파일을 프로젝트 루트에 생성
```

**.env.local** 파일 형식:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# 선택: Supabase Auth Redirect URL을 고정해야 할 때 사용
EXPO_PUBLIC_AUTH_REDIRECT_URL=yellowball://auth/callback
```

Supabase Dashboard > Authentication > URL Configuration의 Redirect URLs에
`yellowball://auth/callback`을 추가하세요. Google/Kakao Providers에는 각 콘솔에서
발급받은 OAuth Client ID/Secret을 등록하고, provider callback URL은 Supabase가
표시하는 `https://<project-ref>.supabase.co/auth/v1/callback` 값을 사용합니다.

```bash
# 4. Supabase 마이그레이션 적용
# Supabase Dashboard > SQL Editor에서 supabase/migrations/ 파일을 
# 001번부터 최신 번호까지 순서대로 실행

# 5. 앱 실행
npx expo start

# 6. 플랫폼별 실행
npx expo start --android    # Android
npx expo start --ios        # iOS
npx expo start --web        # Web
```

### 주요 스크립트

| 명령어 | 설명 |
|--------|------|
| `npx expo start` | 개발 서버 시작 |
| `npm run test` | Jest 테스트 실행 |
| `npx expo lint` | ESLint 검사 |
| `npx expo start --android` | Android 실행 |
| `npx expo start --ios` | iOS 실행 |

---

## 🗄 데이터베이스

### 테이블 구조

```
profiles                    # 사용자 프로필 (role, status)
├── addresses               # 주소록 (1:N)
├── notification_preferences  # 알림 수신 설정 (1:1)
├── user_rackets            # 내 라켓 (1:N)
│   └── user_string_setups  # 스트링/텐션 조합 (1:N)
├── admin_permissions       # 관리자 권한 (1:1)
└── notifications           # 알림 (1:N)

string_catalog              # 스트링 카탈로그 (관리자 관리)
demo_rackets                # 시타 라켓 (관리자 관리)

shop_schedule               # 요일별 영업시간
closed_dates                # 임시 휴무일
booking_slots               # 예약 슬롯 (stringing/demo)

service_bookings            # 스트링 작업 예약
demo_bookings               # 시타 예약
booking_status_logs         # 예약 상태 변경 로그
racket_condition_checks     # 시타 라켓 상태 체크 (대여 전후)

app_settings                # 앱 설정 (JSONB)
administrator_audit_logs    # 관리자 감사 로그
```

### RLS (Row Level Security) 정책

모든 테이블에 RLS가 활성화되어 있습니다. 상세 접근 매트릭스는 [docs/security/rls_matrix.md](docs/security/rls_matrix.md) 참조.

| 역할 | 접근 범위 |
|------|----------|
| **anon** | 접근 불가 |
| **user** | 본인 데이터만 CRUD, 활성 카탈로그 읽기 |
| **admin** | 부여된 권한 범위 내 관리 |
| **super_admin** | 전체 접근 |

---

## 🔑 권한 체계

### 역할 (Role)

| 역할 | 설명 |
|------|------|
| `super_admin` | 최고 관리자 (DB 시드로 생성) |
| `admin` | 일반 관리자 (Super Admin이 임명) |
| `user` | 일반 사용자 |

### 관리자 세부 권한 (9개 토글)

| 권한 | 설명 |
|------|------|
| `can_manage_strings` | 스트링 카탈로그 관리 |
| `can_manage_demo_rackets` | 시타 라켓 관리 |
| `can_manage_bookings` | 예약 승인/거절/상태변경 |
| `can_ban_users` | 사용자 제재 |
| `can_manage_products` | 상품 관리 (Phase 2) |
| `can_manage_orders` | 주문 관리 (Phase 2) |
| `can_post_notice` | 공지/이벤트 발송 |
| `can_toggle_app_menu` | 앱 메뉴 활성화/비활성화 |
| `can_manage_admins` | 관리자 권한 관리 |

---

## 🧪 테스트

TDD(테스트 주도 개발) 방식으로 개발되었습니다.

```bash
# 전체 테스트 실행
npm run test

# 특정 파일 테스트
npm run test -- --testPathPattern="bookingService"

# 커버리지 확인
npm run test -- --coverage
```

### 테스트 현황

- **58개 테스트 스위트**, **203개 테스트 케이스** 전체 통과
- 서비스 레이어: Supabase 클라이언트 모킹 기반 단위 테스트
- 컴포넌트: React Native Testing Library 렌더/인터랙션 테스트
- 마이그레이션: SQL 문법 검증 (libpg-query)
- RLS: 정책 테스트 SQL (`supabase/tests/rls_tests.sql`)

---

## 📊 개발 현황

### 완료된 모듈 (정적 분석 기준)

| Wave | PR | 모듈 | 상태 |
|------|----|------|------|
| 1 | PR-01 | Expo 프로젝트 초기화 | ✅ |
| 2 | PR-02 | Supabase 연동 + profiles | ✅ (DB 적용 필요) |
| 2 | PR-03 | 디자인 시스템 | ✅ |
| 3 | PR-04 | 네비게이션 + 인증 가드 | ✅ |
| 4 | PR-05 | 회원가입 | ✅ |
| 5 | PR-06 | 로그인/세션/로그아웃 | ✅ |
| 6 | PR-07~11, 14, 29 | 프로필/주소/알림/라켓/권한/푸시 | ✅ |
| 7 | PR-15~17, 24 | 관리자 권한/감사로그/카탈로그/시타라켓 | ✅ |
| 8 | PR-13, 18, 28 | 카탈로그 조회/영업시간/제재 | ✅ |
| 9 | PR-12, 19 | 스트링 조합/예약 슬롯 | ✅ |
| 10 | PR-20, 25 | 스트링 예약/시타 예약 생성 | ✅ |
| 11 | PR-21, 22, 26, 30, 31 | 예약 조회/관리/알림 | ✅ |
| 12 | PR-23, 27 | 취소/노쇼/상태체크 | ✅ |
| 13 | PR-32 | RLS 종합 검증 + 보안 강화 | ✅ |

### 남은 작업

> ⚠️ **CRITICAL**: Supabase 실제 DB에 마이그레이션이 미적용 상태입니다. 
> Supabase Dashboard SQL Editor에서 순서대로 실행해야 앱이 정상 동작합니다.

- [x] Supabase DB 마이그레이션 적용 (001~023)
- [x] `app.json`에 `android.package`, `android.versionCode` 추가
- [x] `eas.json` 프로덕션 프로필 생성
- [x] 개인정보 처리방침 원문 준비 (`docs/legal/privacy-policy.md`, 공개 URL: `https://lazytoy.github.io/privacy/`)
- [ ] EAS Build로 Android/iOS 빌드 검증

Google Play 배포 체크리스트는 `docs/google-play-release.md`를 기준으로 관리합니다.

---

## 🗺 로드맵

| Phase | 범위 | 예상 기간 | 상태 |
|-------|------|----------|------|
| **Phase 0** | 설계 + 기반 구축 | 2주 | ✅ 완료 |
| **Phase 1** | MVP (예약/관리자/라켓/스트링) | 8~10주 | 🔧 코드 완성, DB 적용 필요 |
| **Phase 1.5** | 운영 안정화 (노쇼 자동화, 재예약) | 3~4주 | 📋 계획됨 |
| **Phase 2** | 커머스 (결제, 상품, QR 태깅, 관리자 웹) | 6~8주 | 📋 계획됨 |
| **Phase 3** | 수익 모델 (레슨/코치 예약) | 6주+ | 📋 계획됨 |
| **Phase 4** | 고도화 (AI 추천, 챗봇, 구독) | 지속 | 📋 계획됨 |

---

## 📚 프로젝트 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| PRD v2.0 | `Tennis_Pickleball_App_PRD_v2.md` | 제품 요구사항 정의서 |
| 하네스 로드맵 | `harnes.md` | 32개 PR 실행 계획 + 검증 기준 |
| 구현 프롬프트 | `prompts/` | AI 에이전트용 구현/검증 프롬프트 |
| RLS 매트릭스 | `docs/security/rls_matrix.md` | 테이블별 접근 권한 매트릭스 |
| RLS 테스트 | `supabase/tests/rls_tests.sql` | RLS 정책 검증 SQL |
| QA 결과 | `result_0504.md` | 2026-05-04 QA 검증 결과 |
| 디자인 레퍼런스 | `YellowBall_v0.1/` | Next.js 웹 디자인 초안 (읽기전용) |

---

## 🎨 디자인 시스템

### 컬러 팔레트

| 토큰 | Light | 용도 |
|------|-------|------|
| `primary` | `#103c28` (딥 그린) | 주요 버튼, 링 |
| `accent` | `#d5e43f` (라임) | 강조, 하이라이트 |
| `background` | `#fcfaf4` (크림) | 배경 |
| `destructive` | `#de3b3d` (레드) | 에러, 삭제 |
| `muted` | `#efefe9` | 비활성 영역 |

### 타이포그래피

- **본문**: Geist (System 대체)
- **디스플레이**: Manrope
- **크기**: xs(13) / sm(14) / body(16) / h2(24) / h1(32)

### 컴포넌트

`Button`, `Input`, `Card`, `Typography`, `Badge`, `LoadingSpinner`, `Tabs` — 모두 TypeScript Props 인터페이스 + 테스트 포함

---

## ⚙️ 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 공개 키 | ✅ |

> ⚠️ `service_role` 키는 클라이언트 코드에 절대 포함하지 않습니다. Edge Functions에서만 서버 환경 변수로 사용합니다.

---

## 📄 라이선스

Private — 비공개 프로젝트

---

> **문서 버전**: v1.0 | **최종 업데이트**: 2026-05-04
