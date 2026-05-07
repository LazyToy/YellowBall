import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useResetOnBlur } from '../src/hooks/useResetOnBlur';

const mockUseNavigation = jest.fn();

jest.mock('expo-router', () => ({
  useNavigation: () => mockUseNavigation(),
}));

function ResetProbe({ onReset }: { onReset: () => void }) {
  useResetOnBlur(onReset);

  return <Text>probe</Text>;
}

describe('useResetOnBlur', () => {
  test('화면 blur 이벤트가 발생하면 등록된 초기화 함수를 호출한다', () => {
    const reset = jest.fn();
    let blurHandler: (() => void) | undefined;
    mockUseNavigation.mockReturnValue({
      addListener: jest.fn((eventName: string, handler: () => void) => {
        if (eventName === 'blur') {
          blurHandler = handler;
        }

        return jest.fn();
      }),
    });

    render(<ResetProbe onReset={reset} />);

    blurHandler?.();

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
