import { StyleSheet } from 'react-native';

import { lightColors, theme } from './theme';

export const sharedTextStyles = StyleSheet.create({
  body: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  small: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  caption: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.caption,
    lineHeight: theme.typography.lineHeight.caption,
  },
  control: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.lineHeight.sm,
  },
  helper: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});

export const sharedControlStyles = StyleSheet.create({
  border: {
    borderWidth: theme.borderWidth.hairline,
  },
  disabled: {
    opacity: theme.opacity.disabled,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
  mediumHeight: {
    minHeight: theme.controlHeights.md,
  },
  smallHeight: {
    minHeight: theme.controlHeights.sm,
  },
  largeHeight: {
    minHeight: theme.controlHeights.lg,
  },
  tabHeight: {
    minHeight: theme.controlHeights.tab,
  },
});
