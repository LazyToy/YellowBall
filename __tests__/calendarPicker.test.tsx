import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { CalendarPicker } from '../src/components/CalendarPicker';

describe('CalendarPicker', () => {
  test('상단 년월을 눌러 년도와 월을 직접 변경한다', () => {
    const onSelectDate = jest.fn();
    const screen = render(
      <CalendarPicker
        onSelectDate={onSelectDate}
        selectedDate="2099-05-04"
      />,
    );

    expect(screen.getByText('2099.05')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('년월 선택'));
    expect(screen.getByText('년도')).toBeTruthy();
    expect(screen.getByText('월 선택')).toBeTruthy();
    fireEvent.press(screen.getByText('2100년'));
    fireEvent.press(screen.getByText('6월'));

    expect(screen.getByText('2100.06')).toBeTruthy();
  });

  test('영업 상태 범례를 표시한다', () => {
    const screen = render(
      <CalendarPicker
        getDateStatus={(date) =>
          date === '2099-05-05'
            ? 'closed'
            : date === '2099-05-06'
              ? 'ended'
              : 'normal'
        }
        onSelectDate={jest.fn()}
        selectedDate="2099-05-04"
        showStatusLegend
      />,
    );

    expect(screen.getByText('정상영업')).toBeTruthy();
    expect(screen.getByText('휴무')).toBeTruthy();
    expect(screen.getByText('영업종료')).toBeTruthy();
  });
});
