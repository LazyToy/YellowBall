import React from 'react';
import { StyleProp, StyleSheet, TextProps, TextStyle } from 'react-native';

import { Text } from '@/components/AppText';
import { sharedTextStyles } from '../constants/componentStyles';
import { lightColors, theme } from '../constants/theme';

export type TypographyVariant = 'h1' | 'h2' | 'body' | 'caption';

export type TypographyProps = TextProps & {
  variant?: TypographyVariant;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

export function Typography({
  variant = 'body',
  children,
  style,
  ...textProps
}: TypographyProps) {
  return (
    <Text style={[styles.base, variantStyles[variant], style]} {...textProps}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
  },
  h1: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.h1,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.lineHeight.h1,
  },
  h2: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.h2,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.lineHeight.h2,
  },
  body: {
    ...sharedTextStyles.body,
    fontWeight: theme.typography.fontWeight.regular,
  },
  caption: {
    ...sharedTextStyles.caption,
    color: lightColors.mutedForeground.hex,
    fontWeight: theme.typography.fontWeight.regular,
  },
});

const variantStyles = {
  h1: styles.h1,
  h2: styles.h2,
  body: styles.body,
  caption: styles.caption,
};
