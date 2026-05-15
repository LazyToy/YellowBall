import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { Input } from '@/components/Input';
import { PhotoPicker } from '@/components/PhotoPicker';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { StringPicker } from '@/components/StringPicker';
import { Typography } from '@/components/Typography';
import { BackButton } from '@/components/MobileUI';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import {
  addRacket,
  getRackets,
  updateRacket,
} from '@/services/racketService';
import { getActiveStrings } from '@/services/stringCatalogService';
import {
  addSetup,
  getSetupsByRacket,
  updateSetup,
} from '@/services/stringSetupService';
import { uploadRacketPhoto } from '@/services/storageService';
import type { StringCatalogItem, UserRacket } from '@/types/database';

export default function RacketsScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { profile } = useAuth();
  const profileId = profile?.id;

  // 라켓 목록
  const [rackets, setRackets] = useState<UserRacket[]>([]);

  // 라켓 기본 필드
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [gripSize, setGripSize] = useState('');
  const [weight, setWeight] = useState('');
  const [balance, setBalance] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileUri, setPhotoFileUri] = useState('');
  const [memo, setMemo] = useState('');

  // 스트링 설정 (user_string_setups)
  const [stringCatalog, setStringCatalog] = useState<StringCatalogItem[]>([]);
  const [mainStringId, setMainStringId] = useState<string | null>(null);
  const [crossStringId, setCrossStringId] = useState<string | null>(null);
  const [tensionMain, setTensionMain] = useState('');
  const [tensionCross, setTensionCross] = useState('');
  const [isHybrid, setIsHybrid] = useState(false);
  // 편집 중인 스트링 셋업 ID (업데이트용)
  const [editingSetupId, setEditingSetupId] = useState<string | null>(null);

  // 편집 상태
  const [editingRacketId, setEditingRacketId] = useState<string | null>(null);
  const [appliedEditId, setAppliedEditId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>();
  const [successDialog, setSuccessDialog] = useState<{
    title: string;
    message?: string;
  } | null>(null);

  // 스트링 카탈로그 로드
  useEffect(() => {
    getActiveStrings()
      .then(setStringCatalog)
      .catch(() => setMessage('스트링 목록을 불러오지 못했습니다.'));
  }, []);

  const loadRackets = useCallback(async () => {
    if (!profileId) {
      return;
    }

    setRackets(await getRackets(profileId));
  }, [profileId]);

  useEffect(() => {
    loadRackets().catch(() => setMessage('라켓을 불러오지 못했습니다.'));
  }, [loadRackets]);

  const clearForm = useCallback(() => {
    setBrand('');
    setModel('');
    setGripSize('');
    setWeight('');
    setBalance('');
    setPhotoUrl('');
    setPhotoFileUri('');
    setMemo('');
    setMainStringId(null);
    setCrossStringId(null);
    setTensionMain('');
    setTensionCross('');
    setIsHybrid(false);
    setEditingSetupId(null);
    setEditingRacketId(null);
  }, []);

  const resetScreen = useCallback(() => {
    clearForm();
    setAppliedEditId(editId ?? null);
    setMessage(undefined);
    setSuccessDialog(null);
  }, [clearForm, editId]);

  useResetOnBlur(resetScreen);

  const startEditing = async (racket: UserRacket) => {
    setEditingRacketId(racket.id);
    setBrand(racket.brand);
    setModel(racket.model);
    setGripSize(racket.grip_size ?? '');
    setWeight(racket.weight === null ? '' : String(racket.weight));
    setBalance(racket.balance ?? '');
    setPhotoUrl(racket.photo_url ?? '');
    setPhotoFileUri('');
    setMemo(racket.memo ?? '');

    // 기존 스트링 셋업 불러오기
    try {
      if (profileId) {
        const setups = await getSetupsByRacket(profileId, racket.id);
        const latest = setups[0] ?? null;

        if (latest) {
          setEditingSetupId(latest.id);
          setMainStringId(latest.main_string_id);
          setCrossStringId(latest.is_hybrid ? latest.cross_string_id : null);
          setTensionMain(String(latest.tension_main));
          setTensionCross(String(latest.tension_cross));
          setIsHybrid(latest.is_hybrid);
        } else {
          setEditingSetupId(null);
          setMainStringId(null);
          setCrossStringId(null);
          setTensionMain('');
          setTensionCross('');
          setIsHybrid(false);
        }
      }
    } catch {
      // 스트링 셋업 로드 실패 시 무시 (라켓 수정은 계속 가능)
    }
  };

  useEffect(() => {
    if (!editId || editId === appliedEditId || rackets.length === 0) {
      return;
    }

    const racket = rackets.find((item) => item.id === editId);

    if (!racket) {
      setMessage('수정할 라켓을 찾지 못했습니다.');
      setAppliedEditId(editId);
      return;
    }

    startEditing(racket).catch(() =>
      setMessage('라켓 정보를 불러오지 못했습니다.'),
    );
    setAppliedEditId(editId);
    // startEditing은 편집 상태를 설정하는 화면 로컬 작업이라 deps에 넣으면 editId 자동 적용 타이밍이 바뀐다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedEditId, editId, rackets]);

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

      const racketPayload = {
        brand,
        model,
        grip_size: gripSize || null,
        weight: Number.isFinite(parsedWeight) ? parsedWeight : null,
        balance: balance || null,
        photo_url: nextPhotoUrl,
        memo: memo || null,
      };

      const wasEditing = editingRacketId !== null;
      let savedRacketId = editingRacketId;

      if (editingRacketId) {
        await updateRacket(editingRacketId, racketPayload);
      } else {
        const newRacket = await addRacket({
          owner_id: profile.id,
          ...racketPayload,
        });

        savedRacketId = newRacket.id;
      }

      // 스트링 셋업 저장 (스트링 선택 + 텐션 입력한 경우만)
      if (savedRacketId && mainStringId && tensionMain.trim()) {
        const parsedTensionMain = Number(tensionMain);
        const parsedTensionCross = tensionCross.trim()
          ? Number(tensionCross)
          : parsedTensionMain;

        // 텐션 유효성 검사 (20-70)
        if (
          !Number.isInteger(parsedTensionMain) ||
          parsedTensionMain < 20 ||
          parsedTensionMain > 70
        ) {
          setMessage('메인 텐션은 20~70 lb 사이의 정수여야 합니다.');
          return;
        }

        if (
          !Number.isInteger(parsedTensionCross) ||
          parsedTensionCross < 20 ||
          parsedTensionCross > 70
        ) {
          setMessage('크로스 텐션은 20~70 lb 사이의 정수여야 합니다.');
          return;
        }

        const effectiveCrossStringId = isHybrid
          ? (crossStringId ?? mainStringId)
          : mainStringId;

        const setupPayload = {
          user_id: profile.id,
          racket_id: savedRacketId,
          main_string_id: mainStringId,
          cross_string_id: effectiveCrossStringId,
          tension_main: parsedTensionMain,
          tension_cross: parsedTensionCross,
          is_hybrid: isHybrid,
          memo: null,
        };

        if (editingSetupId) {
          // 기존 셋업 업데이트
          await updateSetup(editingSetupId, {
            main_string_id: setupPayload.main_string_id,
            cross_string_id: setupPayload.cross_string_id,
            tension_main: setupPayload.tension_main,
            tension_cross: setupPayload.tension_cross,
            is_hybrid: setupPayload.is_hybrid,
          });
        } else {
          // 새 셋업 삽입
          await addSetup(setupPayload);
        }
      }

      clearForm();
      await loadRackets();
      setSuccessDialog({
        title: wasEditing ? '라켓 정보가 수정되었습니다' : '라켓이 등록되었습니다',
        message: '확인을 누르면 라켓 목록을 확인할 수 있습니다.',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '라켓 저장 실패');
    }
  };

  const mainStringItem =
    stringCatalog.find((s) => s.id === mainStringId) ?? null;

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <FeedbackDialog
        visible={successDialog !== null}
        title={successDialog?.title ?? ''}
        message={successDialog?.message}
        onConfirm={() => {
          setSuccessDialog(null);
          router.replace('/racket-list');
        }}
      />
      <View style={styles.titleRow}>
        <BackButton onPress={() => router.back()} />
        <Typography variant="h1">
          {editingRacketId ? '라켓 수정' : '라켓 추가'}
        </Typography>
      </View>

      {/* 라켓 등록/수정 폼 */}
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
        <Input label="밸런스" onChangeText={setBalance} value={balance} />
        <PhotoPicker
          currentUri={photoUrl}
          label="사진"
          onSelectUri={setPhotoFileUri}
          selectedUri={photoFileUri}
        />

        {/* ── 스트링 셋업 섹션 ── */}
        <Typography variant="h2">스트링 설정</Typography>

        <StringPicker
          label="메인 스트링"
          selectedId={mainStringId}
          strings={stringCatalog}
          onSelect={(item) => {
            setMainStringId(item.id);
            // 하이브리드가 아니면 크로스도 동일하게
            if (!isHybrid) {
              setCrossStringId(item.id);
            }
          }}
        />

        <View style={styles.tensionRow}>
          <View style={styles.flex1}>
            <Input
              keyboardType="numeric"
              label="메인 텐션 (lb)"
              onChangeText={setTensionMain}
              value={tensionMain}
              placeholder="20~70"
            />
          </View>
          {isHybrid && (
            <View style={styles.flex1}>
              <Input
                keyboardType="numeric"
                label="크로스 텐션 (lb)"
                onChangeText={setTensionCross}
                value={tensionCross}
                placeholder="20~70"
              />
            </View>
          )}
        </View>

        {/* 하이브리드 토글 */}
        <Button
          accessibilityLabel={
            isHybrid ? '메인/크로스 동일 스트링으로 변경' : '하이브리드 설정'
          }
          onPress={() => {
            setIsHybrid((v) => !v);
            if (isHybrid) {
              // 하이브리드 해제 시 크로스를 메인과 동일하게
              setCrossStringId(mainStringId);
              setTensionCross('');
            }
          }}
          size="sm"
          variant="outline"
        >
          {isHybrid ? '하이브리드 해제' : '하이브리드 설정 (크로스 따로)'}
        </Button>

        {isHybrid && (
          <StringPicker
            label="크로스 스트링"
            selectedId={crossStringId}
            strings={stringCatalog}
            onSelect={(item) => setCrossStringId(item.id)}
          />
        )}

        {/* 메인 스트링 미선택 시 안내 */}
        {!mainStringId && (
          <Typography variant="caption" style={styles.muted}>
            💡 스트링을 선택하지 않으면 스트링 정보 없이 라켓만 저장됩니다.
          </Typography>
        )}

        {/* 현재 선택된 메인 스트링 표시 */}
        {mainStringItem && (
          <Typography variant="caption" style={styles.stringHint}>
            선택됨: {mainStringItem.brand} {mainStringItem.name}
            {mainStringItem.gauge ? ` · ${mainStringItem.gauge}` : ''}
          </Typography>
        )}

        <Input label="메모" onChangeText={setMemo} value={memo} />

        <Button
          accessibilityLabel={editingRacketId ? '라켓 수정 저장' : '라켓 추가'}
          onPress={handleSaveRacket}
        >
          {editingRacketId ? '수정 저장' : '라켓 추가'}
        </Button>
        {editingRacketId ? (
          <Button
            accessibilityLabel="라켓 수정 취소"
            onPress={clearForm}
            variant="outline"
          >
            취소
          </Button>
        ) : null}
      </View>

      {message ? (
        <Typography
          accessibilityRole="alert"
          variant="caption"
          style={styles.muted}
        >
          {message}
        </Typography>
      ) : null}
    </RefreshableScrollView>
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
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  stringHint: {
    color: lightColors.primary.hex,
  },
  flex1: {
    flex: 1,
  },
  tensionRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
});
