import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { sharedControlStyles, sharedTextStyles } from '../constants/componentStyles';
import { lightColors, theme } from '../constants/theme';

export type CardProps = ViewProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};
export type CardTitleProps = TextProps;
export type CardDescriptionProps = TextProps;

export function Card({ children, style, ...viewProps }: CardProps) {
  return (
    <View style={[styles.card, sharedControlStyles.border, style]} {...viewProps}>
      {children}
    </View>
  );
}

export function CardHeader({ children, style, ...viewProps }: CardProps) {
  return (
    <View style={[styles.header, style]} {...viewProps}>
      {children}
    </View>
  );
}

export function CardContent({ children, style, ...viewProps }: CardProps) {
  return (
    <View style={[styles.content, style]} {...viewProps}>
      {children}
    </View>
  );
}

export function CardFooter({ children, style, ...viewProps }: CardProps) {
  return (
    <View style={[styles.footer, style]} {...viewProps}>
      {children}
    </View>
  );
}

export function CardTitle({ style, ...textProps }: CardTitleProps) {
  return <Text style={[styles.title, style]} {...textProps} />;
}

export function CardDescription({ style, ...textProps }: CardDescriptionProps) {
  return <Text style={[styles.description, style]} {...textProps} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing[6],
    paddingVertical: theme.spacing[6],
    ...theme.shadow.card,
  },
  header: {
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[6],
  },
  content: {
    paddingHorizontal: theme.spacing[6],
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: theme.spacing[6],
  },
  title: {
    ...sharedTextStyles.body,
    color: lightColors.cardForeground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  description: {
    ...sharedTextStyles.helper,
    color: lightColors.mutedForeground.hex,
  },
});
