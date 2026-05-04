import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  addRacket,
  deleteRacket,
  getRackets,
  setPrimaryRacket,
  updateRacket,
} from '@/services/racketService';
import { uploadRacketPhoto } from '@/services/storageService';
import type { UserRacket } from '@/types/database';

export default function RacketsScreen() {
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [rackets, setRackets] = useState<UserRacket[]>([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [gripSize, setGripSize] = useState('');
  const [weight, setWeight] = useState('');
  const [balance, setBalance] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileUri, setPhotoFileUri] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedRacketId, setSelectedRacketId] = useState<string | null>(null);
  const [editingRacketId, setEditingRacketId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>();

  const loadRackets = useCallback(async () => {
    if (!profileId) {
      return;
    }

    setRackets(await getRackets(profileId));
  }, [profileId]);

  useEffect(() => {
    loadRackets().catch(() => setMessage('라켓을 불러오지 못했습니다.'));
  }, [loadRackets]);

  const selectedRacket = rackets.find((racket) => racket.id === selectedRacketId);

  const clearForm = () => {
    setBrand('');
    setModel('');
    setGripSize('');
    setWeight('');
    setBalance('');
    setPhotoUrl('');
    setPhotoFileUri('');
    setMemo('');
    setEditingRacketId(null);
  };

  const startEditing = (racket: UserRacket) => {
    setSelectedRacketId(racket.id);
    setEditingRacketId(racket.id);
    setBrand(racket.brand);
    setModel(racket.model);
    setGripSize(racket.grip_size ?? '');
    setWeight(racket.weight === null ? '' : String(racket.weight));
    setBalance(racket.balance ?? '');
    setPhotoUrl(racket.photo_url ?? '');
    setPhotoFileUri('');
    setMemo(racket.memo ?? '');
  };

  const resolvePhotoUrl = async () => {
    if (!photoFileUri.trim()) {
      return photoUrl || null;
    }

    if (!profile) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(photoFileUri);
    const blob = await response.blob();

    return uploadRacketPhoto(profile.id, photoFileUri, blob);
  };

  const handleSaveRacket = async () => {
    if (!profile) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    try {
      const parsedWeight = weight.trim() ? Number(weight) : null;
      const nextPhotoUrl = await resolvePhotoUrl();
      const payload = {
        brand,
        model,
        grip_size: gripSize || null,
        weight: Number.isFinite(parsedWeight) ? parsedWeight : null,
        balance: balance || null,
        photo_url: nextPhotoUrl,
        memo: memo || null,
      };

      if (editingRacketId) {
        await updateRacket(editingRacketId, payload);
      } else {
        await addRacket({
          owner_id: profile.id,
          ...payload,
        });
      }

      clearForm();
      setMessage('라켓이 저장되었습니다.');
      await loadRackets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '라켓 저장 실패');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h1">내 라켓</Typography>
      <View style={styles.section}>
        <Input label="브랜드" onChangeText={setBrand} value={brand} />
        <Input label="모델" onChangeText={setModel} value={model} />
        <Input label="그립 사이즈" onChangeText={setGripSize} value={gripSize} />
        <Input keyboardType="numeric" label="무게(g)" onChangeText={setWeight} value={weight} />
        <Input label="밸런스" onChangeText={setBalance} value={balance} />
        <Input label="사진 URL" onChangeText={setPhotoUrl} value={photoUrl} />
        <Input
          label="사진 파일 URI"
          onChangeText={setPhotoFileUri}
          placeholder="file:///..."
          value={photoFileUri}
        />
        <Input label="메모" onChangeText={setMemo} value={memo} />
        <Button
          accessibilityLabel={editingRacketId ? '라켓 수정 저장' : '라켓 추가'}
          onPress={handleSaveRacket}
        >
          {editingRacketId ? '수정 저장' : '라켓 추가'}
        </Button>
        {editingRacketId ? (
          <Button accessibilityLabel="라켓 수정 취소" onPress={clearForm} variant="outline">
            취소
          </Button>
        ) : null}
      </View>

      {selectedRacket ? (
        <View style={styles.card}>
          <Typography variant="h2">라켓 상세</Typography>
          <Typography variant="body">
            {selectedRacket.brand} {selectedRacket.model}
          </Typography>
          <Typography variant="caption" style={styles.muted}>
            그립 {selectedRacket.grip_size ?? '-'} · 무게{' '}
            {selectedRacket.weight ?? '-'}g · 밸런스 {selectedRacket.balance ?? '-'}
          </Typography>
          <Typography variant="caption" style={styles.muted}>
            사진 {selectedRacket.photo_url ?? '없음'}
          </Typography>
          {selectedRacket.memo ? (
            <Typography variant="body">{selectedRacket.memo}</Typography>
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        {rackets.map((racket) => (
          <View key={racket.id} style={styles.card}>
            <Typography variant="h2">
              {racket.brand} {racket.model}
            </Typography>
            <Typography variant="caption" style={styles.muted}>
              {racket.is_primary ? '메인 라켓' : '보조 라켓'}
              {racket.grip_size ? ` · ${racket.grip_size}` : ''}
              {racket.weight ? ` · ${racket.weight}g` : ''}
              {racket.balance ? ` · ${racket.balance}` : ''}
            </Typography>
            <Typography variant="caption" style={styles.muted}>
              사진 {racket.photo_url ? '등록됨' : '미등록'}
            </Typography>
            {racket.memo ? <Typography variant="body">{racket.memo}</Typography> : null}
            <View style={styles.actions}>
              <Button
                accessibilityLabel={`${racket.model} 라켓 상세`}
                onPress={() => setSelectedRacketId(racket.id)}
                size="sm"
                variant="outline"
              >
                상세
              </Button>
              <Button
                accessibilityLabel={`${racket.model} 라켓 수정`}
                onPress={() => startEditing(racket)}
                size="sm"
                variant="outline"
              >
                수정
              </Button>
              <Button
                accessibilityLabel={`${racket.model} 메인 라켓 설정`}
                disabled={racket.is_primary}
                onPress={() =>
                  setPrimaryRacket(racket.id)
                    .then(loadRackets)
                    .catch(() => setMessage('메인 라켓 설정 실패'))
                }
                size="sm"
                variant="outline"
              >
                메인
              </Button>
              <Button
                accessibilityLabel={`${racket.model} 라켓 삭제`}
                onPress={() =>
                  deleteRacket(racket.id)
                    .then(loadRackets)
                    .catch(() => setMessage('라켓 삭제 실패'))
                }
                size="sm"
                variant="outline"
              >
                삭제
              </Button>
            </View>
          </View>
        ))}
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.muted}>
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
  section: {
    gap: theme.spacing[3],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[2],
    padding: theme.spacing[4],
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
});
