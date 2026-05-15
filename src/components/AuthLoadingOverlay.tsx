import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { lightColors, theme } from '@/constants/theme';
import { Text } from './AppText';

type AuthLoadingOverlayProps = {
  label: string;
  caption: string;
  brandLogoSource?: ImageSourcePropType;
  testID: string;
  panelTestID?: string;
  style?: StyleProp<ViewStyle>;
};

export function AuthLoadingOverlay({
  label,
  caption,
  brandLogoSource,
  testID,
  panelTestID,
  style,
}: AuthLoadingOverlayProps) {
  return (
    <View style={[styles.overlay, style]} testID={testID}>
      <View style={styles.panel} testID={panelTestID}>
        <View style={styles.headerRow}>
          <View style={styles.logoShell}>
            {brandLogoSource ? (
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={brandLogoSource}
                style={styles.logo}
              />
            ) : (
              <Text style={styles.logoFallback}>Y</Text>
            )}
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>SECURE</Text>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.spinnerShell}>
            <View style={styles.spinnerHalo} />
            <ActivityIndicator
              color={lightColors.primary.hex}
              size="large"
              testID={`${testID}-spinner`}
            />
          </View>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.caption}>{caption}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={styles.progressSegment} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 20, 15, 0.24)',
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  panel: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.xl,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[5],
    maxWidth: 320,
    overflow: 'hidden',
    padding: theme.spacing[5],
    width: '100%',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoShell: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.border.hex,
    borderRadius: 999,
    borderWidth: theme.borderWidth.hairline,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  logo: {
    height: 31,
    width: 31,
  },
  logoFallback: {
    color: lightColors.primary.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    flexDirection: 'row',
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  statusDot: {
    backgroundColor: lightColors.accent.hex,
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  statusText: {
    color: lightColors.primary.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0,
  },
  content: {
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  spinnerShell: {
    alignItems: 'center',
    height: 64,
    justifyContent: 'center',
    marginBottom: theme.spacing[1],
    width: 64,
  },
  spinnerHalo: {
    backgroundColor: lightColors.accent.hex,
    borderRadius: 999,
    height: 64,
    opacity: 0.18,
    position: 'absolute',
    width: 64,
  },
  title: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 24,
    textAlign: 'center',
  },
  caption: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: theme.spacing[1],
  },
  progressSegment: {
    backgroundColor: lightColors.border.hex,
    borderRadius: 999,
    flex: 1,
    height: 4,
  },
  progressActive: {
    backgroundColor: lightColors.primary.hex,
  },
});
