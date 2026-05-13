import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Text, TextInput } from '@/components/AppText';
import { lightColors, theme } from '@/constants/theme';
import type { StringCatalogItem } from '@/types/database';

import { Typography } from './Typography';

type StringPickerProps = {
  /** 레이블 (예: "메인 스트링") */
  label: string;
  /** 선택된 스트링 ID */
  selectedId: string | null;
  /** 사용 가능한 스트링 목록 */
  strings: StringCatalogItem[];
  /** 스트링 선택 콜백 */
  onSelect: (item: StringCatalogItem) => void;
};

export function StringPicker({
  label,
  selectedId,
  strings,
  onSelect,
}: StringPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedItem = useMemo(
    () => strings.find((s) => s.id === selectedId) ?? null,
    [strings, selectedId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return strings;
    return strings.filter(
      (s) =>
        s.brand.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [strings, query]);

  const handleSelect = useCallback(
    (item: StringCatalogItem) => {
      onSelect(item);
      setOpen(false);
      setQuery('');
    },
    [onSelect],
  );

  return (
    <View style={styles.wrapper}>
      <Typography variant="caption" style={styles.label}>
        {label}
      </Typography>

      {/* 선택 버튼 */}
      <Pressable
        accessibilityLabel={`${label} 선택`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        {selectedItem ? (
          <View>
            <Text style={styles.selectedMain}>
              {selectedItem.brand} {selectedItem.name}
            </Text>
            {selectedItem.gauge ? (
              <Text style={styles.selectedSub}>{selectedItem.gauge}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.placeholder}>스트링을 선택하세요</Text>
        )}
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {/* 선택 모달 */}
      <Modal
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable
          accessibilityLabel="스트링 선택 닫기"
          onPress={() => setOpen(false)}
          style={styles.backdrop}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Typography variant="h2">{label} 선택</Typography>
            <Pressable
              accessibilityLabel="닫기"
              onPress={() => setOpen(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* 검색창 */}
          <TextInput
            accessibilityLabel="스트링 검색"
            autoFocus
            onChangeText={setQuery}
            placeholder="브랜드 또는 모델 검색..."
            placeholderTextColor={lightColors.mutedForeground.hex}
            style={styles.search}
            value={query}
          />

          {/* 목록 */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                accessibilityLabel={`${item.brand} ${item.name} 선택`}
                accessibilityRole="button"
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.option,
                  item.id === selectedId && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionBrand}>{item.brand}</Text>
                  <Text style={styles.optionName}>{item.name}</Text>
                  {item.gauge ? (
                    <Text style={styles.optionMeta}>{item.gauge}</Text>
                  ) : null}
                </View>
                {item.id === selectedId ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={
              <Typography
                variant="caption"
                style={[styles.emptyText, styles.muted]}
              >
                검색 결과가 없습니다.
              </Typography>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing[1],
  },
  label: {
    color: lightColors.mutedForeground.hex,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
  placeholder: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
  },
  selectedMain: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.medium,
  },
  selectedSub: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    marginTop: 1,
  },
  chevron: {
    color: lightColors.mutedForeground.hex,
    fontSize: 18,
    marginLeft: theme.spacing[2],
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
  },
  sheet: {
    backgroundColor: lightColors.background.hex,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '75%',
    paddingBottom: theme.spacing[8],
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[5],
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  closeBtn: {
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  closeBtnText: {
    color: lightColors.mutedForeground.hex,
    fontSize: 14,
  },
  search: {
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    marginBottom: theme.spacing[3],
    minHeight: 44,
    paddingHorizontal: theme.spacing[3],
  },
  listContent: {
    gap: theme.spacing[1],
    paddingBottom: theme.spacing[4],
  },
  option: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
  },
  optionSelected: {
    backgroundColor: lightColors.primary.hex + '15',
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionBrand: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
  },
  optionName: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.medium,
  },
  optionMeta: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
  },
  checkmark: {
    color: lightColors.primary.hex,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: theme.spacing[2],
  },
  emptyText: {
    paddingVertical: theme.spacing[4],
    textAlign: 'center',
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
});
