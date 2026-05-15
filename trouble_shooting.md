# YellowBall 모바일 UI 트러블슈팅

작성일: 2026-05-08

이 문서는 `npx expo run:android`로 설치한 실제 Android 앱에서 웹/에뮬레이터와 다르게 UI가 깨진 문제를 추적한 기록이다. 기준 문서는 2026년 5월 현재 React Native 공식 문서이며, 특히 Flexbox layout, `flexWrap`, `width`, `flexBasis`, 숫자 `gap`, `Pressable`, `ImageBackground`, `borderRadius`/`overflow` 동작을 확인했다.

참고한 공식 문서:

- React Native Flexbox: https://reactnative.dev/docs/flexbox
- React Native Layout Props: https://reactnative.dev/docs/layout-props
- React Native Pressable: https://reactnative.dev/docs/pressable
- React Native ImageBackground: https://reactnative.dev/docs/imagebackground
- React Native View Style Props: https://reactnative.dev/docs/view-style-props
- Expo SDK 54 문서(Context7 조회): `Pressable` 기반 버튼 예제에서 wrapper와 실제 `Pressable` 모두 명시적인 크기/정렬 스타일을 갖는 패턴을 확인했다.

## 1. 로그인 페이지 로그인 버튼 배경이 사라짐

### 증상

웹에서는 로그인 버튼이 초록색 배경과 흰색 텍스트로 정상 표시되었다. 실제 Android 설치 앱에서는 버튼 배경이 사라지고 흰색 `로그인` 텍스트만 거의 보이지 않는 상태로 표시되었다.

### 원인 분석

로그인 화면의 주요 버튼이 공통 `Button` 컴포넌트 경로를 타고 있었다. 웹에서는 CSS/React Native Web 스타일 병합이 의도대로 동작했지만, 실제 Android에서는 공통 버튼의 variant 스타일과 외부 `style` 전달이 겹치면서 배경색이 최종 native style에 안정적으로 남지 않는 케이스가 발생했다.

특히 이 문제는 단순히 `style={{ backgroundColor: ... }}`를 한 번 더 주는 방식으로는 재발 가능성이 있었다. 공통 컴포넌트 내부의 Pressable style callback, disabled/loading 상태, variant 스타일이 합쳐지는 순서에 따라 실제 Android에서 배경이 누락될 수 있기 때문이다.

### 해결 방법

로그인 기본 버튼은 공통 `Button` 의존을 끊고 화면 내부에서 직접 `Pressable`로 렌더링하도록 변경했다.

적용 위치:

- `app/(auth)/login.tsx`

핵심 처리:

- `Pressable`에 `backgroundColor`, `borderColor`, `borderRadius`, `height`, `minHeight`, `justifyContent`, `alignItems`를 직접 지정했다.
- loading 상태는 `ActivityIndicator`를 버튼 내부에 직접 배치했다.
- 텍스트 색상은 `lightColors.primaryForeground.hex`로 고정했다.
- disabled 상태는 배경 제거가 아니라 `opacity`만 낮추도록 분리했다.

결과:

- 실제 Android 설치 앱에서도 초록색 버튼 배경이 유지된다.
- 로그인 버튼의 loading/disabled 상태에서도 레이아웃이 흔들리지 않는다.

## 2. Expo Go 실제 기기에서 Google/Kakao 로그인 버튼 내부 콘텐츠가 위로 뜸

### 증상

`npx expo start --clear`로 Metro를 실행하고 QR 코드로 Galaxy S25의 Expo Go에서 열었을 때, 로그인 화면의 Google/Kakao 소셜 로그인 버튼 UI가 깨졌다.

웹과 에뮬레이터 스크린샷에서는 정상적으로 보였지만 실제 기기에서는 다음처럼 표시되었다.

- Google 버튼은 흰색 버튼 테두리만 남고 `G` 아이콘과 텍스트가 버튼 위쪽으로 떠 보였다.
- Kakao 버튼은 노란색 버튼 배경은 아래에 있는데 `K` 아이콘이 버튼 밖 위쪽에 떠 있고 텍스트가 보이지 않았다.
- 이메일 로그인 버튼과 입력 필드는 정상이라, 화면 전체 레이아웃보다는 소셜 버튼 내부 레이아웃 문제로 좁혀졌다.

### 접근 방법

1. 실제 기기 스크린샷과 웹/에뮬레이터 스크린샷을 비교해 "버튼 표면은 제자리에 있고 내부 콘텐츠만 이탈한다"는 사실을 먼저 확인했다.
2. `rg`로 `카카오`, `구글`, `social`, `oauth`, `로그인` 키워드를 검색해 관련 구현을 `app/(auth)/login.tsx`, `app/(auth)/register.tsx`로 좁혔다.
3. Context7 MCP로 Expo SDK 54와 React Native 0.81 공식 문서를 확인했다. Expo 예제는 wrapper뿐 아니라 실제 `Pressable`에도 `width: '100%'`, `height: '100%'`, `alignItems`, `justifyContent` 같은 크기/정렬 스타일을 직접 지정하는 패턴을 사용한다.
4. Sequential Thinking으로 가설을 세웠다. 바깥 `View`만 48px 높이/테두리/배경을 갖고 실제 터치 영역인 `Pressable`에는 크기 스타일이 없어서, Android 실제 기기에서 자식 row의 기준 높이가 안정적으로 잡히지 않는다는 가설이다.
5. 이미 있던 회귀 테스트를 먼저 실행했다. `google-social-login-surface`/`kakao-social-login-surface` testID와 `Pressable` 크기 스타일을 기대하는 테스트가 실패해 RED를 확인했다.

### 원인 분석

소셜 버튼 구조는 다음처럼 되어 있었다.

- 바깥 `View`: `height: 48`, `borderWidth`, `backgroundColor`를 가짐
- 안쪽 `Pressable`: 별도 `style` 없음
- `Pressable` 내부 row: `flex: 1`, `height: 48`, `flexDirection: 'row'`

웹/에뮬레이터에서는 이 구조가 우연히 정상처럼 보였지만, 실제 Android 기기에서는 스타일 없는 `Pressable`이 중간 레이어가 되면서 내부 row가 바깥 버튼 표면과 같은 높이 기준을 안정적으로 공유하지 못했다.

즉, 깨진 것은 색상이나 OAuth 로직이 아니라 "표면을 그리는 View"와 "콘텐츠를 배치하는 Pressable"의 layout boundary가 분리된 것이었다.

또한 Android 텍스트는 기본 font padding 때문에 작은 버튼 안에서 세로 정렬이 미묘하게 흔들릴 수 있다. 소셜 버튼처럼 높이가 고정된 컴팩트 UI에서는 `includeFontPadding: false`, 명시적 `lineHeight`가 안정성에 도움이 된다.

### 해결 방법

로그인/회원가입 화면의 소셜 버튼에 동일하게 적용했다.

적용 위치:

- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`

핵심 처리:

- 바깥 표면 `View`에 `height: 48`, `minHeight: 48`, `overflow: 'hidden'`, `zIndex: 1`을 명시했다.
- 실제 `Pressable`에 `flex: 1`, `height: '100%'`, `minHeight: 48`, `width: '100%'`, `justifyContent: 'center'`, `position: 'relative'`, `overflow: 'hidden'`을 지정했다.
- 내부 row는 `height: '100%'`, `minHeight: 48`, `width: '100%'`를 갖게 했다.
- Google/Kakao 라벨은 `includeFontPadding: false`, `lineHeight: 20`, `maxWidth: '76%'`, `numberOfLines={1}`, `adjustsFontSizeToFit`으로 버튼 내부에 머물게 했다.
- 아이콘 텍스트도 `includeFontPadding: false`와 명시적 `lineHeight`를 부여했다.
- 테스트에서 표면 `View`를 직접 찾을 수 있도록 `google-social-login-surface`, `kakao-social-login-surface`, `google-social-signup-surface`, `kakao-social-signup-surface` testID를 추가했다.

### 검증

자동 검증:

- 먼저 `npm run test -- loginScreen.test.tsx registerScreen.test.tsx --runInBand`를 실행해 관련 테스트가 실패하는 것을 확인했다.
- 수정 후 같은 명령을 다시 실행해 20개 테스트가 모두 통과하는 것을 확인했다.

실제 기기 검증:

1. `adb devices`로 `SM-S931N` Galaxy S25 연결을 확인했다.
2. 기존 8081/8082 포트 충돌 때문에 `npx expo start --clear --port 8084`로 Metro를 새로 띄웠다.
3. USB 연결 검증을 위해 `adb reverse tcp:8084 tcp:8084`를 설정했다.
4. `adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8084 host.exp.exponent`로 Expo Go를 직접 열었다.
5. `adb shell screencap -p`와 `adb pull`로 실제 기기 스크린샷을 가져와 확인했다.

최종 캡처:

- `yellowball_login_fix_8084_1.png`

결과:

- Google 버튼의 `G` 아이콘과 `구글 아이디로 로그인` 텍스트가 흰색 버튼 내부 중앙에 정렬되었다.
- Kakao 버튼의 `K` 아이콘과 `카카오톡으로 로그인하기` 텍스트가 노란색 버튼 내부 중앙에 정렬되었다.
- 실제 Expo Go 기기 화면에서도 웹/에뮬레이터와 같은 버튼 형태로 표시되었다.

### 다음에 같은 문제가 생기면

- 버튼 배경/테두리는 정상인데 텍스트나 아이콘만 떠 있으면 먼저 `Pressable` 자체에 높이/폭 스타일이 있는지 확인한다.
- 바깥 `View`에만 `height`를 주고 안쪽 `Pressable`에는 스타일이 없는 구조를 의심한다.
- Android 실제 기기에서는 wrapper와 touch target 모두에 `height`, `minHeight`, `width: '100%'`, `overflow: 'hidden'`, `justifyContent`를 명시한다.
- 텍스트가 버튼 안에서 위아래로 밀리면 `includeFontPadding: false`와 명시적 `lineHeight`를 확인한다.
- 웹/에뮬레이터가 정상이어도 실제 기기에서 `adb screencap`으로 반드시 확인한다.
- `npx expo start --clear` 실행 시 포트 충돌이 있으면 `--port <빈 포트>`를 명시하고, 실제 기기 검증에서는 `adb reverse tcp:<port> tcp:<port>`를 같이 설정한다.

## 3. 샵 상품 카드가 한 줄에 1개만 표시됨

### 증상

웹에서는 상품 카드가 한 row에 2개씩 정상 정렬되었다. 실제 Android 설치 앱에서는 상품 카드가 한 row에 1개씩만 표시되거나 카드 폭이 의도보다 크게 잡혔다.

### 원인 분석

상품 카드가 공통 `RowButton` 계열 스타일의 영향을 받는 구조였다. 공통 Row 계열 컴포넌트는 일반 목록 버튼에 맞춰 `width: '100%'`, row 정렬, stretch 성격을 갖기 쉽다. 이 구조에서 상품 카드처럼 2-column grid가 필요한 요소에 `width`, `flexBasis`, `maxWidth`를 외부 style로 넘기면 웹에서는 정상처럼 보이지만 Android native layout에서는 공통 스타일이 카드 폭 계산을 덮거나, 부모 flex wrapping과 충돌할 수 있었다.

또한 퍼센트 기반 폭만 사용하면 실제 기기의 dp 폭, safe area, padding, gap 계산에 따라 2-column이 안정적으로 유지되지 않을 수 있다.

### 해결 방법

상품 카드를 공통 `RowButton` 경로가 아닌 직접 `Pressable`로 렌더링하고, `useWindowDimensions()`에서 얻은 실제 화면 폭으로 숫자 카드 폭을 계산했다.

적용 위치:

- `app/(tabs)/shop.tsx`
- `src/utils/responsiveLayout.ts`

핵심 처리:

- `visibleContentWidth = windowWidth - horizontalPadding * 2`로 실제 콘텐츠 폭을 계산했다.
- `getTwoColumnItemWidth(visibleContentWidth, productCardGap)`로 2-column 카드 폭을 숫자로 산출했다.
- 각 상품 카드에 `width`, `flexBasis`, `maxWidth`를 같은 숫자로 명시했다.
- 첫 번째 column 카드에는 `marginRight`를 주고, 두 번째 column에는 주지 않도록 했다.
- 카드 기본 스타일에는 `flexGrow: 0`, `flexShrink: 0`, `minWidth: 0`, `overflow: 'hidden'`을 둬서 Android에서 폭이 늘어나거나 줄어드는 상황을 막았다.

결과:

- 실제 Android 설치 앱에서도 상품 카드가 한 row에 2개씩 배치된다.
- 이미지/가격/카테고리 정보가 카드 폭 안에서 유지된다.

## 4. 마이페이지 하단 메뉴 UI가 세로로 깨짐

### 증상

웹에서는 마이페이지 메뉴가 아이콘, 라벨, chevron이 한 줄로 정렬되었다. 실제 Android 설치 앱에서는 아이콘과 텍스트, 화살표가 카드 왼쪽에 세로로 쌓이거나 카드 내부가 비정상적으로 커져 보였다.

### 원인 분석

마이페이지 메뉴도 공통 `RowButton`을 사용하면서 목록 버튼용 기본 스타일과 메뉴 전용 row layout이 충돌했다. 웹에서는 외부 style이 기대한 대로 보였지만, Android native에서는 Pressable style callback과 style flatten 순서, 공통 row 스타일의 폭/정렬값 때문에 자식이 한 줄 row로 고정되지 않았다.

메뉴는 상품 카드와 달리 `width: '100%'`가 필요하지만, 내부 자식은 반드시 `flexDirection: 'row'`, `alignItems: 'center'`, 라벨 `flex: 1`, 아이콘/chevron `flexShrink: 0`이 보장되어야 한다.

### 해결 방법

마이페이지 메뉴 항목은 공통 `RowButton` 대신 직접 `Pressable`로 렌더링했다.

적용 위치:

- `app/(tabs)/me.tsx`

핵심 처리:

- 메뉴 카드에는 `width: '100%'`, `overflow: 'hidden'`, `padding: 0`을 명시했다.
- 메뉴 항목에는 `alignSelf: 'stretch'`, `flexDirection: 'row'`, `alignItems: 'center'`, `minHeight`, `minWidth: 0`을 명시했다.
- 아이콘 슬롯은 `flexShrink: 0`으로 고정했다.
- 메뉴 라벨은 `flex: 1`, `flexShrink: 1`, `minWidth: 0`, `numberOfLines={1}`로 처리했다.
- chevron은 row의 마지막 요소로 유지했다.

결과:

- 실제 Android 설치 앱에서도 메뉴 항목이 한 줄로 정렬된다.
- 아이콘, 텍스트, badge, chevron이 서로 겹치거나 세로로 쌓이지 않는다.

### 추가 보강: 마이페이지 요약 통계 카드가 실제 기기에서 왼쪽으로 몰림

2026-05-14에 같은 계열의 문제가 마이페이지 요약 통계 카드에서도 다시 발생했다. 웹/에뮬레이터에서는 `스트링 작업`, `데모`, `라켓`, `진행 중` 네 칸이 카드 전체 폭에 고르게 퍼졌지만, 실제 Android 기기에서는 아이콘과 숫자/라벨이 카드 왼쪽으로 몰려 보였다.

처음에는 각 `Pressable`에 `flexBasis`, `width`, `maxWidth`를 주거나 `useWindowDimensions()`로 숫자 폭을 계산하는 방식도 시도할 수 있다. 하지만 실제 기기에서는 `Pressable` 자체가 접근성/터치 bounds 계산 과정에서 내부 콘텐츠 폭만큼 접히는 경우가 있어, 보이는 칸이 여전히 왼쪽으로 붙을 수 있다.

이 경우에는 통계 칸을 다음처럼 분리하는 편이 안정적이다.

- 바깥 통계 카드는 `width: '100%'`, `flexDirection: 'row'`, `overflow: 'hidden'`을 유지한다.
- 각 통계 칸은 `View`로 만들고 `flexBasis: '25%'`, `width: '25%'`, `maxWidth: '25%'`, `flexGrow: 0`, `flexShrink: 0`, `minWidth: 0`을 지정한다.
- 실제 터치는 칸 내부의 `Pressable`이 맡되, `StyleSheet.absoluteFillObject`로 전체 칸을 덮게 한다.
- 값/라벨 텍스트에는 `width: '100%'`, `textAlign: 'center'`, `includeFontPadding: false`, 명시적 `lineHeight`를 둔다.

이번 수정은 `app/(tabs)/me.tsx`의 통계 카드에 적용했다. 실제 Galaxy 기기에서 `uiautomator dump`로 다음 bounds를 확인했다.

- `me-stats-grid [53,782][1028,1040]`
- `me-stat-wrench-column [87,816][313,1006]`
- `me-stat-sparkles-column [314,816][541,1006]`
- `me-stat-package-column [541,816][768,1006]`
- `me-stat-calendar-check-column [767,816][993,1006]`

즉, 네 개 시각 칸이 카드 내부에 거의 같은 폭으로 분배되었다. 이 문제는 새 원인이라기보다 위 마이페이지 메뉴 케이스와 같은 `Pressable`/row bounds 계열이며, “보이는 표면 또는 칸은 `View`가 담당하고, `Pressable`은 absolute 터치 레이어로 분리한다”는 규칙을 보강하는 사례다.

같은 작업에서 footer 순서도 함께 조정했다. `로그아웃` 버튼이 `YellowBall v1.0.0 · MVP` 위에 오도록 렌더 순서를 바꾸고, 실제 기기에서 `me-footer-logout [56,1443][1026,1527]`, `me-footer-version [390,1560][690,1599]`로 버튼이 버전 문구보다 위에 있음을 확인했다.

## 5. 검증 방법

실제 Android 문제는 웹 렌더링만으로는 확인할 수 없다. 다음 순서로 확인해야 한다.

1. `adb devices -l`로 실제 기기가 연결되어 있는지 확인한다.
2. `npx expo run:android`로 현재 소스가 반영된 앱을 실제 기기에 다시 설치한다.
3. Metro 포트 충돌이 있으면 `npx expo run:android --port <빈 포트>`로 실행한다.
4. 앱 설치가 중간에 abort되면 이전 APK 또는 이전 JS bundle이 계속 보일 수 있으므로 반드시 재설치 완료 여부를 확인한다.
5. Jest/TypeScript/lint 검증은 보조 검증으로 사용한다.

현재 수행한 보조 검증:

- 로그인/소셜 로그인/회원가입/샵/마이페이지 관련 targeted Jest 테스트 통과
- `npx tsc --noEmit` 통과
- `npm run lint` 통과

### Expo Go/Metro가 한 번에 안 올라갈 때 빠른 복구 절차

최근 실제 기기 검증 중 Expo Go가 바로 앱 화면으로 진입하지 않고 다음 상태로 멈추는 일이 반복되었다.

- Expo Go의 `Something went wrong.` 화면으로 이동한다.
- error log에 `Uncaught Error: java.io.IOException: Failed to download remote update`가 보인다.
- `npx expo start --host localhost --port <port>` 실행 시 네트워크 제한 환경에서 `TypeError: fetch failed`가 난다.
- `npx expo start --offline --localhost --port <port>`처럼 실행하면 `Specify at most one of: --offline, --host, --tunnel, --lan, --localhost` 에러가 난다.
- `adb`가 PATH에 없어 `adb : 'adb' 용어가 ... 인식되지 않습니다`가 나온다.
- Metro를 `Start-Process`로만 띄우면 프로세스가 금방 종료되어 `Waiting on http://localhost:<port>`가 보였는데도 `http://127.0.0.1:<port>/status`가 열리지 않는다.

이때는 아래 순서대로 복구한다.

1. 먼저 Android SDK의 직접 경로로 기기 연결을 확인한다.

   ```powershell
   & 'C:\Users\Seeya\AppData\Local\Android\Sdk\platform-tools\adb.exe' devices -l
   ```

2. 네트워크가 막힌 환경에서는 dependency validation이 외부 API를 조회하다 실패할 수 있으므로 `--offline`을 쓴다. 단, `--offline`과 `--localhost`/`--host`는 같이 쓰지 않는다.

   ```powershell
   npx expo start --offline --port 8119
   ```

3. Metro가 실제로 살아 있는지 확인한다. `packager-status:running`이 나와야 한다.

   ```powershell
   Invoke-WebRequest -Uri http://127.0.0.1:8119/status -UseBasicParsing
   ```

4. 실제 기기에서 로컬 Metro를 보게 USB reverse를 건다.

   ```powershell
   & 'C:\Users\Seeya\AppData\Local\Android\Sdk\platform-tools\adb.exe' reverse tcp:8119 tcp:8119
   ```

5. Expo Go를 직접 deep link로 연다.

   ```powershell
   & 'C:\Users\Seeya\AppData\Local\Android\Sdk\platform-tools\adb.exe' shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8119 host.exp.exponent
   ```

6. Expo Go가 에러 화면에 머물면 error log를 확인한다. `Failed to download remote update`이면 대개 Expo Go가 Metro에 붙지 못했거나 이전 실패 상태를 보고 있는 것이다. 이때는 `adb reverse`를 다시 걸고 reload 버튼을 누르거나, Expo Go를 다시 deep link로 연다.

7. 수정 내용이 반영되지 않은 것처럼 보이면 빈 포트와 `--clear`를 사용해 새 번들을 만든다.

   ```powershell
   npx expo start --offline --clear --port 8119
   ```

8. 자동화 검증 중에는 Metro를 별도 창으로 띄운 뒤 종료되는지 확인하기 어렵다. 한 번의 PowerShell 작업 안에서 `Start-Job`으로 Metro를 띄우고, `adb reverse`, 앱 실행, `uiautomator dump`, `screencap`까지 끝낸 뒤 `Stop-Job`으로 정리하는 방식이 안정적이었다.

   ```powershell
   $adb = 'C:\Users\Seeya\AppData\Local\Android\Sdk\platform-tools\adb.exe'
   $port = 8119
   $job = Start-Job -ScriptBlock {
     param($wd, $p)
     Set-Location $wd
     npx expo start --offline --port $p
   } -ArgumentList (Get-Location).Path, $port

   Start-Sleep -Seconds 25
   Invoke-WebRequest -Uri "http://127.0.0.1:$port/status" -UseBasicParsing
   & $adb reverse "tcp:$port" "tcp:$port"
   & $adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:$port" host.exp.exponent

   # 검증 후 정리
   Stop-Job -Job $job
   Remove-Job -Job $job
   ```

9. 실제 화면이 최신 번들인지 확인할 때는 스크린샷만 보지 말고 testID bounds도 같이 확인한다.

   ```powershell
   & 'C:\Users\Seeya\AppData\Local\Android\Sdk\platform-tools\adb.exe' shell uiautomator dump /sdcard/window.xml
   & 'C:\Users\Seeya\AppData\Local\Android\Sdk\platform-tools\adb.exe' pull /sdcard/window.xml window.xml
   ```

빠른 판단 기준:

- `fetch failed`: 네트워크 제한에서 Expo CLI가 외부 dependency 정보를 조회하려다 실패한 것일 수 있다. `--offline`으로 다시 시작한다.
- `Specify at most one of...`: `--offline`과 `--localhost`/`--host`를 같이 쓴 것이다. `--offline --port <port>`만 사용한다.
- `Failed to download remote update`: 기기가 Metro에 붙지 못했거나 이전 실패 화면을 보고 있다. `adb reverse`, deep link 재실행, reload 순서로 복구한다.
- `/status` 접속 실패: Metro 프로세스가 실제로 살아 있지 않다. 새 포트로 다시 띄우고 `/status`를 먼저 확인한다.
- 화면이 예전 UI: Expo Go가 이전 번들을 보고 있을 수 있다. `--clear`, 새 포트, 앱 reload/deep link 재실행을 같이 사용한다.

## 6. 남은 이슈: 메인페이지 배너, 예약 바로가기, 샵 카테고리 깨짐

### 현재 증상

에뮬레이터에서는 정상으로 보이지만, 직접 빌드해서 실제 기기에서 보면 홈 배너, 예약 바로가기, 샵 카테고리가 깨진다.

### 가능한 원인 1: 실제 기기의 화면 폭/dp와 에뮬레이터 폭 차이

React Native는 px이 아니라 dp 기준으로 layout을 계산한다. 같은 스크린샷 폭처럼 보여도 실제 `useWindowDimensions().width` 값은 기기별로 다를 수 있다. 홈 화면은 현재 `homeBannerWidth`, `quickActionWidth`, `categoryCardWidth`를 `useWindowDimensions()` 기반으로 계산한다.

에뮬레이터가 넓은 dp 폭을 쓰고 실제 기기가 더 좁은 dp 폭을 쓰면 다음 현상이 생길 수 있다.

- quick action 4-column이 너무 좁아져 텍스트가 겹친다.
- category card 2-column 폭이 너무 작아져 이미지와 라벨이 겹친다.
- horizontal banner가 의도보다 좁게 계산되거나 텍스트가 압축된다.

대응 방법:

- 실제 기기에서 `windowWidth`, `homeBannerWidth`, `quickActionWidth`, `categoryCardWidth`를 임시 로그로 확인한다.
- quick action은 최소 폭 미만이면 2-column으로 강제한다.
- category는 실제 기기 폭이 좁으면 2-column 대신 horizontal scroll 또는 1-column/2-column breakpoint를 둔다.
- banner는 `maxWidth`보다 `visibleContentWidth` 우선으로 한 장이 화면 대부분을 차지하게 고정한다.

### 가능한 원인 2: 서버 콘텐츠와 fallback 콘텐츠 차이

홈 배너와 샵 카테고리는 정적 UI만이 아니라 `getAppContentBlocks()`로 서버 콘텐츠를 불러온다. 에뮬레이터와 실제 기기가 다른 환경 변수, 다른 Supabase 데이터, 다른 캐시 상태를 보고 있으면 서로 다른 이미지/문구/카테고리 개수가 표시될 수 있다.

대응 방법:

- 실제 기기와 에뮬레이터가 같은 `.env.local`의 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`를 쓰는지 확인한다.
- `home_banners`, `home_categories` 응답 개수와 각 image path를 로그로 비교한다.
- 서버에서 내려오는 문구가 길어도 `numberOfLines`와 `minWidth: 0`으로 카드 내부를 보호한다.

### 가능한 원인 3: Metro/빌드 캐시 또는 이전 bundle 반영

실제 기기 설치 중 `npx expo run:android`가 중간에 abort되거나 Metro 포트 충돌로 다른 서버에 붙으면, 일부 수정이 반영되지 않은 것처럼 보일 수 있다.

대응 방법:

- 실행 전 기존 Metro 프로세스와 포트 충돌을 확인한다.
- 필요하면 `npx expo start --clear` 또는 빈 포트로 Metro를 새로 띄운다.
- 설치 완료 후 앱을 완전히 종료하고 다시 연다.
- 가능하면 `adb shell pm clear com.yellowball.mobile`로 앱 캐시를 지운 뒤 재설치한다.

### 가능한 원인 4: Android font/display size 설정

앱의 기본 `Text`/`TextInput`은 `allowFontScaling={false}`와 제한된 `maxFontSizeMultiplier`를 쓰지만, 모든 텍스트 경로가 이 래퍼를 타지 않거나 기기 display size가 커져 있으면 작은 카드에서 텍스트가 겹칠 수 있다.

대응 방법:

- 홈 화면의 모든 텍스트가 `src/components/AppText.tsx`의 `Text`를 사용하는지 확인한다.
- 카테고리/quick action 라벨에는 `numberOfLines={1}`, `minWidth: 0`, `flexShrink: 1`을 유지한다.
- 카드 최소 폭보다 텍스트가 긴 경우 카드 column 수를 줄이는 breakpoint를 둔다.

### 우선 확인 순서

1. 실제 기기에서 홈 화면의 `windowWidth`, 계산된 카드 폭, 서버 콘텐츠 개수를 로그로 찍는다.
2. 실제 기기 빌드가 최신 소스를 반영했는지 재설치 완료 로그로 확인한다.
3. 홈 배너/quick action/category도 로그인/샵/마이페이지처럼 공통 컴포넌트 경로를 줄이고 직접 `Pressable` + 명시적 숫자 폭으로 고정한다.
4. 실제 기기 dp 폭 기준 breakpoint를 추가한다.
5. 같은 APK를 에뮬레이터와 실제 기기에서 비교한다.

## 7. 회원가입 도메인 선택 박스가 실제 Galaxy 기기에서 깨짐

### 증상

웹/에뮬레이터에서는 회원가입 페이지의 이메일 도메인 선택 박스가 정상으로 보였지만, Galaxy S25에서 Expo Go로 열면 `도메인` 소제목과 select box 텍스트가 어긋나고 드롭다운이 주변 필드를 밀어내거나 터치가 불안정했다.

### 접근 순서

1. `npx expo start --clear --port 8085`로 Metro 캐시를 지우고 실제 기기를 `adb reverse tcp:8085 tcp:8085`로 연결했다.
2. Context7에서 React Native 공식 문서를 확인했다. 핵심은 `position: 'absolute'`가 layout flow에서 빠진다는 점, Android 겹침에는 `zIndex`와 `elevation`을 같이 고려해야 한다는 점, 텍스트 높이는 `lineHeight`와 `includeFontPadding` 영향을 받는다는 점이었다.
3. Sequential Thinking으로 원인을 나눴다: 라벨 행 정렬 문제, `Input`과 직접 만든 select 표면의 높이 차이, Android `Pressable` flex 스타일 손실, 절대 배치 메뉴의 부모 hit-test 경계 문제.
4. Jest로 구조를 고정한 뒤 실제 S25에서 닫힘/열림/선택 후 닫힘 스크린샷을 찍어 확인했다.

### 원인

- 왼쪽 이메일 입력은 공통 `Input`을 쓰고 오른쪽 도메인은 직접 만든 `Pressable`/텍스트 조합을 써서 label, height, lineHeight 기준이 서로 달랐다.
- Android에서는 `Pressable`에 `flexDirection`, `height`, border 등을 직접 몰아주면 실제 렌더링/터치 영역이 웹과 다르게 접히는 경우가 있었다.
- 드롭다운은 `position: 'absolute'`로 보이게는 만들 수 있지만, 부모 `View`의 실제 bounds 밖으로 나가면 Android hit-test가 옵션 터치를 아래 필드로 보내 선택이 닫히지 않았다.

### 수정 방법

적용 위치:

- `app/(auth)/register.tsx`
- `__tests__/registerScreen.test.tsx`

수정 내용:

- 이메일/도메인 라벨을 별도 `emailLabelRow`로 분리하고, 로컬 입력/`@`/도메인 select 행은 숫자 폭으로 고정했다.
- 도메인 select는 바깥 `View`가 border/height/overflow를 담당하고, 안쪽 `Pressable`은 `StyleSheet.absoluteFillObject`로 터치 영역만 담당하게 했다.
- select 텍스트는 `allowFontScaling={false}`, `includeFontPadding: false`, 명시적 `lineHeight`, `width: '100%'`로 Android 세로 밀림을 막았다.
- 드롭다운은 `position: 'absolute'`, `zIndex`, `elevation`으로 띄우되, `emailGroup`에 메뉴 높이만큼 `paddingBottom`을 주고 같은 값의 음수 `marginBottom`을 적용했다. 이렇게 하면 화면 배치는 밀리지 않지만 Android hit-test 경계는 메뉴 옵션까지 포함한다.
- 옵션 선택 시 기존 `selectEmailDomain()`이 `setDomainMenuOpen(false)`를 호출하므로 선택 후 메뉴가 닫힌다.

### 검증 결과

- `npm run test -- registerScreen.test.tsx --runInBand` 통과.
- Galaxy S25 실기에서 `yellowball_register_domain_final_closed.png`, `yellowball_register_domain_final_open.png`, `yellowball_register_domain_final_selected.png`를 캡처했다.
- 닫힘 상태에서 소제목과 select box가 정렬되고, 열림 상태에서 드롭다운이 아래 컴포넌트를 밀지 않고 위에 떠 있으며, `gmail.com` 선택 후 메뉴가 닫히는 것을 확인했다.

### 다음에 같은 문제가 나면

- Android에서 드롭다운이 보이는데 옵션 터치가 안 되면 먼저 부모 `View` bounds 밖으로 absolute child가 나갔는지 확인한다.
- 버튼 표면과 터치 표면을 분리할 때는 바깥 표면에 명시적 `height`/`overflow`, 안쪽 `Pressable`에 `absoluteFillObject`를 우선 적용한다.
- 웹/에뮬레이터 스크린샷만 보지 말고 `adb shell uiautomator dump`로 실제 접근성/터치 bounds를 확인한다.

### 추가 보정: 실제 기기에서 select 여백과 구분선이 약하게 보임

- `Pressable`에 준 `paddingHorizontal`이 Android 실제 렌더링에서 자식 텍스트 위치에 충분히 반영되지 않을 수 있다. select 내부 텍스트 여백은 `Text` 스타일에 직접 `paddingHorizontal`을 지정한다.
- option row의 `borderBottomWidth`만으로는 실제 기기에서 구분선이 흐리거나 보이지 않을 수 있다. 옵션 사이에는 별도 separator `View`를 두고 `height: 1`, `width: '100%'`, 명시적 배경색을 준다.
- separator를 추가하면 메뉴 전체 높이 계산에도 separator 개수만큼 더해 absolute dropdown의 hit-test 영역이 부족하지 않게 한다.

## 8. 예약 화면 CTA 클릭 불가, 새 예약 카드 배경 누락, 진행 중 예약 카드가 답답해 보임

### 증상

Galaxy S25에서 `npx expo start --clear` 후 Expo Go로 예약 화면을 열었을 때 웹/에뮬레이터와 다르게 보였다.

- `새 예약 만들기`의 `스트링 작업 예약`, `라켓 시타 예약` 카드 뒤에 있던 흰색 표면이 약하게 보이거나 사라진 것처럼 보였다.
- CTA 카드를 눌러도 새 예약 화면으로 이동하지 않는 경우가 있었다.
- `라켓 시타 예약`을 눌러도 시타 예약이 아니라 기본 스트링 예약 화면으로 들어갈 수 있었다.
- `진행 중`의 스트링 작업 카드가 흰 박스 안에서 너무 꽉 차 보였고, 상세 박스와 카드 테두리 사이 여백이 부족했다.
- pending 상태 카드에 강조 border가 섞여 흰 박스 테두리에 색이 있는 것처럼 보였다.

### 접근 순서

1. Context7에서 Expo Router 공식 문서 패턴을 확인했다. `router.push({ pathname, params })`로 파라미터를 넘기고, 진입 화면에서 `useLocalSearchParams()`로 읽는 방식이 현재 Expo Router 기준에 맞다.
2. Sequential Thinking으로 문제를 분리했다.
   - 터치 불가: 보이는 카드 표면과 실제 `Pressable` hit target의 boundary 문제.
   - 시타 화면 미진입: `/new-booking`에 mode 정보가 전달되지 않는 문제.
   - 카드 답답함: 공통 `RowButton` 기본 row 스타일과 내부 `width: '100%'`/padding이 Android에서 의도와 다르게 합쳐지는 문제.
3. Jest로 라우팅과 레이아웃 계약을 먼저 고정했다.
4. 실제 기기에서는 `adb shell uiautomator dump`로 `resource-id`와 bounds를 확인하고, `adb shell input tap`으로 CTA 중앙 좌표를 직접 눌러 검증했다.

### 원인

CTA는 처음에 보이는 카드 표면과 실제 터치 처리 레이어가 명확히 분리되어 있지 않았다. Android 실제 기기에서는 내부 row나 자식 요소가 터치 판정에 영향을 줄 수 있으므로, 웹/에뮬레이터에서 정상이어도 실제 기기에서 탭이 먹지 않을 수 있다.

또한 스트링/시타 CTA가 모두 단순히 `/new-booking`으로 이동하고 있었다. 새 예약 화면의 기본 모드가 `stringing`이므로, 시타 CTA를 눌러도 `mode=demo`를 전달하지 않으면 시타 예약 화면이 바로 열리지 않는다.

진행 중 예약 카드는 `View` 표면 안에 공통 `RowButton`을 넣고 그 안에 다시 `width: '100%'`인 콘텐츠를 넣은 구조였다. `RowButton`은 목록 row에 맞는 기본 스타일을 갖기 때문에 Android 실제 렌더링에서 padding이 기대보다 약하게 보이고, 상세 박스가 카드 안을 꽉 채우는 느낌이 났다.

### 수정 방법

적용 위치:

- `app/(tabs)/booking.tsx`
- `app/(tabs)/new-booking.tsx`
- `__tests__/bookingScreen.test.tsx`
- `__tests__/newBookingScreen.test.tsx`

CTA 수정:

- `BookingCta`를 흰색 카드 표면 `View`와 실제 터치 `Pressable`로 분리했다.
- 카드 표면에는 `backgroundColor`, `borderColor`, `borderRadius`, `borderWidth`, `minHeight`, `overflow: 'hidden'`, `width: '100%'`를 직접 지정했다.
- `Pressable`에는 `minHeight`, `width: '100%'`를 직접 지정했다.
- 내부 row에는 `pointerEvents="none"`을 지정해 자식 요소가 카드 터치 이벤트를 가로채지 않게 했다.
- 실제 Android XML에서 표면 확인이 가능하도록 `booking-cta-string-booking-surface`, `booking-cta-demo-booking-surface` testID를 추가했다.

라우팅 수정:

- 스트링 CTA:
  - `router.push({ pathname: '/new-booking', params: { mode: 'stringing' } })`
- 시타 CTA:
  - `router.push({ pathname: '/new-booking', params: { mode: 'demo' } })`
- 새 예약 화면에서는 `useLocalSearchParams<{ mode?: string | string[] }>()`로 mode를 읽고, 메뉴가 활성화되어 있으면 초기 모드를 `demo` 또는 `stringing`으로 맞췄다.

진행 중 카드 수정:

- pending 상태 전용 accent border를 카드 표면에서 제거하고 중립 border만 남겼다.
- 공통 `RowButton` 대신 직접 `Pressable`을 사용했다.
- 바깥 `bookingCardSurface`는 흰색 표면과 border만 담당하게 했다.
- 안쪽 `bookingCardContent`에 `paddingHorizontal`, `paddingVertical`, `gap`을 직접 지정했다.
- 상세 박스는 `alignSelf: 'stretch'`, `padding`, `gap`을 명시하고, 카드 표면과 상세 박스 사이의 좌우 inset이 실제로 생기도록 했다.

### 검증 결과

자동 검증:

- `npm run test -- __tests__/bookingScreen.test.tsx --runInBand` 통과
- `npm run test -- __tests__/newBookingScreen.test.tsx --runInBand` 통과
- `npm run lint` 통과
  - 기존 `src/services/appMenuSettingsService.ts`의 `require()` warning 1개만 남음

실제 기기 검증:

1. `adb devices -l`로 Galaxy S25 `SM-S931N` 연결을 확인했다.
2. `npx expo start --clear --offline --port 8112`로 새 번들을 띄웠다.
3. `adb reverse tcp:8112 tcp:8112`로 실제 기기에서 로컬 Metro에 붙게 했다.
4. Expo Go에서 예약 화면을 열고 `uiautomator dump`로 testID와 bounds를 확인했다.
5. `adb shell input tap`으로 CTA 중앙 좌표를 눌렀다.

동적 검증값:

- `bookingNeedle=booking-cta-string-booking-surface`
- `serviceDetailInset=63,63`
- `bookingHasCtaSurfaces=True`
- `serviceCardHasRoomyInset=True`
- `stringOpenedStringMode=True`
- `demoOpenedDemoMode=True`

최종 캡처:

- `yellowball_booking_spacing_fix_booking.png`
- `yellowball_booking_spacing_fix_string.png`
- `yellowball_booking_spacing_fix_demo.png`

### 다음에 같은 문제가 나면

- 카드가 보이는데 클릭이 안 되면 먼저 보이는 표면과 실제 `Pressable` hit target이 같은 크기인지 확인한다.
- Android에서는 카드 표면 `View`와 터치 `Pressable` 양쪽 모두에 `width`, `minHeight`, `overflow`를 명시한다.
- `Pressable` 내부 자식 row에는 필요하면 `pointerEvents="none"`을 둬서 터치를 부모 카드로 모은다.
- 새 화면의 기본 탭/모드가 있는 경우 CTA에서 route param을 명시적으로 넘긴다.
- 공통 `RowButton`은 목록 row에는 적합하지만, 카드 내부에 여백이 중요한 복합 카드에서는 직접 `Pressable`과 표면 `View`를 쓰는 편이 안정적이다.
- 실제 여백 검증은 스크린샷만 보지 말고 `uiautomator dump`의 bounds 차이로 확인한다. 이번 케이스는 상세 박스 좌우 inset이 `63px / 63px`인지 확인했다.
- ADB가 중간에 `no devices`로 떨어지면 검증 결과로 보지 않는다. `adb kill-server`, `adb start-server`, 휴대폰 잠금 해제/USB 디버깅 승인 후 같은 절차를 재실행한다.

## 9. 홈 화면 실제 기기 UI/터치 문제: 바로가기 정렬, 내 라켓, 추천 스트링

### 증상

`npx expo start --clear` 후 QR 코드로 Galaxy A42 실제 기기에서 확인했을 때 웹/에뮬레이터와 다르게 홈 화면 일부가 깨졌다.

- 상단 바로가기 메뉴에서 아이콘 중심과 메뉴명 중심이 미세하게 어긋났다.
- `내 라켓` 섹션에서 기존 라켓 카드의 이미지와 설명 영역이 너무 붙어 보였다.
- `라켓 추가` 타일의 점선 박스가 실제 기기에서 웹/에뮬레이터와 다르게 보이거나, 다른 컴포넌트와 오른쪽 정렬이 맞지 않았다.
- `내 라켓` 오른쪽 `관리 >`가 `진행 중인 예약`의 `전체 보기 >`보다 더 오른쪽으로 밀려 보였다.
- 홈의 `라켓 추가`를 눌러도 라켓 추가 화면으로 이동하지 않았다.
- 홈의 `추천 스트링` 카드를 눌러도 상세 화면으로 이동하지 않았다.
- 추천 스트링 카드에 라우팅을 붙인 뒤에는 글자량에 따라 카드 높이/폭이 달라지는 문제가 생겼다.

### 접근 순서

1. Context7에서 Expo Router와 React Native Pressable 공식 문서를 확인했다.
   - `router.push('/route')`
   - `router.push({ pathname, params })`
   - 실제 터치 영역인 `Pressable` 자체에 명시적인 크기 스타일을 주는 패턴
2. Sequential Thinking으로 문제를 분리했다.
   - 정렬 문제: 실제 Android layout에서 부모 폭, 자식 폭, 텍스트 폭이 웹과 다르게 계산되는 문제.
   - 터치 문제: 보이는 카드 표면과 실제 `Pressable` hit target이 일치하지 않는 문제.
   - 추천 스트링 문제: `Card`를 `Pressable`로 단순 치환하면 기존 카드 표면 스타일이 빠지고, 텍스트 양에 따라 layout이 흔들리는 문제.
3. Jest 테스트로 홈 화면 layout과 라우팅을 먼저 고정했다.
4. 연결된 Android 기기에서 `adb shell input tap`, `screencap`, `uiautomator dump`로 실제 동작과 bounds를 확인했다.

### 원인

상단 바로가기 메뉴는 아이콘 버블의 실제 폭과 라벨 텍스트의 폭 기준이 달라 Android 실제 기기에서 중심이 조금씩 어긋났다. 웹/에뮬레이터에서는 렌더링 차이 때문에 티가 덜 났지만, 실제 Android에서는 아이콘 슬롯을 별도로 고정하지 않으면 label 중심과 icon 중심이 달라질 수 있다.

`내 라켓` 섹션은 왼쪽 padding만 갖는 구조라 섹션 헤더의 오른쪽 action 위치가 다른 섹션과 달랐다. 또한 라켓 카드 내부는 Android에서 `gap`만으로 이미지와 설명 사이 여백을 기대하면 실제 렌더링이 답답하게 붙어 보일 수 있었다.

`라켓 추가`는 점선 표면과 터치 영역이 안정적으로 같은 bounds를 갖지 않았다. Android에서는 보이는 dashed 영역이 있어도 실제 `Pressable`이 고정 width/height를 직접 갖지 않으면 터치가 자식/레이어 구조에 따라 실패하거나 예상과 다르게 잡힐 수 있다.

추천 스트링은 기존에 `Card`만 렌더링하고 있었고 상세 화면으로 이동하는 `Pressable`이 없었다. 이후 `Card`를 `Pressable`로 단순 교체하면 클릭은 가능하지만 기존 `Card`의 background, border, padding 같은 기본 표면 스타일이 빠질 수 있었다.

추천 스트링 카드 크기 문제는 카드 내부 제목/설명이 자연 높이로 렌더링되면서 발생했다. 긴 이름/설명은 카드가 커지고, 짧은 이름/설명은 카드가 낮아져 같은 carousel 안에서 카드 크기가 달라졌다. Android에서는 row 안의 `Pressable`도 `flexShrink`를 명시하지 않으면 내용과 viewport 상황에 따라 폭이 줄어들 수 있다.

### 수정 방법

적용 위치:

- `app/(tabs)/index.tsx`
- `__tests__/homeScreenLayout.test.tsx`

상단 바로가기:

- 각 quick action에 full-width icon slot을 추가했다.
- 아이콘은 slot 중앙에 배치하고, 라벨/서브라벨도 같은 cell 폭 기준으로 중앙 정렬했다.
- 실제 Android에서 아이콘과 메뉴명이 같은 중심선을 쓰도록 `quickActionIconSlot`, `quickActionCell`, `quickActionLabel` 구조를 고정했다.

내 라켓 섹션:

- `racketSection`을 `paddingHorizontal: screenHorizontalPadding`으로 바꿔 `관리 >`와 다른 섹션의 오른쪽 action 정렬을 맞췄다.
- 라켓 리스트는 `gap` 의존을 줄이고 카드에 `marginRight`를 둬 Android에서 행 간격이 안정적으로 보이게 했다.
- 라켓 카드 설명 영역에는 `marginTop`을 명시해 이미지와 설명이 너무 붙지 않도록 했다.
- 라켓 카드와 설명 영역에 testID를 추가해 native layout 회귀 테스트가 가능하게 했다.

라켓 추가:

- `라켓 추가` 타일 자체를 고정 크기의 `Pressable`로 만들었다.
- `width`, `minWidth`, `maxWidth`, `height`, `minHeight`, `flexShrink: 0`, `position: 'relative'`, `overflow: 'hidden'`을 명시했다.
- 점선은 `pointerEvents="none"`인 내부 장식 레이어로 분리했다.
- `onPress={() => router.push('/rackets')}`를 실제 카드 `Pressable`에 직접 연결했다.

추천 스트링 라우팅:

- 추천 스트링 항목을 외부 `Pressable`로 감쌌다.
- 내부에는 기존 `Card`를 유지해 카드 표면 스타일이 사라지지 않게 했다.
- 클릭 시 다음 형태로 상세 화면으로 이동하게 했다.

```tsx
router.push({
  pathname: '/string-detail',
  params: { from: '/', id: item.id },
});
```

추천 스트링 카드 크기 고정:

- 추천 스트링 카드 높이를 `featuredStringCardHeight = 312`로 고정했다.
- carousel item의 폭은 `width`, `minWidth`, `maxWidth`, `flexBasis`, `flexShrink: 0`을 같은 숫자로 고정했다.
- 브랜드는 1줄, 제목은 2줄, 설명은 2줄까지만 렌더링하고 넘치면 `ellipsizeMode="tail"`로 말줄임 처리했다.
- 짧은 문구도 카드가 줄어들지 않고 같은 높이를 유지하도록 `Card` 자체에도 같은 sizing을 적용했다.

### 검증 결과

자동 검증:

- `npm run test -- homeScreenLayout.test.tsx --runInBand` 통과
- `npm run lint` 통과
  - 기존 `src/services/appMenuSettingsService.ts`의 `require()` warning 1개만 남음

실제 기기 검증:

- Galaxy A42 연결 확인 후 Expo Go에서 최신 bundle을 reload했다.
- 홈 상단 바로가기 아이콘/라벨 정렬을 스크린샷으로 확인했다.
- `내 라켓` 섹션에서 `관리 >`와 `진행 중인 예약`의 `전체 보기 >` 오른쪽 정렬이 맞는 것을 확인했다.
- `라켓 추가` 타일을 실제로 눌러 `/rackets` 입력 화면으로 이동하는 것을 확인했다.
- 홈 `추천 스트링` 카드를 실제로 눌러 `/string-detail` 상세 화면으로 이동하는 것을 확인했다.
- 추천 스트링 카드가 글자량과 무관하게 같은 카드 크기를 유지하는 것을 확인했다.

관련 캡처:

- `yellowball_home_after_patch_top.png`
- `yellowball_add_racket_after_tap.png`
- `yellowball_home_recommended_visible.png`
- `yellowball_featured_string_after_tap.png`
- `yellowball_featured_cards_fixed_height.png`

### 다음에 같은 문제가 나면

- Android 실제 기기에서 보이는 카드 표면과 실제 `Pressable` bounds가 같은지 먼저 확인한다.
- 반복 카드/carousel item은 `width`만 주지 말고 `minWidth`, `maxWidth`, `flexBasis`, `flexShrink: 0`까지 같이 고정한다.
- 카드 안 텍스트는 `numberOfLines`, `ellipsizeMode`, `minWidth: 0`, 필요 시 `lineHeight`를 명시한다.
- `Card`를 클릭 가능하게 만들 때는 `Card`를 `Pressable`로 단순 교체하지 말고, 외부 `Pressable` + 내부 `Card` 구조를 우선 고려한다.
- 점선/배경/아이콘 같은 장식 레이어는 `pointerEvents="none"`으로 터치 target과 분리한다.
- 웹/에뮬레이터에서 정상이어도 실제 Android에서는 `adb screencap`과 `uiautomator dump`로 bounds를 확인한다.

## 재발 방지 규칙

- Android에서 grid/card layout은 퍼센트 폭만 믿지 말고 `useWindowDimensions()` 기반 숫자 폭을 우선 사용한다.
- 카드형 grid 요소에는 `width`, `flexBasis`, `maxWidth`를 같은 값으로 명시한다.
- 공통 row/list 컴포넌트를 grid card에 재사용하지 않는다.
- 공통 버튼 컴포넌트가 native Android에서 variant 스타일을 잃으면 화면 전용 `Pressable`로 분리한다.
- 버튼 표면과 실제 `Pressable` 터치 영역이 분리되어 있으면 양쪽 모두에 명시적인 높이/폭/클리핑을 지정한다.
- 작고 반복되는 카드 안의 텍스트에는 `numberOfLines`, `minWidth: 0`, `flexShrink`를 반드시 지정한다.
- 웹/에뮬레이터 통과만으로 완료 처리하지 말고, 실제 Android 설치 앱에서 화면을 확인한다.
