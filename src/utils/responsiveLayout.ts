export const getColumnItemWidth = (
  containerWidth: number,
  gap: number,
  columns: number,
) => {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(gap) ||
    !Number.isFinite(columns) ||
    containerWidth <= 0 ||
    columns < 1
  ) {
    return 0;
  }

  const totalGap = Math.max(0, gap) * Math.max(0, columns - 1);
  const availableWidth = containerWidth - totalGap;

  return availableWidth > 0 ? Math.floor(availableWidth / columns) : 0;
};

export const getTwoColumnItemWidth = (containerWidth: number, gap: number) =>
  getColumnItemWidth(containerWidth, gap, 2);

export const getResponsiveColumnCount = (
  containerWidth: number,
  gap: number,
  preferredColumns: number,
  minItemWidth: number,
) => {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(gap) ||
    !Number.isFinite(preferredColumns) ||
    !Number.isFinite(minItemWidth) ||
    containerWidth <= 0 ||
    preferredColumns < 1 ||
    minItemWidth <= 0
  ) {
    return 1;
  }

  for (let columns = Math.floor(preferredColumns); columns > 1; columns -= 1) {
    if (getColumnItemWidth(containerWidth, gap, columns) >= minItemWidth) {
      return columns;
    }
  }

  return 1;
};

export const getBoundedItemWidth = (
  containerWidth: number,
  maxWidth: number,
) => {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return 0;
  }

  if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
    return Math.floor(containerWidth);
  }

  return Math.floor(Math.min(containerWidth, maxWidth));
};
