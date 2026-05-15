import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { Text, TextInput } from '@/components/AppText';
import { usePageKeyboardAutoScrollLock } from '@/components/PageRefresh';
import { lightColors, theme } from '@/constants/theme';
import type { StringCatalogItem } from '@/types/database';

import { Typography } from './Typography';

type StringPickerProps = {
  label: string;
  selectedId: string | null;
  strings: StringCatalogItem[];
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
  usePageKeyboardAutoScrollLock(open);
  const insets = React.useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };

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

      <Pressable
        accessibilityLabel={`${label} 선택`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.triggerPressable,
          pressed && styles.pressed,
        ]}
        testID="string-picker-hit-target"
      >
        <View style={styles.triggerSurface} testID="string-picker-surface">
          <View
            pointerEvents="none"
            style={styles.valueRow}
            testID="string-picker-value-row"
          >
            {selectedItem ? (
              <View style={styles.selectedTextBox}>
                <Text numberOfLines={1} style={styles.selectedMain}>
                  {selectedItem.brand} {selectedItem.name}
                </Text>
                {selectedItem.gauge ? (
                  <Text numberOfLines={1} style={styles.selectedSub}>
                    {selectedItem.gauge}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text numberOfLines={1} style={styles.placeholder}>
                스트링을 선택하세요
              </Text>
            )}
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>
      </Pressable>

      <Modal
        animationType="slide"
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
        transparent
        visible={open}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="스트링 선택 닫기"
            onPress={() => setOpen(false)}
            style={styles.outsideDismiss}
            testID="string-picker-modal-outside"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            pointerEvents="box-none"
            style={styles.keyboardFrame}
            testID="string-picker-keyboard-frame"
          >
            <View
              style={[
                styles.sheet,
                {
                  paddingBottom: Math.max(insets.bottom, theme.spacing[5]),
                  paddingTop: Math.max(insets.top + theme.spacing[3], theme.spacing[5]),
                },
              ]}
              testID="string-picker-sheet"
            >
              <View style={styles.sheetHeader}>
                <Typography variant="h2">{label} 선택</Typography>
                <Pressable
                  accessibilityLabel="닫기"
                  onPress={() => setOpen(false)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>×</Text>
                </Pressable>
              </View>

              <TextInput
                accessibilityLabel="스트링 검색"
                onChangeText={setQuery}
                placeholder="브랜드 또는 모델 검색..."
                placeholderTextColor={lightColors.mutedForeground.hex}
                style={styles.search}
                value={query}
              />

              <FlatList
                contentContainerStyle={styles.listContent}
                data={filtered}
                keyboardShouldPersistTaps="handled"
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
                    testID={`string-picker-option-${item.id}`}
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
                showsVerticalScrollIndicator={false}
                style={styles.list}
              />
              <View
                pointerEvents="none"
                style={styles.sheetBottomMask}
                testID="string-picker-sheet-bottom-mask"
              />
            </View>
          </KeyboardAvoidingView>
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
  triggerPressable: {
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  triggerSurface: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    minWidth: 0,
    overflow: 'hidden',
    width: '100%',
  },
  valueRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    width: '100%',
  },
  selectedTextBox: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
  placeholder: {
    color: lightColors.mutedForeground.hex,
    flex: 1,
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 20,
    minWidth: 0,
  },
  selectedMain: {
    color: lightColors.foreground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.medium,
    includeFontPadding: false,
    lineHeight: 20,
  },
  selectedSub: {
    color: lightColors.mutedForeground.hex,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 15,
    marginTop: 1,
  },
  chevron: {
    color: lightColors.mutedForeground.hex,
    flexShrink: 0,
    fontSize: 18,
    includeFontPadding: false,
    lineHeight: 22,
    marginLeft: theme.spacing[2],
  },
  modalRoot: {
    flex: 1,
  },
  keyboardFrame: {
    flex: 1,
  },
  outsideDismiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: lightColors.background.hex,
  },
  sheet: {
    backgroundColor: lightColors.background.hex,
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[5],
    width: '100%',
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: lightColors.secondary.hex,
    borderRadius: 999,
    height: 32,
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
  list: {
    flex: 1,
  },
  listContent: {
    gap: theme.spacing[2],
    paddingBottom: theme.spacing[6],
  },
  sheetBottomMask: {
    backgroundColor: lightColors.background.hex,
    bottom: 0,
    height: theme.spacing[4],
    left: 0,
    position: 'absolute',
    right: 0,
  },
  option: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
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
  },
  emptyText: {
    paddingVertical: theme.spacing[4],
    textAlign: 'center',
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
});
