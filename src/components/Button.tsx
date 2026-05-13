import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { Text } from '@/components/AppText';
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
  testID,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = buttonVariantStyles[variant];
  const sizeStyle = buttonSizeMap[size];
  const flattenedStyle = StyleSheet.flatten(style);
  const flattenedTextStyle = StyleSheet.flatten(textStyle);

  return (
    <View
      style={[
        styles.base,
        sizeStyle.surface,
        sharedControlStyles.border,
        variantStyle.button,
        isDisabled && sharedControlStyles.disabled,
        flattenedStyle,
      ]}
      testID={testID ? `${testID}-surface` : undefined}
    >
      <Pressable
        accessibilityLabel={
          accessibilityLabel ?? (typeof children === 'string' ? children : undefined)
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.pressable,
          sizeStyle.surface,
          pressed && !isDisabled && sharedControlStyles.pressed,
        ]}
        testID={testID}
        {...pressableProps}
      >
        <View
          pointerEvents="none"
          style={[styles.content, sizeStyle.content]}
          testID={testID ? `${testID}-content` : undefined}
        >
          {loading ? (
            <ActivityIndicator
              color={variantStyle.text.color}
              size="small"
              testID="button-loading-spinner"
            />
          ) : null}
          <Text
            adjustsFontSizeToFit
            ellipsizeMode="tail"
            minimumFontScale={0.86}
            numberOfLines={1}
            style={[
              sharedTextStyles.control,
              styles.label,
              sizeStyle.text,
              variantStyle.text,
              flattenedTextStyle,
            ]}
          >
            {children}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  pressable: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    minWidth: 0,
  },
  content: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: theme.spacing[2],
    justifyContent: 'center',
    minWidth: 0,
  },
  label: {
    flexShrink: 1,
    includeFontPadding: false,
    minWidth: 0,
    textAlign: 'center',
  },
});

const buttonSizeStyleSheet = StyleSheet.create({
  smSurface: {
    minHeight: theme.controlHeights.sm,
  },
  smContent: {
    minHeight: theme.controlHeights.sm,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  mdSurface: {
    minHeight: theme.controlHeights.md,
  },
  mdContent: {
    minHeight: theme.controlHeights.md,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  lgSurface: {
    minHeight: theme.controlHeights.lg,
  },
  lgContent: {
    minHeight: theme.controlHeights.lg,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[2],
  },
});

const buttonSizeStylesMap = {
  sm: {
    surface: buttonSizeStyleSheet.smSurface,
    content: buttonSizeStyleSheet.smContent,
    text: sharedTextStyles.control,
  },
  md: {
    surface: buttonSizeStyleSheet.mdSurface,
    content: buttonSizeStyleSheet.mdContent,
    text: sharedTextStyles.control,
  },
  lg: {
    surface: buttonSizeStyleSheet.lgSurface,
    content: buttonSizeStyleSheet.lgContent,
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
