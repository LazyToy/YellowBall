import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ConfirmDialog, FeedbackDialog } from '@/components/FeedbackDialog';
import { Input } from '@/components/Input';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import { getRackets } from '@/services/racketService';
import { getActiveStrings } from '@/services/stringCatalogService';
import {
  addSetup,
  deleteSetup,
  getSetups,
  updateSetup,
} from '@/services/stringSetupService';
import type {
  StringCatalogItem,
  UserRacket,
  UserStringSetup,
} from '@/types/database';

const parseTension = (value: string) => Number(value.trim());

export default function StringSetupsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [rackets, setRackets] = useState<UserRacket[]>([]);
  const [strings, setStrings] = useState<StringCatalogItem[]>([]);
  const [setups, setSetups] = useState<UserStringSetup[]>([]);
  const [selectedRacketId, setSelectedRacketId] = useState('');
  const [mainStringId, setMainStringId] = useState('');
  const [crossStringId, setCrossStringId] = useState('');
  const [tensionMain, setTensionMain] = useState('48');
  const [tensionCross, setTensionCross] = useState('48');
  const [isHybrid, setIsHybrid] = useState(false);
  const [memo, setMemo] = useState('');
  const [editingSetupId, setEditingSetupId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{
    title: string;
    message?: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserStringSetup | null>(null);

  const loadData = useCallback(async () => {
    if (!profileId) {
      return;
    }

    const [nextRackets, nextStrings, nextSetups] = await Promise.all([
      getRackets(profileId),
      getActiveStrings(),
      getSetups(profileId),
    ]);

    setRackets(nextRackets);
    setStrings(nextStrings);
    setSetups(nextSetups);
    setSelectedRacketId((current) => current || nextRackets[0]?.id || '');
    setMainStringId((current) => current || nextStrings[0]?.id || '');
    setCrossStringId((current) => current || nextStrings[0]?.id || '');
  }, [profileId]);

  useEffect(() => {
    loadData().catch(() => setMessage('Unable to load string setups.'));
  }, [loadData]);

  const stringNameById = useMemo(() => {
    const names = new Map<string, string>();

    strings.forEach((item) => names.set(item.id, `${item.brand} ${item.name}`));

    return names;
  }, [strings]);

  const racketNameById = useMemo(() => {
    const names = new Map<string, string>();

    rackets.forEach((racket) => names.set(racket.id, `${racket.brand} ${racket.model}`));

    return names;
  }, [rackets]);

  const clearForm = useCallback(() => {
    setEditingSetupId(null);
    setSelectedRacketId(rackets[0]?.id || '');
    setTensionMain('48');
    setTensionCross('48');
    setIsHybrid(false);
    setMemo('');
    setMainStringId(strings[0]?.id || '');
    setCrossStringId(strings[0]?.id || '');
  }, [rackets, strings]);

  const resetScreen = useCallback(() => {
    clearForm();
    setMessage(undefined);
    setIsBusy(false);
    setSuccessDialog(null);
    setDeleteTarget(null);
  }, [clearForm]);

  useResetOnBlur(resetScreen);

  const startEditing = (setup: UserStringSetup) => {
    setEditingSetupId(setup.id);
    setSelectedRacketId(setup.racket_id);
    setMainStringId(setup.main_string_id);
    setCrossStringId(setup.cross_string_id);
    setTensionMain(String(setup.tension_main));
    setTensionCross(String(setup.tension_cross));
    setIsHybrid(setup.is_hybrid);
    setMemo(setup.memo ?? '');
  };

  const saveSetup = async () => {
    if (!profileId) {
      setMessage('Please sign in before saving a string setup.');
      return;
    }

    if (!selectedRacketId || !mainStringId) {
      setMessage('Choose a racket and main string first.');
      return;
    }

    try {
      setIsBusy(true);
      const wasEditing = editingSetupId !== null;
      const payload = {
        racket_id: selectedRacketId,
        main_string_id: mainStringId,
        cross_string_id: isHybrid ? crossStringId || mainStringId : mainStringId,
        tension_main: parseTension(tensionMain),
        tension_cross: parseTension(tensionCross),
        is_hybrid: isHybrid,
        memo,
      };

      if (editingSetupId) {
        await updateSetup(editingSetupId, payload);
      } else {
        await addSetup({
          user_id: profileId,
          ...payload,
        });
      }

      clearForm();
      await loadData();
      setSuccessDialog({
        title: wasEditing ? '스트링 설정이 수정되었습니다' : '스트링 설정이 등록되었습니다',
        message: '확인을 누르면 저장된 설정 목록을 확인할 수 있습니다.',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save string setup.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteSetup = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteSetup(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
      setSuccessDialog({
        title: '스트링 설정이 삭제되었습니다',
        message: '확인을 누르면 저장된 설정 목록을 확인할 수 있습니다.',
      });
    } catch {
      setMessage('Unable to delete string setup.');
    }
  };

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <FeedbackDialog
        visible={successDialog !== null}
        title={successDialog?.title ?? ''}
        message={successDialog?.message}
        onConfirm={() => setSuccessDialog(null)}
      />
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="스트링 설정을 삭제할까요?"
        message={
          deleteTarget
            ? `${deleteTarget.tension_main}/${deleteTarget.tension_cross} lbs`
            : undefined
        }
        confirmLabel="삭제"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSetup}
      />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => router.back()} />
          <Typography variant="h1">String Setups</Typography>
        </View>
        <Typography variant="body" style={styles.muted}>
          Save string and tension combinations for your rackets.
        </Typography>
      </View>

      <View style={styles.section}>
        <Typography variant="h2">Racket</Typography>
        <View style={styles.chipRow}>
          {rackets.map((racket) => (
            <ChoiceChip
              key={racket.id}
              label={`${racket.brand} ${racket.model}`}
              selected={selectedRacketId === racket.id}
              onPress={() => setSelectedRacketId(racket.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Typography variant="h2">
            {editingSetupId ? 'Edit setup' : 'New setup'}
          </Typography>
          <View style={styles.switchRow}>
            <Typography variant="caption">Hybrid</Typography>
            <Switch onValueChange={setIsHybrid} value={isHybrid} />
          </View>
        </View>

        <StringPicker
          label="Main string"
          onSelect={setMainStringId}
          selectedId={mainStringId}
          strings={strings}
        />
        {isHybrid ? (
          <StringPicker
            label="Cross string"
            onSelect={setCrossStringId}
            selectedId={crossStringId}
            strings={strings}
          />
        ) : null}

        <View style={styles.inputRow}>
          <Input
            containerStyle={styles.tensionInput}
            keyboardType="numeric"
            label="Main tension"
            onChangeText={setTensionMain}
            value={tensionMain}
          />
          <Input
            containerStyle={styles.tensionInput}
            keyboardType="numeric"
            label="Cross tension"
            onChangeText={setTensionCross}
            value={tensionCross}
          />
        </View>
        <Input label="Memo" onChangeText={setMemo} value={memo} />
        <View style={styles.actions}>
          <Button disabled={isBusy} onPress={saveSetup}>
            Save setup
          </Button>
          {editingSetupId ? (
            <Button onPress={clearForm} variant="outline">
              Cancel
            </Button>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="h2">Saved Setups</Typography>
        {setups.map((setup) => (
          <View key={setup.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Typography variant="body">
                  {racketNameById.get(setup.racket_id) ?? 'Racket'}
                </Typography>
                <Typography variant="caption" style={styles.muted}>
                  {stringNameById.get(setup.main_string_id) ?? 'Main string'}
                  {setup.is_hybrid
                    ? ` / ${stringNameById.get(setup.cross_string_id) ?? 'Cross string'}`
                    : ''}
                </Typography>
              </View>
              <Badge variant={setup.is_hybrid ? 'secondary' : 'outline'}>
                {setup.is_hybrid ? 'Hybrid' : 'Single'}
              </Badge>
            </View>
            <Typography variant="caption" style={styles.muted}>
              {setup.tension_main}/{setup.tension_cross} lbs
            </Typography>
            {setup.memo ? <Typography variant="body">{setup.memo}</Typography> : null}
            <View style={styles.actions}>
              <Button onPress={() => startEditing(setup)} size="sm" variant="outline">
                Edit
              </Button>
              <Button
                onPress={() => setDeleteTarget(setup)}
                size="sm"
                variant="outline"
              >
                Delete
              </Button>
            </View>
          </View>
        ))}
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </RefreshableScrollView>
  );
}

function StringPicker({
  label,
  onSelect,
  selectedId,
  strings,
}: {
  label: string;
  onSelect: (id: string) => void;
  selectedId: string;
  strings: StringCatalogItem[];
}) {
  return (
    <View style={styles.section}>
      <Typography variant="caption">{label}</Typography>
      <View style={styles.chipRow}>
        {strings.map((item) => (
          <ChoiceChip
            key={item.id}
            label={`${item.brand} ${item.name}`}
            selected={selectedId === item.id}
            onPress={() => onSelect(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

function ChoiceChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Typography
        variant="caption"
        style={[styles.chipText, selected && styles.chipTextSelected]}
      >
        {label}
      </Typography>
    </Pressable>
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
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
    gap: theme.spacing[2],
  },
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  tensionInput: {
    minWidth: 130,
    width: 150,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  chip: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  chipSelected: {
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.primary.hex,
  },
  chipText: {
    color: lightColors.foreground.hex,
  },
  chipTextSelected: {
    color: lightColors.primaryForeground.hex,
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  message: {
    color: lightColors.destructive.hex,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
