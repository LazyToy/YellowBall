import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { sharedControlStyles, sharedTextStyles } from '../constants/componentStyles';
import { lightColors, theme } from '../constants/theme';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    secureTextEntry,
    editable = true,
    containerStyle,
    inputStyle,
    labelStyle,
    errorStyle,
    style,
    accessibilityLabel,
    ...textInputProps
  },
  ref,
) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const canTogglePassword = Boolean(secureTextEntry);
  const isSecureEntry = canTogglePassword && !passwordVisible;
  const invalid = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          sharedControlStyles.border,
          sharedControlStyles.mediumHeight,
          invalid && styles.inputWrapInvalid,
          !editable && sharedControlStyles.disabled,
        ]}
      >
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          editable={editable}
          placeholderTextColor={lightColors.mutedForeground.hex}
          ref={ref}
          secureTextEntry={isSecureEntry}
          style={[styles.input, inputStyle, style]}
          {...textInputProps}
        />
        {canTogglePassword ? (
          <Pressable
            accessibilityLabel={passwordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
            accessibilityRole="button"
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={[styles.passwordToggle, sharedControlStyles.smallHeight]}
          >
            <Text style={styles.passwordToggleText}>
              {passwordVisible ? '숨김' : '보기'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, errorStyle]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[2],
    width: '100%',
  },
  label: {
    ...sharedTextStyles.control,
    color: lightColors.foreground.hex,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: lightColors.input.hex,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing[3],
    ...theme.shadow.card,
  },
  inputWrapInvalid: {
    borderColor: lightColors.destructive.hex,
  },
  input: {
    ...sharedTextStyles.body,
    color: lightColors.foreground.hex,
    flex: 1,
    minHeight: theme.controlHeights.md,
    paddingVertical: theme.spacing[1],
  },
  passwordToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: theme.spacing[2],
  },
  passwordToggleText: {
    color: lightColors.primary.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.lineHeight.xs,
  },
  error: {
    ...sharedTextStyles.helper,
    color: lightColors.destructive.hex,
  },
});
