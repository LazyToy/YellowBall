import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { sharedControlStyles, sharedTextStyles } from '../constants/componentStyles';
import { lightColors, theme } from '../constants/theme';

export type TabItem = {
  key: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
};

export type TabsProps = Omit<ViewProps, 'style'> & {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
  listStyle?: StyleProp<ViewStyle>;
  triggerStyle?: StyleProp<ViewStyle>;
  triggerTextStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Tabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  style,
  listStyle,
  triggerStyle,
  triggerTextStyle,
  contentStyle,
  ...viewProps
}: TabsProps) {
  const fallbackValue = defaultValue ?? tabs[0]?.key;
  const [internalValue, setInternalValue] = useState(fallbackValue);
  const selectedValue = value ?? internalValue;
  const selectedTab = useMemo(
    () => tabs.find((tab) => tab.key === selectedValue) ?? tabs[0],
    [selectedValue, tabs],
  );

  const selectTab = (nextValue: string) => {
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <View style={[styles.container, style]} {...viewProps}>
      <View style={[styles.list, listStyle]}>
        {tabs.map((tab) => {
          const active = tab.key === selectedTab?.key;

          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled: tab.disabled }}
              disabled={tab.disabled}
              key={tab.key}
              onPress={() => selectTab(tab.key)}
              style={[
                styles.trigger,
                sharedControlStyles.border,
                sharedControlStyles.tabHeight,
                active && styles.triggerActive,
                tab.disabled && sharedControlStyles.disabled,
                triggerStyle,
              ]}
            >
              <Text
                style={[
                  styles.triggerText,
                  active && styles.triggerTextActive,
                  triggerTextStyle,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.content, contentStyle]}>
        {typeof selectedTab?.content === 'string' ? (
          <Text style={styles.contentText}>{selectedTab.content}</Text>
        ) : (
          selectedTab?.content
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[2],
  },
  list: {
    alignSelf: 'flex-start',
    backgroundColor: lightColors.muted.hex,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    minHeight: theme.controlHeights.md,
    padding: theme.componentSpacing.tabListPadding,
  },
  trigger: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
  },
  triggerActive: {
    backgroundColor: lightColors.background.hex,
    ...theme.shadow.card,
  },
  triggerText: {
    ...sharedTextStyles.control,
    color: lightColors.foreground.hex,
  },
  triggerTextActive: {
    color: lightColors.foreground.hex,
  },
  content: {
    flexGrow: 1,
  },
  contentText: {
    ...sharedTextStyles.body,
    color: lightColors.foreground.hex,
  },
});
