import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FlatList, StyleSheet } from 'react-native';

import { StringPicker } from '../src/components/StringPicker';

const strings = [
  {
    id: 'string-1',
    brand: 'Babolat',
    name: 'RPM Blast',
    gauge: '1.25',
  },
  {
    id: 'string-2',
    brand: 'Luxilon',
    name: 'ALU Power',
    gauge: '1.25',
  },
] as never;

const flattenStyle = (style: unknown) =>
  StyleSheet.flatten(
    typeof style === 'function'
      ? style({ pressed: false, hovered: false, focused: false })
      : style,
  );

describe('StringPicker', () => {
  test('Android에서 보이는 선택 박스와 터치 가능한 Pressable을 분리해 유지한다', () => {
    render(
      <StringPicker
        label="메인 스트링"
        selectedId={null}
        strings={strings}
        onSelect={jest.fn()}
      />,
    );

    expect(flattenStyle(screen.getByTestId('string-picker-surface').props.style)).toEqual(
      expect.objectContaining({
        flexDirection: 'row',
        minHeight: 44,
        overflow: 'hidden',
        width: '100%',
      }),
    );
    expect(
      flattenStyle(screen.getByTestId('string-picker-hit-target').props.style),
    ).toEqual(
      expect.objectContaining({
        borderRadius: expect.any(Number),
        width: '100%',
      }),
    );
    expect(
      flattenStyle(screen.getByTestId('string-picker-value-row').props.style),
    ).toEqual(
      expect.objectContaining({
        flex: 1,
        flexDirection: 'row',
        minWidth: 0,
      }),
    );
  });

  test('선택 박스를 누르면 보유 스트링 목록 모달이 열리고 바깥을 누르면 닫힌다', () => {
    render(
      <StringPicker
        label="메인 스트링"
        selectedId={null}
        strings={strings}
        onSelect={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('string-picker-hit-target'));

    const outside = screen.getByTestId('string-picker-modal-outside');
    expect(flattenStyle(outside.props.style).backgroundColor).toEqual(
      expect.any(String),
    );
    expect(screen.getByText('메인 스트링 선택')).toBeTruthy();
    expect(screen.getByText('RPM Blast')).toBeTruthy();

    fireEvent.press(outside);

    expect(screen.queryByText('메인 스트링 선택')).toBeNull();
  });

  test('스트링 선택창은 전체 화면을 채우고 옵션을 독립된 박스로 보여준다', () => {
    render(
      <StringPicker
        label="메인 스트링"
        selectedId={null}
        strings={strings}
        onSelect={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('string-picker-hit-target'));

    expect(
      flattenStyle(screen.getByTestId('string-picker-keyboard-frame').props.style),
    ).toEqual(
      expect.objectContaining({
        flex: 1,
      }),
    );
    const sheetStyle = flattenStyle(screen.getByTestId('string-picker-sheet').props.style);
    expect(sheetStyle).toEqual(
      expect.objectContaining({
        flex: 1,
        width: '100%',
      }),
    );
    expect(sheetStyle.maxHeight).toBeUndefined();
    expect(sheetStyle.minHeight).toBeUndefined();
    expect(
      flattenStyle(screen.getByTestId('string-picker-option-string-1').props.style),
    ).toEqual(
      expect.objectContaining({
        borderWidth: expect.any(Number),
        flexDirection: 'row',
        minHeight: 64,
      }),
    );
    expect(
      flattenStyle(screen.UNSAFE_getByType(FlatList).props.contentContainerStyle),
    ).toEqual(expect.objectContaining({ gap: 8, paddingBottom: 24 }));
    expect(
      flattenStyle(screen.getByTestId('string-picker-sheet-bottom-mask').props.style),
    ).toEqual(
      expect.objectContaining({
        backgroundColor: expect.any(String),
        bottom: 0,
        height: 16,
        position: 'absolute',
      }),
    );
  });

  test('검색창은 시트를 열 때 자동으로 키보드를 띄우지 않는다', () => {
    render(
      <StringPicker
        label="메인 스트링"
        selectedId={null}
        strings={strings}
        onSelect={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('string-picker-hit-target'));

    expect(screen.getByLabelText('스트링 검색').props.autoFocus).toBeUndefined();
  });
});
