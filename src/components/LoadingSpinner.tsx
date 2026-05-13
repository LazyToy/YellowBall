import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { Text } from '@/components/AppText';
import { sharedTextStyles } from '../constants/componentStyles';
import { lightColors, theme } from '../constants/theme';

export type LoadingSpinnerProps = Omit<ViewProps, 'style'> & {
  fullScreen?: boolean;
  label?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function LoadingSpinner({
  fullScreen = false,
  label,
  size = 'small',
  color = lightColors.primary.hex,
  style,
  testID,
  ...viewProps
}: LoadingSpinnerProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? '로딩 중'}
      style={[fullScreen ? styles.fullScreen : styles.inline, style]}
      testID={testID ?? (fullScreen ? 'loading-spinner-fullscreen' : 'loading-spinner')}
      {...viewProps}
    >
      <ActivityIndicator color={color} size={size} testID="activity-indicator" />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
    justifyContent: 'center',
  },
  fullScreen: {
    alignItems: 'center',
    backgroundColor: lightColors.background.hex,
    flex: 1,
    gap: theme.spacing[3],
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  label: {
    ...sharedTextStyles.body,
    color: lightColors.mutedForeground.hex,
  },
});
