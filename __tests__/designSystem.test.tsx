import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Badge } from '../src/components/Badge';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { LoadingSpinner } from '../src/components/LoadingSpinner';
import { NotificationOptInDialog } from '../src/components/NotificationOptInDialog';
import { Tabs } from '../src/components/Tabs';
import { Typography } from '../src/components/Typography';
import { theme } from '../src/constants/theme';

describe('PR-03 디자인 시스템 토큰', () => {
  test('YellowBall_v0.1 글로벌 토큰 기반의 라이트/다크 컬러와 폰트를 제공한다', () => {
    expect(theme.colors.light.primary.hex).toBe('#103c28');
    expect(theme.colors.light.accent.source).toBe('oklch(0.88 0.18 115)');
    expect(theme.colors.light.warning.hex).toBe('#fff4cc');
    expect(theme.colors.light.warningForeground.hex).toBe('#594100');
    expect(theme.controlHeights.md).toBe(36);
    expect(theme.colors.dark.background.hex).toBe('#06100a');
    expect(theme.typography.fontFamily.body).toContain('Geist');
    expect(theme.typography.fontFamily.display).toContain('Manrope');
    expect(theme.borderRadius.lg).toBe(16);
  });
});

describe('Button', () => {
  test('variant와 로딩 상태를 렌더링하고 스냅샷을 유지한다', () => {
    const tree = render(
      <>
        <Button variant="primary">예약하기</Button>
        <Button variant="secondary">보조 버튼</Button>
        <Button variant="outline">외곽 버튼</Button>
        <Button loading>저장 중</Button>
      </>,
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('onPress를 호출하고 disabled 상태에서는 호출하지 않는다', () => {
    const enabledPress = jest.fn();
    const disabledPress = jest.fn();
    const { getByLabelText, getByText } = render(
      <>
        <Button onPress={enabledPress}>가능</Button>
        <Button disabled onPress={disabledPress}>
          불가능
        </Button>
      </>,
    );

    fireEvent.press(getByText('가능'));
    expect(getByLabelText('불가능').props.accessibilityState.disabled).toBe(true);
    expect(() => fireEvent.press(getByLabelText('불가능'))).toThrow();

    expect(enabledPress).toHaveBeenCalledTimes(1);
    expect(disabledPress).not.toHaveBeenCalled();
  });

  test('Android에서 버튼 표면과 내부 콘텐츠 row를 안정적으로 고정한다', () => {
    const { getByTestId, getByText } = render(
      <Button testID="stable-android-button">예약 접수</Button>,
    );

    const surface = getByTestId('stable-android-button-surface');
    const surfaceStyle = StyleSheet.flatten(surface.props.style);
    const button = getByTestId('stable-android-button');
    const rawButtonStyle =
      typeof button.props.style === 'function'
        ? button.props.style({ pressed: false })
        : button.props.style;
    const buttonStyle = StyleSheet.flatten(
      rawButtonStyle,
    );

    expect(surfaceStyle).toEqual(
      expect.objectContaining({
        alignSelf: 'stretch',
        backgroundColor: theme.colors.light.primary.hex,
        borderColor: theme.colors.light.primary.hex,
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
      }),
    );
    expect(buttonStyle).toEqual(
      expect.objectContaining({
        alignSelf: 'stretch',
        justifyContent: 'center',
        minHeight: theme.controlHeights.md,
        minWidth: 0,
      }),
    );

    const content = getByTestId('stable-android-button-content');
    const contentStyle = StyleSheet.flatten(content.props.style);

    expect(content.props.pointerEvents).toBe('none');
    expect(contentStyle).toEqual(
      expect.objectContaining({
        alignItems: 'center',
        alignSelf: 'stretch',
        flexDirection: 'row',
        justifyContent: 'center',
        minHeight: theme.controlHeights.md,
        minWidth: 0,
      }),
    );
    expect(contentStyle.height).toBeUndefined();

    expect(getByText('예약 접수').props).toEqual(
      expect.objectContaining({
        adjustsFontSizeToFit: true,
        numberOfLines: 1,
      }),
    );
  });
});

describe('NotificationOptInDialog', () => {
  test('알림 허용 CTA는 공통 Button의 안정적인 Android 표면을 사용한다', () => {
    const { getByTestId } = render(
      <NotificationOptInDialog
        visible
        onAllow={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    const allowButtonSurface = getByTestId(
      'notification-opt-in-allow-button-surface',
    );
    const allowButtonStyle = StyleSheet.flatten(allowButtonSurface.props.style);

    expect(allowButtonStyle).toEqual(
      expect.objectContaining({
        alignSelf: 'stretch',
        backgroundColor: theme.colors.light.primary.hex,
        borderColor: theme.colors.light.primary.hex,
        overflow: 'hidden',
      }),
    );
    expect(getByTestId('notification-opt-in-allow-button-content')).toBeTruthy();
  });
});

describe('Input', () => {
  test('라벨과 에러 메시지를 렌더링하고 스냅샷을 유지한다', () => {
    const tree = render(
      <Input
        label="비밀번호"
        error="비밀번호를 입력해 주세요."
        placeholder="비밀번호"
        secureTextEntry
        value=""
      />,
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('텍스트 변경과 비밀번호 보기 토글을 처리한다', () => {
    const onChangeText = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <Input
        label="비밀번호"
        placeholder="비밀번호"
        secureTextEntry
        onChangeText={onChangeText}
        value=""
      />,
    );

    const input = getByPlaceholderText('비밀번호');
    fireEvent.changeText(input, 'yellowball');
    expect(onChangeText).toHaveBeenCalledWith('yellowball');
    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText('비밀번호 보기'));
    expect(getByPlaceholderText('비밀번호').props.secureTextEntry).toBe(false);
  });
});

describe('공통 UI 컴포넌트', () => {
  test('Card, Typography, LoadingSpinner, Badge, Tabs를 렌더링하고 스냅샷을 유지한다', () => {
    const tree = render(
      <>
        <Card>
          <Typography variant="h1">YellowBall</Typography>
          <Typography variant="h2">예약 현황</Typography>
          <Typography variant="body">오늘의 스트링 작업</Typography>
          <Typography variant="caption">오후 7시 마감</Typography>
        </Card>
        <LoadingSpinner />
        <LoadingSpinner fullScreen label="불러오는 중" />
        <Badge variant="success">완료</Badge>
        <Badge variant="warning">대기</Badge>
        <Tabs
          testID="main-tabs"
          tabs={[
            { key: 'booking', label: '예약', content: '예약 내용' },
            { key: 'shop', label: '샵', content: '샵 내용' },
          ]}
          defaultValue="booking"
        />
      </>,
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('Tabs와 LoadingSpinner는 root testID를 전달한다', () => {
    const { getByTestId } = render(
      <>
        <Tabs
          testID="custom-tabs"
          tabs={[{ key: 'booking', label: '예약', content: '예약 내용' }]}
        />
        <LoadingSpinner testID="custom-spinner" />
      </>,
    );

    expect(getByTestId('custom-tabs')).toBeTruthy();
    expect(getByTestId('custom-spinner')).toBeTruthy();
  });

  test('Tabs는 탭 선택을 전환한다', () => {
    const onValueChange = jest.fn();
    const { getByText, queryByText } = render(
      <Tabs
        tabs={[
          { key: 'booking', label: '예약', content: '예약 내용' },
          { key: 'shop', label: '샵', content: '샵 내용' },
        ]}
        defaultValue="booking"
        onValueChange={onValueChange}
      />,
    );

    expect(getByText('예약 내용')).toBeTruthy();
    expect(queryByText('샵 내용')).toBeNull();

    fireEvent.press(getByText('샵'));

    expect(onValueChange).toHaveBeenCalledWith('shop');
    expect(getByText('샵 내용')).toBeTruthy();
  });
});
