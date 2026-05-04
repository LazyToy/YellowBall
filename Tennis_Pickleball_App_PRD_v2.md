# 🎾 테니스 & 피클볼 통합 플랫폼 PRD v2.0

> **문서 버전**: v2.0  
> **작성일**: 2026년 4월 29일  
> **기술 스택**: React Native + Expo + Supabase + Toss Payments + Next.js Admin  
> **타깃 플랫폼**: iOS App Store / Google Play Store / 추후 웹 관리자 및 쇼핑몰 확장  
> **문서 목적**: 초기 아이디어형 PRD를 실제 출시 가능한 MVP 중심 문서로 재정리

---

## 0. v2.0 수정 요약

기존 v1.0 PRD의 핵심 방향인 **테니스·피클볼 용품 판매 + 라켓 시타 예약 + 스트링 작업 예약 + 관리자 권한 구조**는 유지한다. 다만 실제 앱스토어/플레이스토어 출시와 운영을 고려하여 다음 내용을 보강한다.

### 주요 반영 사항

1. **MVP 범위 재정리**
   - 초기 앱의 목적을 “커뮤니티 앱”이 아니라 **테니스·피클볼 샵 운영을 디지털화하는 예약/커머스 기반 앱**으로 명확화한다.
   - 중고거래, 클럽/동호회, AI 챗봇, 친구초대, Apple Watch 알림 등은 삭제 또는 후순위로 조정한다.

2. **스키마 구조 보완**
   - `profiles`에 `username` 추가
   - 주소는 `profiles.address`가 아니라 `addresses` 테이블로 분리
   - 텐션은 `tension_main`, `tension_cross`로 분리
   - 스트링/상품/시타 라켓에는 `is_active`, `status` 등 활성화/비활성화 상태값 추가
   - 예약 가능 시간 관리를 위한 `shop_schedule`, `closed_dates`, `booking_slots` 추가

3. **운영 정책 추가**
   - 예약 승인/거절/변경 요청
   - 예약 취소 가능 시간
   - 노쇼 카운트
   - 관리자 알림센터
   - 사용자 알림 수신 설정
   - 시타 라켓 대여 전후 상태 체크

4. **보안 및 심사 대응 강화**
   - Supabase RLS 전제
   - 관리자 2FA/MFA 권장
   - IP 화이트리스트는 모바일 관리자에는 부적합하므로 삭제
   - 앱 내 계정 삭제 기능 추가
   - 관리자 행동 로그 `audit_logs` 필수화

5. **결제 스택 명확화**
   - 한국 시장 MVP 기준으로 **토스페이먼츠 우선**
   - Stripe는 해외 확장 시 검토
   - 물리적 상품/오프라인 서비스 결제는 외부 PG 사용
   - 디지털 구독/프리미엄 기능이 생길 경우 App Store/Google Play 정책 별도 검토

---

## 1. 제품 개요

### 1.1 제품명 가칭

- **RallyHub**
- **StringIt**
- **CourtLab**

### 1.2 제품 비전

> 테니스·피클볼 샵의 핵심 운영을 앱으로 연결하여, 사용자는 라켓 시타·스트링 작업·용품 구매를 한 번에 처리하고, 관리자는 예약·재고·작업 상태·고객 정보를 체계적으로 관리할 수 있도록 한다.

### 1.3 초기 제품 포지션

이 앱은 초기 단계에서 커뮤니티 앱이 아니라 **샵 운영형 플랫폼**으로 정의한다.

- 핵심 1: 스트링 작업 예약
- 핵심 2: 라켓 시타 예약
- 핵심 3: 테니스·피클볼 용품 판매
- 핵심 4: 관리자 예약/재고/유저 관리
- 핵심 5: 스트링 교체 이력 기반 재방문 유도

### 1.4 타깃 사용자

| 사용자군 | 설명 | 주요 니즈 |
|---|---|---|
| 테니스 동호인 | 주기적으로 스트링을 교체하는 사용자 | 이전 스트링/텐션 조합 재예약, 작업 진행 상태 확인 |
| 라켓 구매 예정자 | 라켓 구매 전 시타를 원하는 사용자 | 시타 가능 라켓 확인, 예약, 후기 확인 |
| 피클볼 사용자 | 패들, 공, 네트 등 용품 구매자 | 카테고리별 상품 구매, 재고 확인 |
| 매장 관리자 | 예약·재고·작업을 처리하는 운영자 | 예약 승인, 작업 상태 변경, 유저 제재, 재고 관리 |
| 슈퍼 관리자 | 앱 전체 정책과 관리자 권한을 관리하는 최고 권한자 | 관리자 권한 설정, 메뉴 활성화, 정책 관리 |

---

## 2. 기술 스택 적합성 평가

### 2.1 최종 권장 스택

| 영역 | 권장 기술 | 판단 |
|---|---|---|
| 모바일 앱 | React Native + Expo | iOS/Android 동시 출시 목적에 적합 |
| 백엔드 | Supabase | Auth, Postgres, Storage, Realtime, Edge Functions 활용 가능 |
| 관리자 웹 | Next.js + Supabase | Phase 2부터 도입 권장 |
| 결제 | Toss Payments | 한국 시장 MVP 기준 우선 권장 |
| 해외 결제 | Stripe | 해외 확장 시 추가 검토 |
| 상태관리 | TanStack Query + Zustand | 서버 상태/로컬 상태 분리 |
| UI | NativeWind 또는 Tamagui | React Native 생산성 향상 |
| 알림 | Expo Notifications + Supabase Edge Functions | 예약/작업 상태 푸시 알림 |
| 이미지 | Supabase Storage + expo-image | 스트링/라켓/상품 이미지 처리 |
| QR 스캔 | expo-camera | Phase 2 QR 라켓 태깅에 활용 |

### 2.2 기술 판단

React Native + Expo + Supabase 조합은 본 프로젝트에 적합하다. Expo는 EAS Submit을 통해 App Store와 Google Play 제출 흐름을 지원하므로 소규모 팀 또는 1인 개발자가 앱 출시까지 진행하기에 유리하다.

Supabase는 Auth, Postgres, Storage, Realtime을 제공하므로 회원, 권한, 예약, 이미지 업로드, 알림, 관리자 기능 구현에 적합하다. 단, Supabase를 클라이언트 앱에서 직접 접근하는 구조에서는 **RLS(Row Level Security)** 설계가 필수다.

웹 확장까지 고려할 경우, Expo Web만으로 모든 웹 기능을 해결하기보다 다음 구조를 권장한다.

```text
사용자 모바일 앱: React Native + Expo
관리자 웹: Next.js + Supabase
추후 쇼핑몰 웹/랜딩: Next.js
공통 백엔드: Supabase Postgres/Auth/Storage/Edge Functions
```

---

## 3. MVP 원칙

### 3.1 MVP 핵심 목표

초기 MVP의 목표는 “기능이 많은 앱”이 아니라 **실제 매장 운영이 가능한 앱**이다.

MVP는 다음 질문에 답해야 한다.

1. 사용자가 회원가입 후 자신의 라켓/스트링 정보를 저장할 수 있는가?
2. 사용자가 스트링 작업과 라켓 시타를 문제없이 예약할 수 있는가?
3. 관리자가 예약을 승인/거절/변경하고 작업 상태를 관리할 수 있는가?
4. 관리자가 스트링 목록, 시타 라켓, 비정상 이용자를 관리할 수 있는가?
5. 예약 가능 시간, 휴무일, 취소/노쇼 정책이 운영 가능한 수준으로 정의되어 있는가?
6. 앱스토어/플레이스토어 심사에 필요한 계정 삭제, 개인정보 처리, 알림 동의가 반영되어 있는가?

### 3.2 MVP에 넣을 기능

- 회원가입/로그인
- 프로필/전화번호/닉네임/아이디 관리
- 주소 선택 등록
- 내 라켓 라이브러리
- 기본 스트링/텐션 조합 저장
- 스트링 카탈로그 조회
- 스트링 작업 예약
- 라켓 시타 예약
- 예약 승인/거절/변경 요청
- 예약 상태 확인
- 관리자 예약 관리
- 관리자 스트링 목록 관리
- 관리자 시타 라켓 관리
- 관리자 유저 제재
- 슈퍼 관리자 권한 관리
- 영업시간/휴무일 설정
- 알림 수신 설정
- 앱 내 계정 삭제
- RLS 및 audit log

### 3.3 MVP에서 제외할 기능

- 중고거래 마켓
- 파트너 매칭
- 클럽/동호회
- AI 챗봇
- AI 기반 스트링 추천
- Apple Watch 알림
- 홈 위젯
- 친구 초대 리워드
- 유료 구독 멤버십

---

## 4. 사용자 및 권한 구조

### 4.1 권한 등급

| 권한 등급 | 설명 | 핵심 기능 |
|---|---|---|
| Super Admin | DB 시드 또는 내부 절차로 최초 1명 생성 | 전체 권한, 관리자 임명/해임, 권한 부여, 메뉴 ON/OFF, 정책 관리 |
| Admin | Super Admin이 지정 | 부여된 권한 범위 내에서 예약/스트링/유저/상품 관리 |
| Basic User | 회원가입만 완료한 일반 사용자 | 프로필 관리, 시타 예약, 스트링 작업 예약, 상품 조회/구매 |
| Address Verified User | 주소를 1개 이상 등록한 사용자 | 배송/퀵/택배 서비스 이용 가능 |
| Suspended User | 제재된 사용자 | 예약/구매 제한, 로그인 가능 여부는 정책에 따라 결정 |

### 4.2 관리자 권한 세분화

일반 관리자는 고정된 권한이 아니라 Super Admin이 권한을 토글 형태로 부여한다.

권장 권한 항목:

- 스트링 목록 관리
- 시타 라켓 관리
- 예약 승인/거절/변경
- 작업 상태 변경
- 유저 제재
- 상품 관리
- 주문 관리
- 공지/이벤트 발송
- 앱 메뉴 활성화/비활성화
- 관리자 권한 관리

### 4.3 권한 설계 원칙

1. Super Admin만 관리자 권한을 변경할 수 있다.
2. 관리자는 자신의 권한을 직접 변경할 수 없다.
3. 사용자 제재, 관리자 권한 변경, 예약 강제 취소, 상품 비활성화 등 중요 행동은 `audit_logs`에 기록한다.
4. 관리자가 사용자 비밀번호를 직접 볼 수 없으며, 임의로 평문 비밀번호를 설정해서도 안 된다.
5. 비밀번호 초기화는 재설정 링크 또는 인증 기반 플로우로 처리한다.

---

## 5. 핵심 기능 요구사항

## F1. 회원가입, 로그인, 프로필

### F1-1. 회원가입 필수 정보

회원가입 시 다음 정보를 필수로 받는다.

- 아이디 `username`
- 비밀번호
- 전화번호
- 닉네임

단, Supabase Auth 기본 구조를 고려하면 로그인 방식은 다음 중 하나로 결정해야 한다.

| 방식 | 장점 | 단점 | 권장도 |
|---|---|---|---|
| 전화번호 + 비밀번호 | Supabase Password Auth와 잘 맞음 | 사용자가 말한 “아이디 로그인” 느낌은 약함 | 높음 |
| 이메일 + 비밀번호 | 구현 단순 | 초기 요구사항에 이메일 없음 | 보통 |
| username + 비밀번호 | 사용자가 원하는 아이디 로그인과 가까움 | 별도 매핑 로직 필요 | 보통 |

**권장안:** MVP에서는 `전화번호 + 비밀번호` 로그인을 기본으로 하고, `username`은 앱 내 고유 아이디/표시용으로 저장한다. 추후 필요 시 username 로그인 플로우를 추가한다.

### F1-2. 선택 정보

회원가입 시 선택 입력 또는 가입 후 입력 가능하다.

- 주소
- 보유 라켓
- 사용 스트링
- 메인 텐션
- 크로스 텐션
- 플레이 스타일
- 선호 브랜드

### F1-3. 주소 정책

주소는 회원가입 필수값이 아니다. 다만 배송/퀵/택배 서비스를 이용하려면 최소 1개의 주소를 등록해야 한다.

주소는 `profiles`에 직접 저장하지 않고 `addresses` 테이블로 분리한다.

### F1-4. 계정 삭제

앱 내에서 계정 삭제 또는 탈퇴 요청을 시작할 수 있어야 한다.

- 사용자는 앱 설정에서 회원 탈퇴 요청 가능
- 탈퇴 요청 즉시 로그인/예약 제한
- 법적 보관 의무가 없는 개인정보는 정책 기간 후 삭제
- 주문/결제/환불 관련 기록은 법적 보관 기간에 맞게 분리 보관

### F1-5. 알림 수신 설정

사용자는 알림 수신 범위를 설정할 수 있어야 한다.

- 예약 알림: 필수 또는 강력 권장
- 작업 상태 알림: 권장
- 배송 상태 알림: 권장
- 마케팅/이벤트 알림: 선택 동의
- 야간 알림 수신 제한: 선택

---

## F2. 내 라켓 라이브러리

### F2-1. 기능 개요

사용자는 자신의 라켓을 여러 개 등록할 수 있다.

등록 정보:

- 브랜드
- 모델명
- 라켓 사진
- 그립 사이즈
- 무게
- 밸런스
- 메인 라켓 여부
- 메모

### F2-2. 스트링/텐션 조합

각 라켓별로 기본 스트링/텐션 조합을 저장할 수 있다.

- 메인 스트링
- 크로스 스트링
- 메인 텐션
- 크로스 텐션
- 하이브리드 여부
- 마지막 작업일
- 선호 작업 메모

### F2-3. 다시 예약 기능

사용자는 이전 작업 이력을 기반으로 “지난번과 같은 조합으로 예약하기”를 선택할 수 있다.

예시:

> Wilson Blade 98 + Solinco Hyper-G + 48/46 lbs 조합으로 다시 예약하기

---

## F3. 스트링 작업 예약

### F3-1. 예약 생성

사용자는 스트링 작업 예약 시 다음 정보를 입력 또는 선택한다.

- 작업할 라켓
- 사용할 스트링
- 메인 텐션
- 크로스 텐션
- 방문 희망일/시간 슬롯
- 수령 방식: 매장 방문, 배송, 퀵, 택배
- 특이사항 메모

기존 프로필/라켓 라이브러리에 저장된 값이 기본으로 선택되지만, 예약 화면에서 변경 가능해야 한다.

### F3-2. 예약 상태

스트링 작업 예약은 다음 상태값을 가진다.

```text
예약 요청 → 관리자 승인 대기 → 방문 대기 → 라켓 수령 → 작업 중 → 작업 완료 → 픽업 대기/배송 준비 → 완료
```

취소/거절 상태:

```text
사용자 취소 / 관리자 거절 / 관리자 일정 변경 요청 / 노쇼 / 환불 대기 / 환불 완료
```

### F3-3. 관리자 승인 정책

초기에는 사용자가 예약하면 바로 확정하지 않고 **관리자 승인 대기** 상태로 생성한다.

관리자는 다음 작업을 할 수 있다.

- 예약 승인
- 예약 거절
- 시간 변경 제안
- 사용자에게 메모 남기기
- 내부 메모 작성
- 예약 강제 취소

### F3-4. 예약 취소/변경 정책

정책 예시:

- 예약 24시간 전까지 사용자가 직접 취소 가능
- 예약 24시간 이내 취소는 관리자 확인 필요
- 당일 미방문은 노쇼 1회 기록
- 노쇼 3회 누적 시 일정 기간 예약 제한
- 결제 완료 예약은 취소/환불 정책에 따라 처리

정확한 시간 기준은 매장 운영 정책에 맞게 조정한다.

---

## F4. 라켓 시타 예약

### F4-1. 예약 생성

라켓 시타 예약은 스트링 작업과 다르게 다음 정보만 선택한다.

- 시타할 라켓
- 대여 또는 시타 희망일/시간
- 반납 예정일/시간
- 방문 방식
- 특이사항

라켓 시타 예약에서는 스트링/텐션을 선택하지 않는다.

### F4-2. 시타 라켓 상태 관리

`available BOOLEAN` 하나로 관리하지 않는다. 시타 라켓은 관리자 제어 상태와 예약 상태를 함께 고려한다.

권장 상태값:

- `active`: 시타 가능
- `inactive`: 비활성화
- `maintenance`: 점검 중
- `damaged`: 파손
- `sold`: 판매 완료
- `hidden`: 사용자에게 숨김

실제 예약 가능 여부는 다음 조건을 모두 만족해야 한다.

1. 라켓 상태가 `active`
2. `is_demo_enabled = true`
3. 해당 시간대에 겹치는 예약이 없음
4. 매장 영업시간 및 휴무일과 충돌하지 않음

### F4-3. 시타 전후 상태 체크

라켓 시타는 분쟁 방지를 위해 대여 전후 상태 체크를 포함한다.

- 대여 전 사진
- 반납 후 사진
- 스크래치/파손 여부
- 그립 상태
- 스트링 상태
- 관리자 메모
- 보증금 차감 여부

---

## F5. 영업시간, 휴무일, 예약 슬롯

### F5-1. 영업시간 설정

관리자는 요일별 영업시간을 설정할 수 있다.

- 요일
- 오픈 시간
- 마감 시간
- 휴무 여부

### F5-2. 임시 휴무일 설정

관리자는 특정 날짜를 휴무일로 지정할 수 있다.

예시:

- 공휴일
- 매장 휴가
- 대회 참가
- 내부 교육
- 긴급 휴무

### F5-3. 예약 슬롯 설정

스트링 작업과 라켓 시타는 서로 다른 슬롯 정책을 가질 수 있다.

- 스트링 작업 1건당 기본 소요시간
- 슬롯당 최대 예약 수
- 스트링 머신 개수
- 담당자 수
- 시타 라켓별 중복 예약 제한
- 특정 시간대 수동 마감

---

## F6. 스트링 카탈로그 및 재고

### F6-1. 스트링 목록 관리

관리자는 앱에서 이용 가능한 스트링 목록을 등록/수정/비활성화할 수 있다.

등록 정보:

- 브랜드
- 제품명
- 이미지
- 설명
- 게이지
- 색상
- 가격
- 추천 플레이 스타일
- 활성화 여부 `is_active`

### F6-2. 재고 관리

초기에는 수동 재고 관리로 시작하되, Phase 2에서 릴 단위 재고 관리를 도입한다.

필요 항목:

- 릴 단위 입고
- 남은 길이
- 작업 1회당 차감 길이
- 수동 보정
- 폐기/손실 기록
- 재고 부족 알림

### F6-3. 비활성화 정책

재고 부족 또는 판매 중단된 스트링은 `is_active = false`로 변경한다.

- 기존 예약에는 영향 없음
- 신규 예약 화면에서는 숨김
- 관리자는 비활성 사유를 기록할 수 있음

---

## F7. 상품 판매 및 결제

### F7-1. 상품 판매 범위

판매 카테고리:

- 테니스 라켓
- 테니스 스트링
- 그립
- 댐퍼
- 테니스공
- 피클볼 패들
- 피클볼 공
- 가방
- 액세서리

### F7-2. 상품 활성화/비활성화

상품에는 반드시 `is_active` 또는 `status` 값을 둔다.

- 판매중
- 품절
- 숨김
- 판매중지
- 입고예정

### F7-3. 결제 정책

한국 시장 MVP 기준으로 결제 스택은 **토스페이먼츠 우선**으로 한다.

- 물리적 상품 결제: 토스페이먼츠
- 스트링 작업비 결제: 토스페이먼츠
- 라켓 시타 보증금: Phase 2 이후 검토
- 해외 판매/외국인 고객 증가 시 Stripe 추가 검토

### F7-4. App Store / Google Play 결제 정책 대응

본 앱의 초기 결제 대상은 물리적 상품 및 오프라인 서비스다. 따라서 기본 결제 수단은 외부 PG를 사용한다.

단, 향후 다음 기능을 도입할 경우 App Store/Google Play 결제 정책을 별도로 검토한다.

- 앱 내 디지털 콘텐츠 판매
- 프리미엄 AI 추천 기능 유료화
- 앱 내 디지털 구독
- 온라인 전용 강의/콘텐츠

---

## F8. 관리자 기능

### F8-1. 모바일 관리자 기능

MVP에서는 관리자 기능을 앱 안에 포함할 수 있다.

필수 기능:

- 예약 목록 확인
- 예약 승인/거절/변경
- 작업 상태 변경
- 스트링 목록 관리
- 시타 라켓 관리
- 사용자 제재
- 알림 발송

### F8-2. 웹 관리자 패널

Phase 2부터 Next.js 기반 웹 관리자 패널을 권장한다.

웹으로 분리하면 좋은 기능:

- 상품 등록/수정
- 스트링 재고 관리
- 예약 캘린더 관리
- 주문/환불 관리
- 관리자 권한 설정
- 매출/예약 통계
- 앱 메뉴 활성화/비활성화
- 이벤트/공지 발송

### F8-3. 관리자 알림센터

관리자는 다음 이벤트를 알림센터에서 확인할 수 있어야 한다.

- 신규 예약 발생
- 예약 취소
- 예약 시간 변경 요청
- 스트링 재고 부족
- 시타 라켓 반납 지연
- 배송 요청 발생
- 노쇼 위험 사용자 예약
- 결제 실패
- 환불 요청

---

## F9. 알림 정책

### F9-1. 사용자 알림

- 예약 요청 접수
- 예약 승인/거절
- 예약 시간 변경 제안
- 방문 전 리마인드
- 라켓 수령 완료
- 작업 시작
- 작업 완료
- 배송 시작
- 배송 완료
- 리뷰 요청
- 스트링 교체 주기 알림

### F9-2. 마케팅 알림

마케팅 알림은 사용자의 별도 동의를 받아야 한다.

예시:

- 신상 스트링 출시
- 라켓 할인 이벤트
- 피클볼 용품 입고
- 특정 브랜드 보유자 대상 이벤트

### F9-3. 알림 수신 설정

사용자는 다음 항목을 켜고 끌 수 있어야 한다.

- 예약/작업 알림
- 배송 알림
- 스트링 교체 알림
- 이벤트/마케팅 알림
- 야간 알림 제한

---

## 6. 추가 기능 우선순위 재정리

| 기능 | 기존 판단 | v2 판단 | 이유 |
|---|---|---|---|
| 구독 멤버십 | 보류 | 보류 유지 | 결제/포인트/고객 데이터가 쌓인 후 검토 |
| 중고거래 마켓 | 보류 | 삭제 권고 | 분쟁/에스크로/배송/신고 등 별도 앱 수준 |
| QR 코드 라켓 태깅 | 보류 | Phase 2 격상 | 라켓 혼동 방지 효과가 커서 운영 실수 감소 |
| 파트너 매칭 | 보류 | 보류 유지 | 위치/신고/차단/채팅 등 커뮤니티 운영 부담 큼 |
| 레슨/코치 예약 | 보류 | Phase 3 검토 | 수익 모델과 연결되지만 정산/책임 구조 필요 |
| 클럽/동호회 | 보류 | 삭제 또는 공지 게시판 수준 축소 | 별도 커뮤니티 앱 수준의 리소스 필요 |
| AI 챗봇 | 보류 | Phase 4 | 답변 품질과 프롬프트 관리 비용 발생 |
| 포인트/적립금 | 보류 | Phase 2 후반 | 결제 이후 재방문 유도에 효과적 |
| 친구 초대 리워드 | 보류 | 보류 유지 | 부정 사용 방지 로직 필요 |
| Apple Watch 알림 | P3 | 삭제 권고 | 초기 실사용 대비 구현 비용 큼 |
| 다크모드 | P2 | 디자인 시스템 단계에서 반영 가능 | 구현 비용이 크지 않으면 초기에 고려 가능 |

---

## 7. 데이터 모델 초안

아래 스키마는 실제 개발 전 ERD로 다시 정리해야 한다. 다만 v1.0의 문제였던 `address` 단일 저장, `tension` 단일값, `available BOOLEAN` 단순화, `is_active` 누락 문제를 보완한 구조다.

```sql
-- 1. 사용자 프로필
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- super_admin | admin | user
  status TEXT NOT NULL DEFAULT 'active', -- active | suspended | deleted_pending
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. 주소록
addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  recipient_name TEXT,
  phone TEXT,
  postal_code TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- 3. 알림 수신 설정
notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  booking_notifications BOOLEAN DEFAULT true,
  delivery_notifications BOOLEAN DEFAULT true,
  string_life_notifications BOOLEAN DEFAULT true,
  marketing_notifications BOOLEAN DEFAULT false,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME
);

-- 4. 관리자 권한
admin_permissions (
  admin_id UUID PRIMARY KEY REFERENCES profiles(id),
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

-- 5. 앱 메뉴/기능 설정
app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP DEFAULT now()
);

-- 6. 사용자 라켓
user_rackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  brand TEXT,
  model TEXT,
  grip_size TEXT,
  weight INT,
  balance TEXT,
  photo_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  memo TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 7. 스트링 카탈로그
string_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  gauge TEXT,
  color TEXT,
  image_url TEXT,
  description TEXT,
  price INT,
  recommended_style TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 8. 사용자 스트링 세팅
user_string_setups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  racket_id UUID REFERENCES user_rackets(id),
  main_string_id UUID REFERENCES string_catalog(id),
  cross_string_id UUID REFERENCES string_catalog(id),
  tension_main INT,
  tension_cross INT,
  is_hybrid BOOLEAN DEFAULT false,
  memo TEXT,
  last_strung_at TIMESTAMP
);

-- 9. 스트링 재고 로트
string_inventory_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  string_id UUID REFERENCES string_catalog(id),
  initial_length_m NUMERIC,
  remaining_length_m NUMERIC,
  unit_cost INT,
  received_at TIMESTAMP,
  status TEXT DEFAULT 'active', -- active | depleted | discarded
  memo TEXT
);

-- 10. 영업시간
shop_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL, -- 0 Sunday ~ 6 Saturday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false
);

-- 11. 임시 휴무일
closed_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES profiles(id)
);

-- 12. 예약 슬롯
booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL, -- stringing | demo
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INT DEFAULT 1,
  reserved_count INT DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT
);

-- 13. 스트링 작업 예약
service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  racket_id UUID REFERENCES user_rackets(id),
  main_string_id UUID REFERENCES string_catalog(id),
  cross_string_id UUID REFERENCES string_catalog(id),
  tension_main INT,
  tension_cross INT,
  slot_id UUID REFERENCES booking_slots(id),
  delivery_method TEXT, -- store_pickup | local_quick | parcel
  address_id UUID REFERENCES addresses(id),
  status TEXT DEFAULT 'requested',
  user_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 14. 시타 라켓
demo_rackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT,
  model TEXT,
  grip_size TEXT,
  weight INT,
  head_size TEXT,
  photo_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'active', -- active | inactive | maintenance | damaged | sold | hidden
  is_demo_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 15. 시타 예약
demo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  demo_racket_id UUID REFERENCES demo_rackets(id),
  slot_id UUID REFERENCES booking_slots(id),
  start_time TIMESTAMP,
  expected_return_time TIMESTAMP,
  actual_return_time TIMESTAMP,
  status TEXT DEFAULT 'requested',
  user_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 16. 예약 상태 변경 로그
booking_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT, -- service | demo
  booking_id UUID,
  previous_status TEXT,
  new_status TEXT,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  changed_at TIMESTAMP DEFAULT now()
);

-- 17. 시타 라켓 상태 체크
racket_condition_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_booking_id UUID REFERENCES demo_bookings(id),
  check_type TEXT, -- before_rental | after_return
  photo_urls TEXT[],
  scratch_notes TEXT,
  string_condition TEXT,
  grip_condition TEXT,
  damage_detected BOOLEAN DEFAULT false,
  deposit_deduction INT DEFAULT 0,
  checked_by UUID REFERENCES profiles(id),
  checked_at TIMESTAMP DEFAULT now()
);

-- 18. 상품
products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT,
  name TEXT,
  description TEXT,
  price INT,
  stock INT,
  images TEXT[],
  status TEXT DEFAULT 'active', -- active | out_of_stock | hidden | discontinued | coming_soon
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 19. 주문
orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  address_id UUID REFERENCES addresses(id),
  total_amount INT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 20. 주문 상세
order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INT,
  unit_price INT,
  total_price INT
);

-- 21. 결제
payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  provider TEXT, -- toss | stripe
  provider_payment_key TEXT,
  amount INT,
  status TEXT, -- requested | paid | failed | cancelled | refunded
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 22. 환불
refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  amount INT,
  reason TEXT,
  status TEXT,
  requested_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now()
);

-- 23. 포인트 장부
points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  change_amount INT,
  reason TEXT,
  related_order_id UUID REFERENCES orders(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 24. 리뷰
reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  target_type TEXT, -- demo_racket | string | product | service
  target_id UUID,
  rating INT,
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 25. 알림
notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT,
  body TEXT,
  notification_type TEXT,
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 26. 관리자 행동 로그
administrator_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  before_value JSONB,
  after_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## 8. RLS 및 보안 원칙

### 8.1 RLS 기본 원칙

Supabase의 public schema 테이블은 RLS 활성화를 전제로 한다.

기본 원칙:

1. 사용자는 자신의 `profiles`, `addresses`, `user_rackets`, `bookings`, `orders`만 조회/수정 가능
2. 일반 사용자는 관리자 테이블을 조회할 수 없음
3. 관리자는 부여받은 권한 범위 안에서만 데이터 변경 가능
4. Super Admin만 관리자 권한 변경 가능
5. 모든 중요 관리자 행동은 audit log에 기록

### 8.2 관리자 보안

- 관리자 계정은 2FA/MFA 필수 권장
- 관리자 권한 변경 시 재인증 요구
- 관리자 권한 변경 내역 audit log 기록
- 관리자 세션 만료 시간 단축
- IP 화이트리스트는 모바일 환경에서는 기본 정책으로 사용하지 않음
- 웹 관리자 패널 도입 시 사무실 고정 IP 제한을 선택적으로 검토

### 8.3 비밀번호 초기화 정책

관리자가 사용자의 비밀번호를 직접 확인하거나 평문으로 재설정하지 않는다.

권장 방식:

- 사용자 본인 인증 후 재설정
- SMS/이메일 기반 재설정 링크
- 관리자 요청 시 “비밀번호 재설정 링크 발송”만 가능

---

## 9. 로드맵

### Phase 0. 설계 및 기반 구축: 2주

- 요구사항 확정
- ERD 작성
- Supabase 프로젝트 생성
- Auth 방식 결정
- RLS 초안 설계
- 디자인 시스템 초안
- 앱 정보구조 및 화면흐름도 작성

### Phase 1. MVP: 8~10주

목표: 실제 예약 운영이 가능한 앱 출시 후보 버전 제작

범위:

- 회원가입/로그인
- 프로필/주소/알림 설정
- 내 라켓 라이브러리
- 스트링 카탈로그 조회
- 스트링 작업 예약
- 라켓 시타 예약
- 영업시간/휴무일 설정
- 예약 슬롯
- 관리자 예약 승인/거절/변경
- 관리자 스트링/시타 라켓 관리
- 사용자 제재
- 앱 내 계정 삭제
- 푸시 알림 기본
- RLS/audit log

### Phase 1.5. 운영 안정화: 3~4주

- 예약 취소/노쇼 자동화
- 작업 상태 트래킹 고도화
- 스트링 교체 주기 알림
- 지난 조합으로 다시 예약
- 리뷰 요청
- 관리자 알림센터

### Phase 2. 커머스 및 운영 자동화: 6~8주

- 상품 카탈로그
- 장바구니/주문
- 토스페이먼츠 결제
- 배송/픽업 관리
- 포인트/적립금
- 스트링 릴 단위 재고
- QR 코드 라켓 태깅
- Next.js 관리자 웹 패널
- 매출/예약 통계

### Phase 3. 수익 모델 확장: 6주 이상

- 레슨/코치 예약 모듈
- 코치 프로필/승인
- 코치 일정 관리
- 레슨 결제/정산 구조
- 시타 후 구매 전환 기능
- 쿠폰/이벤트

### Phase 4. 고도화: 지속

- AI 기반 스트링 추천
- AI 챗봇 FAQ
- 구독 멤버십
- 친구 초대 리워드
- 다국어
- 웹 쇼핑몰 확장

---

## 10. 성공 지표

### 10.1 MVP 지표

- 회원가입 전환율
- 예약 생성 수
- 예약 승인율
- 예약 취소율
- 노쇼율
- 작업 완료율
- 관리자 처리 시간
- 푸시 알림 클릭률

### 10.2 커머스 지표

- 주문 수
- 결제 전환율
- 객단가
- 재구매율
- 포인트 사용률
- 시타 후 구매 전환율

### 10.3 리텐션 지표

- 7일 리텐션
- 30일 리텐션
- 스트링 재교체율
- 지난 조합 재예약 사용률
- 리뷰 작성률

---

## 11. 리스크 및 대응

| 리스크 | 설명 | 대응 |
|---|---|---|
| MVP 범위 과다 | 기능을 많이 넣으면 출시 지연 | 예약/관리자/라켓/스트링 중심으로 제한 |
| RLS 설계 미흡 | 사용자 데이터 노출 위험 | 테이블별 RLS 정책 필수 작성 |
| 관리자 계정 탈취 | 예약/유저/결제 정보 변경 위험 | 관리자 MFA, audit log, 재인증 |
| 예약 중복 | 같은 라켓/시간대 중복 예약 가능 | booking_slots + 예약 충돌 검증 |
| 시타 라켓 분쟁 | 파손/스크래치 책임 문제 | 대여 전후 상태 체크 기록 |
| 노쇼 | 작업 시간 낭비 | 노쇼 카운트, 예약 제한, 추후 보증금 검토 |
| 스트링 재고 오차 | 앱 재고와 실제 재고 불일치 | 수동 보정, 릴 단위 관리, 부족 알림 |
| 결제 정책 위반 | 디지털 상품 결제 정책 혼동 | 물리 상품/오프라인 서비스는 PG, 디지털 구독은 별도 검토 |
| 관리자 모바일 UX 불편 | 상품/재고/예약 관리가 앱에서 불편 | Phase 2 Next.js 관리자 웹 도입 |
| 알림 피로도 | 과도한 푸시로 이탈 | 알림 수신 설정 제공 |

---

## 12. 삭제 또는 축소 권고 기능

### 12.1 삭제 권고

#### 중고거래 마켓

삭제 권고. 에스크로, 사기 방지, 신고, 분쟁, 배송, 환불까지 고려하면 별도 서비스 수준이다.

#### Apple Watch 알림

초기 사용 빈도 대비 개발 비용이 크다. 삭제 권고.

#### 클럽/동호회 풀 기능

채팅, 공지, 캘린더, 멤버 관리까지 들어가면 별도 커뮤니티 앱 수준이 된다. 삭제하거나 단순 공지 게시판 수준으로 축소한다.

### 12.2 보류 유지

#### 파트너 매칭

위치 기반, 신고/차단, 채팅, 개인정보 이슈가 크므로 보류한다.

#### AI 챗봇

API 연동 자체보다 응답 품질 관리와 운영 비용이 문제다. Phase 4에서 검토한다.

#### 구독 멤버십

결제/포인트/리텐션 데이터가 쌓인 후 도입한다. 디지털 혜택이 포함될 경우 스토어 결제 정책 검토가 필요하다.

### 12.3 격상 권고

#### QR 코드 라켓 태깅

운영 실수를 줄이는 기능이므로 Phase 2로 격상한다.

#### 포인트/적립금

결제 기능 도입 후 재방문 유도 기능으로 Phase 2 후반에 반영한다.

---

## 13. 최종 우선순위

### 반드시 먼저 할 것

1. 회원가입/로그인 구조 확정
2. RLS 기반 권한 설계
3. 라켓 라이브러리/스트링 세팅 구조 설계
4. 스트링 작업 예약 플로우
5. 라켓 시타 예약 플로우
6. 영업시간/휴무일/예약 슬롯 관리
7. 관리자 예약 승인/거절/변경
8. 계정 삭제/알림 수신 설정

### 이후 바로 할 것

1. 결제
2. 주문/배송
3. 포인트
4. QR 라켓 태깅
5. 스트링 재고 관리
6. 관리자 웹 패널

### 나중에 할 것

1. 레슨/코치 예약
2. AI 추천
3. 구독 멤버십
4. 친구 초대
5. 웹 쇼핑몰 확장

---

## 14. 다음 단계

이 PRD 다음 단계는 다음 산출물로 이어지는 것이 좋다.

1. **앱 화면 흐름도**
   - 사용자 앱
   - 관리자 앱
   - 관리자 웹

2. **ERD 상세 설계**
   - 테이블 관계
   - 인덱스
   - RLS 정책
   - Edge Function 필요 지점

3. **MVP WBS**
   - 기능별 작업 분해
   - 예상 개발 기간
   - 우선순위

4. **와이어프레임**
   - 회원가입
   - 내 라켓
   - 스트링 예약
   - 라켓 시타 예약
   - 관리자 예약 관리

5. **스토어 출시 체크리스트**
   - 앱 내 계정 삭제
   - 개인정보 처리방침
   - 위치/카메라/알림 권한 안내
   - 결제 정책
   - 고객센터/문의 채널

---

## 15. 참고 근거

- Expo EAS Submit: App Store/Google Play 제출 자동화 지원
- Supabase RLS: public schema 테이블에는 RLS 활성화 필요
- Supabase Password Auth: 이메일 또는 전화번호 기반 비밀번호 로그인 지원
- Expo Camera: QR/바코드 스캔 기능 제공
- Apple App Store: 계정 생성 앱은 앱 내 계정 삭제 시작 기능 필요
- Google Play Billing: 디지털 상품 결제용이며 물리적 상품/서비스는 별도 결제 사용
- Toss Payments: 한국 시장 간편결제 및 일반 결제 연동 후보

---

> **문서 끝**  
> v2.0은 “기능 아이디어 정리본”이 아니라 “실제 출시 가능한 운영형 PRD”를 목표로 재구성한 버전이다.
