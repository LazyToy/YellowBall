import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { sharedControlStyles, sharedTextStyles } from '../constants/componentStyles';
import { lightColors, theme } from '../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = buttonVariantStyles[variant];
  const sizeStyle = buttonSizeMap[size];

  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ?? (typeof children === 'string' ? children : undefined)
      }
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle.button,
        sharedControlStyles.border,
        variantStyle.button,
        isDisabled && sharedControlStyles.disabled,
        pressed && !isDisabled && sharedControlStyles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyle.text.color}
          size="small"
          testID="button-loading-spinner"
        />
      ) : null}
      <Text style={[sharedTextStyles.control, sizeStyle.text, variantStyle.text, textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    gap: theme.spacing[2],
    justifyContent: 'center',
  },
});

const buttonSizeStyleSheet = StyleSheet.create({
  smButton: {
    minHeight: theme.controlHeights.sm,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  mdButton: {
    minHeight: theme.controlHeights.md,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  lgButton: {
    minHeight: theme.controlHeights.lg,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[2],
  },
});

const buttonSizeStylesMap = {
  sm: {
    button: buttonSizeStyleSheet.smButton,
    text: sharedTextStyles.control,
  },
  md: {
    button: buttonSizeStyleSheet.mdButton,
    text: sharedTextStyles.control,
  },
  lg: {
    button: buttonSizeStyleSheet.lgButton,
    text: sharedTextStyles.body,
  },
};

const buttonVariantStyleSheet = StyleSheet.create({
  primaryButton: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  primaryText: {
    color: lightColors.primaryForeground.hex,
  },
  secondaryButton: {
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.secondary.hex,
  },
  secondaryText: {
    color: lightColors.secondaryForeground.hex,
  },
  outlineButton: {
    backgroundColor: lightColors.background.hex,
    borderColor: lightColors.border.hex,
    ...theme.shadow.card,
  },
  outlineText: {
    color: lightColors.foreground.hex,
  },
});

const buttonVariantStyles = {
  primary: {
    button: buttonVariantStyleSheet.primaryButton,
    text: buttonVariantStyleSheet.primaryText,
  },
  secondary: {
    button: buttonVariantStyleSheet.secondaryButton,
    text: buttonVariantStyleSheet.secondaryText,
  },
  outline: {
    button: buttonVariantStyleSheet.outlineButton,
    text: buttonVariantStyleSheet.outlineText,
  },
};

const buttonSizeMap = buttonSizeStylesMap;
