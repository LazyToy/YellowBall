import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@/components/AppText';
import { lightColors, theme } from '@/constants/theme';

import { Button } from './Button';
import { Typography } from './Typography';

type PhotoPickerProps = {
  label: string;
  selectedUri: string;
  currentUri?: string | null;
  onSelectUri: (uri: string) => void;
};

const pickerOptions: ImagePicker.ImagePickerOptions = {
  allowsEditing: true,
  mediaTypes: ['images'],
  quality: 0.85,
};

const getPickerAssetUri = (result: ImagePicker.ImagePickerResult) => {
  if (result.canceled) {
    return null;
  }

  return result.assets[0]?.uri ?? null;
};

export function PhotoPicker({
  currentUri,
  label,
  onSelectUri,
  selectedUri,
}: PhotoPickerProps) {
  const [error, setError] = useState<string>();
  const previewUri = selectedUri || currentUri || null;

  const pickFromLibrary = async () => {
    setError(undefined);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('사진 접근 권한이 필요합니다.');
      return;
    }

    const uri = getPickerAssetUri(
      await ImagePicker.launchImageLibraryAsync(pickerOptions),
    );

    if (uri) {
      onSelectUri(uri);
    }
  };

  const takePhoto = async () => {
    setError(undefined);

    if (Platform.OS === 'web') {
      Alert.alert('이용 불가', '웹에서는 사진 촬영 기능을 이용할 수 없습니다.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError('카메라 권한이 필요합니다.');
      return;
    }

    const uri = getPickerAssetUri(
      await ImagePicker.launchCameraAsync(pickerOptions),
    );

    if (uri) {
      onSelectUri(uri);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="caption">{label}</Typography>
      {previewUri ? (
        <Image
          accessibilityLabel={`${label} 미리보기`}
          resizeMode="cover"
          source={{ uri: previewUri }}
          style={styles.preview}
        />
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.emptyText}>사진 미선택</Text>
        </View>
      )}
      <View style={styles.actions}>
        <Button onPress={pickFromLibrary} size="sm" variant="outline">
          사진 첨부
        </Button>
        <Button onPress={takePhoto} size="sm" variant="outline">
          사진 촬영
        </Button>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[2],
    width: '100%',
  },
  preview: {
    backgroundColor: lightColors.muted.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    aspectRatio: 1,
    width: '100%',
  },
  emptyPreview: {
    alignItems: 'center',
    backgroundColor: lightColors.muted.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed',
    borderWidth: theme.borderWidth.hairline,
    aspectRatio: 1,
    justifyContent: 'center',
    width: '100%',
  },
  emptyText: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  errorText: {
    color: lightColors.destructive.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
  },
});
