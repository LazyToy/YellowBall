import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { CalendarPicker, TimePicker } from '../src/components/CalendarPicker';

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

  test('시간 선택은 최대 시간을 넘는 선택지를 숨긴다', () => {
    const screen = render(
      <TimePicker
        endHour={18}
        label="반납 예정 시간"
        maxTime="18:00"
        onChange={jest.fn()}
        startHour={9}
        value="12:00"
      />,
    );

    fireEvent.press(screen.getByLabelText('반납 예정 시간'));

    expect(screen.getByLabelText('반납 예정 시간 18:00')).toBeTruthy();
    expect(screen.queryByLabelText('반납 예정 시간 18:30')).toBeNull();
  });
});
