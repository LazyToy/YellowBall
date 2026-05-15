import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';

import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { NotificationOptInDialog } from '@/components/NotificationOptInDialog';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAppMenuSettings } from '@/hooks/useAppMenuSettings';
import { hasAnyBookingMenu } from '@/services/appMenuSettingsService';
import {
  getNotificationOptInStatus,
  registerPushToken,
  setNotificationOptIn,
} from '@/services/notificationService';

type TabIconProps = {
  color: string;
  focused: boolean;
  name: AppIconName;
  size: number;
};

function TabIcon({ color, focused, name, size }: TabIconProps) {
  return (
    <AppIcon
      color={color}
      name={name}
      size={focused ? size + 1 : size}
      strokeWidth={focused ? 2.7 : 2.2}
    />
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
        <AppIcon
          color={lightColors.primaryForeground.hex}
          name="plus"
          size={31}
          strokeWidth={2.6}
        />
      </View>
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  const { profile } = useAuth();
  const menuSettings = useAppMenuSettings();
  const [showOptIn, setShowOptIn] = useState(false);
  const bookingTabsVisible = hasAnyBookingMenu(menuSettings);

  useEffect(() => {
    // 로그인 후 최초 1회만 opt-in 다이얼로그 표시
    getNotificationOptInStatus().then((optInStatus) => {
      if (optInStatus === null && profile?.id) {
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
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: lightColors.primary.hex,
          tabBarInactiveTintColor: lightColors.mutedForeground.hex,
          tabBarAllowFontScaling: false,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name="home" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          href: bookingTabsVisible ? undefined : null,
          title: '예약',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              color={color}
              focused={focused}
              name="calendar-check"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="new-booking"
        options={{
          href: bookingTabsVisible ? undefined : null,
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
          href: menuSettings.shop ? undefined : null,
          title: '샵',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              color={color}
              focused={focused}
              name="shopping-bag"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '마이',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name="user" size={size} />
          ),
        }}
      />
      <Tabs.Screen name="addresses" options={{ href: null }} />
      <Tabs.Screen name="rackets" options={{ href: null }} />
      <Tabs.Screen name="racket-list" options={{ href: null }} />
      <Tabs.Screen name="notification-settings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="booking-detail" options={{ href: null }} />
      <Tabs.Screen name="racket-detail" options={{ href: null }} />
      <Tabs.Screen name="shop-product-detail" options={{ href: null }} />
      <Tabs.Screen name="shop-wishlist" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen name="string-detail" options={{ href: null }} />
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
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
