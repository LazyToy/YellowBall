import React, { forwardRef } from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

export const appMaxFontSizeMultiplier = 1.1;

export function Text({
  allowFontScaling = false,
  maxFontSizeMultiplier = appMaxFontSizeMultiplier,
  ...props
}: TextProps) {
  return (
    <NativeText
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
    />
  );
}

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(
  function TextInput(
    {
      allowFontScaling = false,
      maxFontSizeMultiplier = appMaxFontSizeMultiplier,
      ...props
    },
    ref,
  ) {
    return (
      <NativeTextInput
        allowFontScaling={allowFontScaling}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        ref={ref}
        {...props}
      />
    );
  },
);
