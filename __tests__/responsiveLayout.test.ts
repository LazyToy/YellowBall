import {
  getBoundedItemWidth,
  getColumnItemWidth,
  getResponsiveColumnCount,
  getTwoColumnItemWidth,
} from '../src/utils/responsiveLayout';

describe('responsiveLayout', () => {
  test('calculates two-column item widths from the visible parent width and gap', () => {
    expect(getTwoColumnItemWidth(320, 8)).toBe(156);
    expect(getTwoColumnItemWidth(371, 8)).toBe(181);
  });

  test('calculates four-column quick action widths excluding three gaps', () => {
    expect(getColumnItemWidth(320, 8, 4)).toBe(74);
  });

  test('guards invalid dimensions with zero width', () => {
    expect(getTwoColumnItemWidth(0, 8)).toBe(0);
    expect(getColumnItemWidth(100, 8, 0)).toBe(0);
  });

  test('chooses the largest responsive column count that preserves the minimum item width', () => {
    expect(getResponsiveColumnCount(320, 8, 4, 76)).toBe(3);
    expect(getResponsiveColumnCount(320, 8, 4, 72)).toBe(4);
    expect(getResponsiveColumnCount(344, 8, 4, 76)).toBe(4);
    expect(getResponsiveColumnCount(280, 8, 2, 148)).toBe(1);
    expect(getResponsiveColumnCount(320, 8, 2, 148)).toBe(2);
    expect(getResponsiveColumnCount(371, 8, 2, 148)).toBe(2);
  });

  test('keeps Android banner width inside the visible content width', () => {
    expect(getBoundedItemWidth(280, 292)).toBe(280);
    expect(getBoundedItemWidth(320, 292)).toBe(292);
    expect(getBoundedItemWidth(0, 292)).toBe(0);
  });
});
