import {
  getHomeBannerLayout,
  getHomeBannerMeasuredContentLayout,
  getHomeCategoryLayout,
  getHomeQuickActionLayout,
  getSafeHomeContentWidth,
} from '../src/utils/homeLayout';

const horizontalPadding = 20;
const gap = 8;

describe('homeLayout', () => {
  test.each([360, 393, 411])(
    'keeps Android banner cards separated at %idp',
    (viewportWidth) => {
      const layout = getHomeBannerLayout(viewportWidth, horizontalPadding, 8);
      const contentWidth = viewportWidth - horizontalPadding * 2;

      expect(layout.contentWidth).toBe(contentWidth);
      expect(layout.itemWidth).toBe(Math.floor((contentWidth - 8) / 2));
      expect(layout.snapInterval).toBe(layout.itemWidth + 8);
    },
  );

  test('keeps measured content banner cards separated without subtracting padding again', () => {
    const layout = getHomeBannerMeasuredContentLayout(320, 8);

    expect(layout.contentWidth).toBe(320);
    expect(layout.itemWidth).toBe(156);
    expect(layout.snapInterval).toBe(164);
  });

  test('uses one banner per page when a real device is too narrow for two readable cards', () => {
    const layout = getHomeBannerMeasuredContentLayout(320, 8, 2, 220);

    expect(layout.columns).toBe(1);
    expect(layout.itemWidth).toBe(320);
    expect(layout.snapInterval).toBe(328);
  });

  test('clamps measured content width to the visible viewport content width', () => {
    expect(getSafeHomeContentWidth(380, 320)).toBe(320);
    expect(getSafeHomeContentWidth(300, 320)).toBe(300);
    expect(getSafeHomeContentWidth(null, 320)).toBe(320);
    expect(getSafeHomeContentWidth(Number.NaN, 320)).toBe(320);
  });

  test.each([360, 393, 411])(
    'fills real Android quick action rows exactly at %idp',
    (viewportWidth) => {
      const contentWidth = viewportWidth - horizontalPadding * 2;
      const layout = getHomeQuickActionLayout(contentWidth, gap, 4, 4, 72);

      expect(layout.columns).toBe(4);
      expect(layout.rowWidth).toBeLessThanOrEqual(contentWidth);
      expect(contentWidth - layout.rowWidth).toBeLessThan(gap);
    },
  );

  test('falls back from four quick actions to two columns instead of a left-heavy three-one split', () => {
    const layout = getHomeQuickActionLayout(320, gap, 4, 4, 76);

    expect(layout.columns).toBe(2);
    expect(layout.itemWidth).toBe(156);
    expect(layout.rowWidth).toBe(320);
  });

  test.each([360, 393, 411])(
    'keeps shop category cards equal width at %idp',
    (viewportWidth) => {
      const contentWidth = viewportWidth - horizontalPadding * 2;
      const layout = getHomeCategoryLayout(contentWidth, gap, 2, 148);

      expect(layout.columns).toBe(2);
      expect(layout.rowWidth).toBeLessThanOrEqual(contentWidth);
      expect(contentWidth - layout.rowWidth).toBeLessThan(gap);
    },
  );
});
