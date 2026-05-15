const { readFileSync } = require('node:fs');
const { join } = require('node:path');

describe('YellowBall brand assets migration', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/044_yellowball_brand_assets.sql'),
    'utf8',
  );

  test('stores the app, transparent login logo, adaptive, and splash image paths in brand_assets', () => {
    expect(migration).toContain("'brand_assets'");
    expect(migration).toContain('"logo_path": "brand/yellowball-logo.png"');
    expect(migration).toContain(
      '"login_logo_path": "brand/yellowball-logo-transparent.png"',
    );
    expect(migration).toContain(
      '"app_icon_path": "brand/yellowball-logo.png"',
    );
    expect(migration).toContain(
      '"adaptive_icon_path": "brand/yellowball-adaptive-icon.png"',
    );
    expect(migration).toContain(
      '"splash_icon_path": "brand/yellowball-splash-icon.png"',
    );
  });
});
