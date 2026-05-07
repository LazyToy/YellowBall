import React from 'react';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import {
  Bell,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Home,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';

import { lightColors } from '@/constants/theme';

export type AppIconName =
  | 'bell'
  | 'calendar-check'
  | 'chevron-left'
  | 'chevron-right'
  | 'clock'
  | 'heart'
  | 'home'
  | 'map-pin'
  | 'more-horizontal'
  | 'package'
  | 'phone'
  | 'plus'
  | 'search'
  | 'settings'
  | 'shopping-bag'
  | 'shopping-cart'
  | 'sliders-horizontal'
  | 'sparkles'
  | 'star'
  | 'user'
  | 'wrench';

type AppIconProps = {
  color?: ColorValue;
  name: AppIconName;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

const iconByName: Record<AppIconName, LucideIcon> = {
  bell: Bell,
  'calendar-check': CalendarCheck,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clock: Clock,
  heart: Heart,
  home: Home,
  'map-pin': MapPin,
  'more-horizontal': MoreHorizontal,
  package: Package,
  phone: Phone,
  plus: Plus,
  search: Search,
  settings: Settings,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  'sliders-horizontal': SlidersHorizontal,
  sparkles: Sparkles,
  star: Star,
  user: User,
  wrench: Wrench,
};

export function AppIcon({
  color = lightColors.foreground.hex,
  name,
  size = 20,
  strokeWidth = 2.2,
  style,
}: AppIconProps) {
  const Icon = iconByName[name];

  return (
    <Icon
      color={String(color)}
      height={size}
      strokeWidth={strokeWidth}
      style={style}
      width={size}
    />
  );
}

