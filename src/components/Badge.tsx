import React from 'react';
import { StyleProp, StyleSheet, TextProps, TextStyle } from 'react-native';

import { Text } from '@/components/AppText';
import { sharedControlStyles, sharedTextStyles } from '../constants/componentStyles';
import { lightColors, theme } from '../constants/theme';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'outline';

export type BadgeProps = TextProps & {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

export function Badge({
  variant = 'default',
  children,
  style,
  ...textProps
}: BadgeProps) {
  return (
    <Text
      style={[styles.base, sharedControlStyles.border, variantStyles[variant], style]}
      {...textProps}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    ...sharedTextStyles.caption,
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.sm,
    fontWeight: theme.typography.fontWeight.medium,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.componentSpacing.badgeVerticalPadding,
  },
  default: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
    color: lightColors.primaryForeground.hex,
  },
  secondary: {
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.secondary.hex,
    color: lightColors.secondaryForeground.hex,
  },
  success: {
    backgroundColor: lightColors.accent.hex,
    borderColor: lightColors.accent.hex,
    color: lightColors.accentForeground.hex,
  },
  warning: {
    backgroundColor: lightColors.warning.hex,
    borderColor: lightColors.warningBorder.hex,
    color: lightColors.warningForeground.hex,
  },
  destructive: {
    backgroundColor: lightColors.destructive.hex,
    borderColor: lightColors.destructive.hex,
    color: lightColors.destructiveForeground.hex,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: lightColors.border.hex,
    color: lightColors.foreground.hex,
  },
});

const variantStyles = {
  default: styles.default,
  secondary: styles.secondary,
  success: styles.success,
  warning: styles.warning,
  destructive: styles.destructive,
  outline: styles.outline,
};
