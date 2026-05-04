import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';

import { NotificationOptInDialog } from '@/components/NotificationOptInDialog';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  hasNotificationOptIn,
  registerPushToken,
  setNotificationOptIn,
} from '@/services/notificationService';

type TabIconProps = {
  color: string;
  focused: boolean;
  glyph: string;
  size: number;
};

function TabIcon({ color, focused, glyph, size }: TabIconProps) {
  return (
    <Text
      style={[
        styles.tabIcon,
        {
          color,
          fontSize: focused ? size + 1 : size,
        },
      ]}
    >
      {glyph}
    </Text>
  );
}

type NewBookingTabButtonProps = Pick<
  BottomTabBarButtonProps,
  'accessibilityState' | 'children' | 'onLongPress' | 'onPress' | 'testID'
>;

function NewBookingTabButton({
  accessibilityState,
  children,
  onLongPress,
  onPress,
  testID,
}: NewBookingTabButtonProps) {
  return (
    <Pressable
      accessibilityLabel="새 예약"
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.newBookingButtonWrapper,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <View style={styles.newBookingButton}>
        <Text style={styles.newBookingIcon}>+</Text>
      </View>
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  const { profile } = useAuth();
  const [showOptIn, setShowOptIn] = useState(false);

  useEffect(() => {
    // 로그인 후 최초 1회만 opt-in 다이얼로그 표시
    hasNotificationOptIn().then((optedIn) => {
      if (!optedIn && profile?.id) {
        setShowOptIn(true);
      }
    });
  }, [profile?.id]);

  const handleAllow = useCallback(async () => {
    await setNotificationOptIn(true);
    setShowOptIn(false);
    // 시스템 권한 요청 + 토큰 등록
    if (profile?.id) {
      try {
        await registerPushToken(profile.id);
      } catch {
        // 권한 거부 시 무시 (설정에서 다시 활성화 가능)
      }
    }
  }, [profile?.id]);

  const handleDismiss = useCallback(async () => {
    await setNotificationOptIn(false);
    setShowOptIn(false);
  }, []);

  return (
    <>
      <NotificationOptInDialog
        visible={showOptIn}
        onAllow={handleAllow}
        onDismiss={handleDismiss}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: lightColors.primary.hex,
          tabBarInactiveTintColor: lightColors.mutedForeground.hex,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} glyph="H" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: '예약',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} glyph="R" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-booking"
        options={{
          title: '',
          tabBarButton: ({
            accessibilityState,
            children,
            onLongPress,
            onPress,
            testID,
          }) => (
            <NewBookingTabButton
              accessibilityState={accessibilityState}
              onLongPress={onLongPress}
              onPress={onPress}
              testID={testID}
            >
              {children}
            </NewBookingTabButton>
          ),
          tabBarIcon: () => null,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: '샵',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} glyph="S" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '마이',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} glyph="M" size={size} />
          ),
        }}
      />
      <Tabs.Screen name="addresses" options={{ href: null }} />
      <Tabs.Screen name="rackets" options={{ href: null }} />
      <Tabs.Screen name="notification-settings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="booking-detail" options={{ href: null }} />
      <Tabs.Screen name="account-deletion" options={{ href: null }} />
      <Tabs.Screen name="string-catalog" options={{ href: null }} />
      <Tabs.Screen name="string-setups" options={{ href: null }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: lightColors.card.hex,
    borderTopColor: lightColors.border.hex,
    borderTopWidth: theme.borderWidth.hairline,
    height: 78,
    paddingBottom: theme.spacing[3],
    paddingTop: theme.spacing[2],
    ...theme.shadow.card,
  },
  tabLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.caption,
    fontWeight: theme.typography.fontWeight.medium,
  },
  tabIcon: {
    fontFamily: theme.typography.fontFamily.display,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 28,
    textAlign: 'center',
  },
  newBookingButtonWrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: -28,
  },
  newBookingButton: {
    alignItems: 'center',
    backgroundColor: lightColors.primary.hex,
    borderColor: lightColors.background.hex,
    borderRadius: 28,
    borderWidth: 4,
    height: 56,
    justifyContent: 'center',
    shadowColor: lightColors.foreground.hex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    width: 56,
    elevation: 4,
  },
  newBookingIcon: {
    color: lightColors.primaryForeground.hex,
    fontSize: 30,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 32,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
