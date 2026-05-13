import React from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { render } from '@testing-library/react-native';

import {
  Text,
  TextInput,
  appMaxFontSizeMultiplier,
} from '../src/components/AppText';

const readSource = (path: string) =>
  readFileSync(join(process.cwd(), path), 'utf8');

describe('Android text scaling guards', () => {
  test('shared Text and TextInput cap Android font scaling explicitly', () => {
    const { getByPlaceholderText, getByText } = render(
      <>
        <Text>메뉴</Text>
        <TextInput placeholder="입력" />
      </>,
    );

    expect(getByText('메뉴').props.maxFontSizeMultiplier).toBe(
      appMaxFontSizeMultiplier,
    );
    expect(getByPlaceholderText('입력').props.maxFontSizeMultiplier).toBe(
      appMaxFontSizeMultiplier,
    );
  });

  test('layout-critical screens use the shared Text wrapper instead of native Text', () => {
    const files = [
      'app/(auth)/login.tsx',
      'app/(auth)/register.tsx',
      'app/(tabs)/index.tsx',
      'app/(tabs)/shop.tsx',
      'app/(tabs)/me.tsx',
      'app/(tabs)/booking.tsx',
      'app/(tabs)/orders.tsx',
      'app/(tabs)/shop-product-detail.tsx',
      'app/(tabs)/shop-wishlist.tsx',
      'src/components/Button.tsx',
      'src/components/Typography.tsx',
      'src/components/Input.tsx',
      'src/components/MobileUI.tsx',
      'src/components/Badge.tsx',
      'src/components/Card.tsx',
      'src/components/LoadingSpinner.tsx',
      'src/components/PhotoPicker.tsx',
      'src/components/StringPicker.tsx',
      'src/components/Tabs.tsx',
    ];

    files.forEach((file) => {
      const source = readSource(file);

      expect(source).toContain('@/components/AppText');
      expect(source).not.toMatch(
        /import\s*\{[\s\S]*?\bText\b[\s\S]*?\}\s*from\s*['"]react-native['"]/,
      );
    });
  });

  test('bottom tab labels disable native font scaling', () => {
    const source = readSource('app/(tabs)/_layout.tsx');

    expect(source).toContain('tabBarAllowFontScaling: false');
  });
});
