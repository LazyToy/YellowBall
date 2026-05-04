import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  activateString,
  addString,
  deactivateString,
  getAllStrings,
  updateString,
} from '@/services/stringCatalogService';
import { uploadStringPhoto } from '@/services/storageService';
import type { StringCatalogItem } from '@/types/database';

export default function AdminStringsScreen() {
  const { profile } = useAuth();
  const actorId = profile?.id;
  const [strings, setStrings] = useState<StringCatalogItem[]>([]);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [gauge, setGauge] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [recommendedStyle, setRecommendedStyle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileUri, setImageFileUri] = useState('');
  const [deactivationReason, setDeactivationReason] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(true);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const loadStrings = useCallback(async () => {
    setStrings(await getAllStrings());
  }, []);

  useEffect(() => {
    loadStrings().catch(() => setMessage('스트링 목록을 불러오지 못했습니다.'));
  }, [loadStrings]);

  const clearForm = () => {
    setBrand('');
    setName('');
    setGauge('');
    setColor('');
    setPrice('');
    setRecommendedStyle('');
    setDescription('');
    setImageUrl('');
    setImageFileUri('');
    setDeactivationReason('');
    setEditingId(null);
  };

  const startEditing = (item: StringCatalogItem) => {
    setEditingId(item.id);
    setBrand(item.brand);
    setName(item.name);
    setGauge(item.gauge ?? '');
    setColor(item.color ?? '');
    setPrice(item.price === null ? '' : String(item.price));
    setRecommendedStyle(item.recommended_style ?? '');
    setDescription(item.description ?? '');
    setImageUrl(item.image_url ?? '');
    setImageFileUri('');
    setDeactivationReason(item.deactivation_reason ?? '');
  };

  const resolveImageUrl = async () => {
    if (!imageFileUri.trim()) {
      return imageUrl || null;
    }

    if (!actorId) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(imageFileUri);
    const blob = await response.blob();

    return uploadStringPhoto(actorId, imageFileUri, blob);
  };

  const runAction = async (task: () => Promise<void>, successMessage: string) => {
    if (!actorId) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    try {
      setIsBusy(true);
      await task();
      await loadStrings();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '작업에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = async () => {
    await runAction(async () => {
      const parsedPrice = price.trim() ? Number(price) : null;
      const payload = {
        brand,
        name,
        gauge: gauge || null,
        color: color || null,
        price: Number.isFinite(parsedPrice) ? parsedPrice : null,
        recommended_style: recommendedStyle || null,
        description: description || null,
        image_url: await resolveImageUrl(),
      };

      if (editingId) {
        await updateString(actorId ?? '', editingId, payload);
      } else {
        await addString(actorId ?? '', payload);
      }

      clearForm();
    }, editingId ? '스트링을 수정했습니다.' : '스트링을 등록했습니다.');
  };

  const filteredStrings = showInactive
    ? strings
    : strings.filter((item) => item.is_active);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">스트링 카탈로그</Typography>
        <Typography variant="caption">등록, 수정, 비활성화를 관리합니다.</Typography>
      </View>

      <View style={styles.section}>
        <Input label="브랜드" onChangeText={setBrand} value={brand} />
        <Input label="이름" onChangeText={setName} value={name} />
        <Input label="게이지" onChangeText={setGauge} value={gauge} />
        <Input label="색상" onChangeText={setColor} value={color} />
        <Input
          keyboardType="numeric"
          label="가격"
          onChangeText={setPrice}
          value={price}
        />
        <Input
          label="추천 스타일"
          onChangeText={setRecommendedStyle}
          value={recommendedStyle}
        />
        <Input label="설명" onChangeText={setDescription} value={description} />
        <Input label="이미지 URL" onChangeText={setImageUrl} value={imageUrl} />
        <Input
          label="이미지 파일 URI"
          onChangeText={setImageFileUri}
          placeholder="file:///..."
          value={imageFileUri}
        />
        <View style={styles.actions}>
          <Button disabled={isBusy} onPress={handleSave}>
            {editingId ? '수정 저장' : '스트링 등록'}
          </Button>
          {editingId ? (
            <Button disabled={isBusy} onPress={clearForm} variant="outline">
              취소
            </Button>
          ) : null}
          <Button
            onPress={() => setShowInactive((current) => !current)}
            variant="outline"
          >
            {showInactive ? '활성만 보기' : '전체 보기'}
          </Button>
        </View>
      </View>

      <View style={styles.section}>
        {filteredStrings.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Typography variant="h2">
                  {item.brand} {item.name}
                </Typography>
                <Typography variant="caption">
                  {item.gauge ?? '-'} · {item.color ?? '-'} ·{' '}
                  {item.price === null ? '가격 미정' : `${item.price}원`}
                </Typography>
              </View>
              <Badge variant={item.is_active ? 'success' : 'outline'}>
                {item.is_active ? '활성' : '비활성'}
              </Badge>
            </View>
            {item.description ? (
              <Typography variant="body">{item.description}</Typography>
            ) : null}
            {item.deactivation_reason ? (
              <Typography variant="caption">
                비활성 사유: {item.deactivation_reason}
              </Typography>
            ) : null}
            <View style={styles.actions}>
              <Button
                disabled={isBusy}
                onPress={() => startEditing(item)}
                size="sm"
                variant="outline"
              >
                수정
              </Button>
              {item.is_active ? (
                <>
                  <Input
                    containerStyle={styles.reasonInput}
                    label="비활성 사유"
                    onChangeText={setDeactivationReason}
                    value={deactivationReason}
                  />
                  <Button
                    disabled={isBusy}
                    onPress={() =>
                      runAction(
                        () =>
                          deactivateString(
                            actorId ?? '',
                            item.id,
                            deactivationReason || '관리자 비활성화',
                          ).then(() => undefined),
                        '스트링을 비활성화했습니다.',
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    비활성화
                  </Button>
                </>
              ) : (
                <Button
                  disabled={isBusy}
                  onPress={() =>
                    runAction(
                      () => activateString(actorId ?? '', item.id).then(() => undefined),
                      '스트링을 활성화했습니다.',
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  활성화
                </Button>
              )}
            </View>
          </View>
        ))}
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    gap: theme.spacing[5],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  header: {
    gap: theme.spacing[2],
  },
  section: {
    gap: theme.spacing[3],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  reasonInput: {
    minWidth: 180,
  },
  message: {
    color: lightColors.mutedForeground.hex,
  },
});
