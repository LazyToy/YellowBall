const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

describe('PR-01 프로젝트 초기 설정', () => {
  test('필수 의존성과 스크립트가 설정되어 있다', () => {
    const pkg = readJson('package.json');

    expect(pkg.main).toBe('expo-router/entry');
    expect(pkg.scripts.test).toBe('jest');
    expect(pkg.scripts.lint).toBe('expo lint');
    expect(pkg.dependencies.expo).toBeDefined();
    expect(pkg.dependencies['expo-router']).toBeDefined();
    expect(pkg.dependencies['@tanstack/react-query']).toBeDefined();
    expect(pkg.dependencies.zustand).toBeDefined();
    expect(pkg.devDependencies.jest).toBeDefined();
  });

  test('TypeScript strict 모드와 경로 별칭이 활성화되어 있다', () => {
    const tsconfig = readJson('tsconfig.json');

    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['src/*']);
    expect(tsconfig.exclude).toContain('YellowBall_v0.1');
  });

  test('요구 폴더와 설정 파일이 존재한다', () => {
    const requiredPaths = [
      'app/(auth)/_layout.tsx',
      'app/(tabs)/_layout.tsx',
      'app/_layout.tsx',
      'src/components',
      'src/hooks',
      'src/services',
      'src/stores',
      'src/types',
      'src/utils',
      'src/constants',
      'supabase/migrations',
      '__tests__',
      '.vscode/settings.json',
      '.eslintrc.js',
      '.prettierrc',
      'jest.config.js',
    ];

    for (const relativePath of requiredPaths) {
      expect(fs.existsSync(path.join(root, relativePath))).toBe(true);
    }
  });

  test('PR-03 NativeWind 패키지가 설치되어 있다', () => {
    const pkg = readJson('package.json');
    const allPackages = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    expect(allPackages.nativewind).toBeDefined();
    expect(allPackages.tailwindcss).toBeDefined();
    expect(allPackages['react-native-reanimated']).toBeDefined();
  });
});
