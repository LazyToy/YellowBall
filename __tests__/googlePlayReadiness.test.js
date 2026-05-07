const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

describe('Google Play 배포 준비 설정', () => {
  test('Expo Android package와 versionCode가 설정되어 있다', () => {
    const appConfig = readJson('app.json');

    expect(appConfig.expo.android.package).toBe('com.yellowball.mobile');
    expect(appConfig.expo.android.versionCode).toBe(2);
  });

  test('Android 빌드는 시스템 바 뒤로 앱을 그리지 않는다', () => {
    const appConfig = readJson('app.json');

    expect(appConfig.expo.android.edgeToEdgeEnabled).toBe(false);
  });

  test('EAS production profile은 Android App Bundle을 생성한다', () => {
    const easConfig = readJson('eas.json');

    expect(easConfig.build.production.android.buildType).toBe('app-bundle');
    expect(easConfig.build.production.autoIncrement).toBe(true);
    expect(easConfig.submit.production.android.track).toBe('internal');
    expect(easConfig.submit.production.android.releaseStatus).toBe('draft');
  });

  test('개인정보 처리방침 URL과 원문 문서가 준비되어 있다', () => {
    const appConfig = readJson('app.json');
    const privacyPolicyPath = path.join(root, 'docs/legal/privacy-policy.md');
    const privacyPolicyHtmlPath = path.join(root, 'docs/legal/privacy/index.html');
    const privacyPolicy = fs.readFileSync(privacyPolicyPath, 'utf8');
    const privacyPolicyHtml = fs.readFileSync(privacyPolicyHtmlPath, 'utf8');

    expect(appConfig.expo.extra.privacyPolicyUrl).toBe(
      'https://lazytoy.github.io/privacy/',
    );
    expect(privacyPolicy).toContain('공개 URL: https://lazytoy.github.io/privacy/');
    expect(privacyPolicy).toContain('개인정보 처리방침');
    expect(privacyPolicy).toContain('삭제 요청 후 30일간 대기 기간');
    expect(privacyPolicyHtml).toContain('삭제 요청 후 30일간 대기 기간');
  });
});
