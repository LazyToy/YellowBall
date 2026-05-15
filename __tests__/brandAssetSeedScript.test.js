const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

describe('brand asset seed script', () => {
  const script = readFileSync(
    join(process.cwd(), 'scripts/seed-storage-assets.mjs'),
    'utf8',
  );

  test('uploads the transparent login logo asset to app-assets', () => {
    expect(script).toContain('yellowball-logo-transparent.png');
    expect(script).toContain(
      "path: 'brand/yellowball-logo-transparent.png'",
    );
    expect(script).not.toContain('yellowball-symbol.png');
    expect(
      existsSync(
        join(process.cwd(), 'assets/brand/yellowball-logo-transparent.png'),
      ),
    ).toBe(true);
  });
});
