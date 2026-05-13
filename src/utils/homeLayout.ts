import {
  getColumnItemWidth,
  getResponsiveColumnCount,
} from '@/utils/responsiveLayout';

export type HomeGridLayout = {
  columns: number;
  gap: number;
  itemWidth: number;
  rowWidth: number;
};

export const getSafeHomeContentWidth = (
  measuredContentWidth: number | null | undefined,
  fallbackContentWidth: number,
) => {
  const normalizedFallback = Number.isFinite(fallbackContentWidth)
    ? Math.max(0, Math.floor(fallbackContentWidth))
    : 0;

  if (!Number.isFinite(measuredContentWidth) || !measuredContentWidth) {
    return normalizedFallback;
  }

  const normalizedMeasured = Math.max(0, Math.floor(measuredContentWidth));

  return Math.min(normalizedMeasured, normalizedFallback);
};

export const getHomeBannerLayout = (
  viewportWidth: number,
  horizontalPadding: number,
  gap: number,
  columns = 2,
  minItemWidth = 0,
) => {
  const contentWidth = Math.max(
    0,
    Math.floor(viewportWidth - horizontalPadding * 2),
  );
  const normalizedGap = Math.max(0, gap);
  const preferredColumns = Math.max(1, Math.floor(columns));
  const normalizedColumns =
    minItemWidth > 0
      ? getResponsiveColumnCount(
          contentWidth,
          normalizedGap,
          preferredColumns,
          minItemWidth,
        )
      : preferredColumns;
  const itemWidth = getColumnItemWidth(
    contentWidth,
    normalizedGap,
    normalizedColumns,
  );

  return {
    columns: normalizedColumns,
    contentWidth,
    gap: normalizedGap,
    itemWidth,
    snapInterval: itemWidth + normalizedGap,
  };
};

export const getHomeBannerMeasuredContentLayout = (
  contentWidth: number,
  gap: number,
  columns = 2,
  minItemWidth = 0,
) => {
  const normalizedContentWidth = Math.max(0, Math.floor(contentWidth));
  const normalizedGap = Math.max(0, gap);
  const preferredColumns = Math.max(1, Math.floor(columns));
  const normalizedColumns =
    minItemWidth > 0
      ? getResponsiveColumnCount(
          normalizedContentWidth,
          normalizedGap,
          preferredColumns,
          minItemWidth,
        )
      : preferredColumns;
  const itemWidth = getColumnItemWidth(
    normalizedContentWidth,
    normalizedGap,
    normalizedColumns,
  );

  return {
    columns: normalizedColumns,
    contentWidth: normalizedContentWidth,
    gap: normalizedGap,
    itemWidth,
    snapInterval: itemWidth + normalizedGap,
  };
};

export const getHomeQuickActionLayout = (
  contentWidth: number,
  gap: number,
  itemCount: number,
  preferredColumns: number,
  minItemWidth: number,
): HomeGridLayout => {
  const normalizedGap = Math.max(0, gap);
  const initialColumns = Math.min(
    Math.max(1, preferredColumns),
    Math.max(1, itemCount),
  );
  const initialItemWidth = getColumnItemWidth(
    contentWidth,
    normalizedGap,
    initialColumns,
  );
  const twoColumnWidth = getColumnItemWidth(contentWidth, normalizedGap, 2);
  const columns =
    initialColumns === 4 &&
    Math.max(1, itemCount) >= 4 &&
    initialItemWidth < minItemWidth &&
    twoColumnWidth >= minItemWidth
      ? 2
      : initialColumns;
  const itemWidth = getColumnItemWidth(contentWidth, normalizedGap, columns);

  return {
    columns,
    gap: normalizedGap,
    itemWidth,
    rowWidth: itemWidth * columns + normalizedGap * Math.max(0, columns - 1),
  };
};

export const getHomeCategoryLayout = (
  contentWidth: number,
  gap: number,
  preferredColumns: number,
  minItemWidth: number,
): HomeGridLayout => {
  const normalizedGap = Math.max(0, gap);
  const columns = getResponsiveColumnCount(
    contentWidth,
    normalizedGap,
    preferredColumns,
    minItemWidth,
  );
  const itemWidth = getColumnItemWidth(contentWidth, normalizedGap, columns);

  return {
    columns,
    gap: normalizedGap,
    itemWidth,
    rowWidth: itemWidth * columns + normalizedGap * Math.max(0, columns - 1),
  };
};
