import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  addDemoRacket,
  getAllDemoRackets,
  updateDemoRacket,
  updateStatus,
} from '@/services/demoRacketService';
import { uploadDemoRacketPhoto } from '@/services/storageService';
import type { DemoRacket, DemoRacketStatus } from '@/types/database';

const statuses: DemoRacketStatus[] = [
  'active',
  'inactive',
  'maintenance',
  'damaged',
  'sold',
  'hidden',
];

const statusLabels: Record<DemoRacketStatus, string> = {
  active: '활성',
  inactive: '비활성',
  maintenance: '정비',
  damaged: '파손',
  sold: '판매됨',
  hidden: '숨김',
};

export default function AdminDemoRacketsScreen() {
  const { profile } = useAuth();
  const actorId = profile?.id;
  const [rackets, setRackets] = useState<DemoRacket[]>([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [gripSize, setGripSize] = useState('');
  const [weight, setWeight] = useState('');
  const [headSize, setHeadSize] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileUri, setPhotoFileUri] = useState('');
  const [description, setDescription] = useState('');
  const [isDemoEnabled, setIsDemoEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const loadRackets = useCallback(async () => {
    setRackets(await getAllDemoRackets());
  }, []);

  useEffect(() => {
    loadRackets().catch(() => setMessage('시타 라켓 목록을 불러오지 못했습니다.'));
  }, [loadRackets]);

  const clearForm = () => {
    setBrand('');
    setModel('');
    setGripSize('');
    setWeight('');
    setHeadSize('');
    setPhotoUrl('');
    setPhotoFileUri('');
    setDescription('');
    setIsDemoEnabled(true);
    setIsActive(true);
    setEditingId(null);
  };

  const startEditing = (racket: DemoRacket) => {
    setEditingId(racket.id);
    setBrand(racket.brand);
    setModel(racket.model);
    setGripSize(racket.grip_size ?? '');
    setWeight(racket.weight === null ? '' : String(racket.weight));
    setHeadSize(racket.head_size ?? '');
    setPhotoUrl(racket.photo_url ?? '');
    setPhotoFileUri('');
    setDescription(racket.description ?? '');
    setIsDemoEnabled(racket.is_demo_enabled);
    setIsActive(racket.is_active);
  };

  const resolvePhotoUrl = async () => {
    if (!photoFileUri.trim()) {
      return photoUrl || null;
    }

    if (!actorId) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(photoFileUri);
    const blob = await response.blob();

    return uploadDemoRacketPhoto(actorId, photoFileUri, blob);
  };

  const runAction = async (task: () => Promise<void>, successMessage: string) => {
    if (!actorId) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    try {
      setIsBusy(true);
      await task();
      await loadRackets();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '작업에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = async () => {
    await runAction(async () => {
      const parsedWeight = weight.trim() ? Number(weight) : null;
      const payload = {
        brand,
        model,
        grip_size: gripSize || null,
        weight: Number.isFinite(parsedWeight) ? parsedWeight : null,
        head_size: headSize || null,
        photo_url: await resolvePhotoUrl(),
        description: description || null,
        is_demo_enabled: isDemoEnabled,
        is_active: isActive,
      };

      if (editingId) {
        await updateDemoRacket(actorId ?? '', editingId, payload);
      } else {
        await addDemoRacket(actorId ?? '', payload);
      }

      clearForm();
    }, editingId ? '시타 라켓을 수정했습니다.' : '시타 라켓을 등록했습니다.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">시타 라켓</Typography>
        <Typography variant="caption">라켓 정보와 운영 상태를 관리합니다.</Typography>
      </View>

      <View style={styles.section}>
        <Input label="브랜드" onChangeText={setBrand} value={brand} />
        <Input label="모델" onChangeText={setModel} value={model} />
        <Input label="그립 사이즈" onChangeText={setGripSize} value={gripSize} />
        <Input
          keyboardType="numeric"
          label="무게(g)"
          onChangeText={setWeight}
          value={weight}
        />
        <Input label="헤드 사이즈" onChangeText={setHeadSize} value={headSize} />
        <Input label="사진 URL" onChangeText={setPhotoUrl} value={photoUrl} />
        <Input
          label="사진 파일 URI"
          onChangeText={setPhotoFileUri}
          placeholder="file:///..."
          value={photoFileUri}
        />
        <Input label="설명" onChangeText={setDescription} value={description} />
        <View style={styles.switchRow}>
          <Typography variant="body">시타 예약 허용</Typography>
          <Switch onValueChange={setIsDemoEnabled} value={isDemoEnabled} />
        </View>
        <View style={styles.switchRow}>
          <Typography variant="body">목록 노출</Typography>
          <Switch onValueChange={setIsActive} value={isActive} />
        </View>
        <View style={styles.actions}>
          <Button disabled={isBusy} onPress={handleSave}>
            {editingId ? '수정 저장' : '시타 라켓 등록'}
          </Button>
          {editingId ? (
            <Button disabled={isBusy} onPress={clearForm} variant="outline">
              취소
            </Button>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        {rackets.map((racket) => (
          <View key={racket.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Typography variant="h2">
                  {racket.brand} {racket.model}
                </Typography>
                <Typography variant="caption">
                  그립 {racket.grip_size ?? '-'} · 무게 {racket.weight ?? '-'}g ·
                  헤드 {racket.head_size ?? '-'}
                </Typography>
              </View>
              <Badge
                variant={
                  racket.status === 'active' && racket.is_demo_enabled && racket.is_active
                    ? 'success'
                    : 'outline'
                }
              >
                {statusLabels[racket.status]}
              </Badge>
            </View>
            {racket.description ? (
              <Typography variant="body">{racket.description}</Typography>
            ) : null}
            <Typography variant="caption">
              예약 {racket.is_demo_enabled ? '허용' : '중지'} · 노출{' '}
              {racket.is_active ? 'ON' : 'OFF'}
            </Typography>
            <View style={styles.actions}>
              <Button
                disabled={isBusy}
                onPress={() => startEditing(racket)}
                size="sm"
                variant="outline"
              >
                수정
              </Button>
              {statuses.map((status) => (
                <Button
                  disabled={isBusy || racket.status === status}
                  key={status}
                  onPress={() =>
                    runAction(
                      () =>
                        updateStatus(actorId ?? '', racket.id, status).then(
                          () => undefined,
                        ),
                      '시타 라켓 상태를 변경했습니다.',
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  {statusLabels[status]}
                </Button>
              ))}
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
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: theme.controlHeights.md,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  message: {
    color: lightColors.mutedForeground.hex,
  },
});
