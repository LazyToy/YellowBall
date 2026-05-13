import { readFileSync } from 'fs';
import { join } from 'path';

const readSource = (path: string) =>
  readFileSync(join(process.cwd(), path), 'utf8');

describe('Android mobile responsive layout guards', () => {
  test('AppScrollView keeps focused inputs above the Android keyboard', () => {
    const source = readSource('src/components/MobileUI.tsx');
    const loginSource = readSource('app/(auth)/login.tsx');
    const registerSource = readSource('app/(auth)/register.tsx');

    expect(source).toContain('KeyboardAvoidingView');
    expect(source).toContain('Keyboard.addListener');
    expect(source).toContain('currentlyFocusedInput');
    expect(source).toContain('scrollToFocusedInput');
    expect(source).toContain('getNativeScrollRef');
    expect(source).not.toContain('findNodeHandle');
    expect(source).toContain('keyboardVerticalOffset');
    expect(source).toContain('onContentSizeChange={scrollToFocusedInput}');
    expect(source).toContain(
      "keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}",
    );
    expect(source).toContain('automaticallyAdjustKeyboardInsets');
    expect(loginSource).toContain('AppScrollView');
    expect(loginSource).not.toContain('KeyboardAvoidingView');
    expect(registerSource).toContain('AppScrollView');
    expect(registerSource).not.toContain('KeyboardAvoidingView');
  });

  test('RefreshableScrollView also keeps form inputs above the Android keyboard', () => {
    const source = readSource('src/components/PageRefresh.tsx');

    expect(source).toContain('KeyboardAvoidingView');
    expect(source).toContain('Keyboard.addListener');
    expect(source).toContain('currentlyFocusedInput');
    expect(source).toContain('scrollToFocusedInput');
    expect(source).toContain('getNativeScrollRef');
    expect(source).not.toContain('findNodeHandle');
    expect(source).toContain('automaticallyAdjustKeyboardInsets');
    expect(source).toContain(
      "keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}",
    );
  });

  test('auth form action buttons use a full-width visible control surface', () => {
    const loginSource = readSource('app/(auth)/login.tsx');
    const registerSource = readSource('app/(auth)/register.tsx');

    expect(loginSource).toContain('styles.nativeAuthButton');
    expect(loginSource).toContain('nativeAuthButton: {');
    expect(loginSource).toContain('backgroundColor: lightColors.primary.hex');
    expect(registerSource).toContain('style={styles.authButton}');
    expect(registerSource).toContain('authButton: {');
  });

  test('shared product thumbnails stay square from the parent card width', () => {
    const source = readSource('src/components/MobileUI.tsx');

    expect(source).toContain("width: '100%'");
    expect(source).toContain('aspectRatio: 1');
  });

  test('two-column grids use deterministic Android-safe widths', () => {
    const homeSource = readSource('app/(tabs)/index.tsx');
    const shopSource = readSource('app/(tabs)/shop.tsx');
    const mobileSource = readSource('src/components/MobileUI.tsx');

    expect(mobileSource).toContain("width: '100%'");
    expect(homeSource).not.toContain('home-banner-list');
    expect(homeSource).not.toContain('home-category-');
    expect(homeSource).not.toContain('home_banners');
    expect(homeSource).not.toContain('home_categories');
    expect(homeSource).not.toContain('handleCategoryGridLayout');
    expect(homeSource).not.toContain('columnGap: categoryCardGap');
    expect(homeSource).not.toContain('rowGap: categoryCardGap');
    expect(homeSource).not.toContain('flexBasis: categoryCardWidth');
    expect(homeSource).not.toContain('categoryCardSpacing');
    expect(homeSource).not.toContain('quickActionSpacing');
    expect(homeSource).toContain('quickActionSpacer');
    expect(homeSource).toContain('quickActionRows');
    expect(homeSource).not.toContain('ImageBackground');
    expect(homeSource).not.toContain('contentContainerStyle={styles.bannerList}');
    expect(homeSource).not.toContain('homeBannerMediaClip');
    expect(homeSource).not.toContain('coverImage');
    expect(homeSource).not.toContain('homeBannerGap');
    expect(homeSource).not.toContain('categoryIconBubble');
    expect(homeSource).not.toContain('categoryMediaClip');
    expect(homeSource).not.toContain('categoryOverlay');
    expect(homeSource).toContain('minQuickActionWidth = 72');
    expect(homeSource).toContain('getHomeQuickActionLayout');
    expect(homeSource).toContain('home-layout-probe');
    expect(homeSource).not.toContain('categoryCardColumnCount');
    expect(homeSource).not.toContain('categoryGrid: {');
    expect(homeSource).toContain("width: '100%'");
    expect(shopSource).toContain('getTwoColumnItemWidth');
    expect(shopSource).not.toContain('handleProductGridLayout');
    expect(shopSource).toContain('productCardSpacing');
    expect(shopSource).toContain('productGrid: {');
    expect(shopSource).toContain("width: '100%'");
    expect(shopSource).not.toContain("flexBasis: '48.5%'");
  });

  test('Me screen summary and menu rows keep labels inside row layouts', () => {
    const source = readSource('app/(tabs)/me.tsx');

    expect(source).toContain("flexWrap: 'wrap'");
    expect(source).toContain('numberOfLines={1} style={styles.menuLabel}');
    expect(source).toContain('flexShrink: 1');
  });
});
