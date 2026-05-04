# Google Play 배포 준비

기준일: 2026-05-04

## 완료된 설정

- Android application id: `com.yellowball.mobile`
- Android versionCode: `1`
- EAS production build profile: `eas.json`의 `build.production`
- Android production artifact type: `app-bundle`
- EAS submit production profile: 내부 트랙, draft 릴리스
- Privacy Policy canonical URL: `https://lazytoy.github.io/privacy/`
- Privacy Policy source document: `docs/legal/privacy-policy.md`

## 배포 전 확인

- `https://lazytoy.github.io/privacy/`에 `docs/legal/privacy-policy.md` 내용을 공개합니다.
- EAS project 연결 후 `extra.eas.projectId`가 생성되었는지 확인합니다.
- Google Play Console 앱 콘텐츠에 개인정보 처리방침 URL을 등록합니다.
- production 환경 변수는 `.env.local`이 아니라 EAS Secret으로 등록합니다.
- Android 빌드는 `eas build --platform android --profile production`으로 검증합니다.

## 보안 후속 작업 (완료)

아래 SECURITY DEFINER RPC에 대해 anon EXECUTE를 명시적으로 revoke했습니다 (`025_revoke_anon_execute_rpcs.sql`).

- ✅ `admin_update_service_booking_status`
- ✅ `admin_update_demo_booking_status`
- ✅ `create_service_booking_transaction`
- ✅ `create_demo_booking_transaction`
- ✅ `user_cancel_service_booking`
- ✅ `record_service_booking_no_show`
- ✅ `admin_suspend_user_transaction`
- ✅ `request_profile_account_deletion`
- ✅ `update_profile_push_token`
- ✅ `admin_set_profile_role`
- ✅ `admin_set_profile_status`
- ✅ `has_admin_role`, `has_super_admin_role`, `has_booking_manager_role`

## 계정 삭제 정책 (완료)

- 30일 대기 기간 후 자동 개인정보 삭제 (`024_account_deletion_cleanup.sql`)
- Privacy Policy에 30일 삭제 정책 명시 (`docs/legal/privacy-policy.md`)
- 앱 내 계정 삭제 화면에 30일 안내 표시 (`account-deletion.tsx`)

