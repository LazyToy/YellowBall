import { useEffect, useRef } from 'react';
import * as ExpoRouter from 'expo-router';

type NavigationLike = {
  addListener?: (eventName: string, handler: () => void) => undefined | (() => void);
} | null;

const useOptionalNavigation: () => NavigationLike =
  typeof ExpoRouter.useNavigation === 'function'
    ? ExpoRouter.useNavigation
    : () => null;

export const useResetOnBlur = (reset: () => void) => {
  const navigation = useOptionalNavigation();
  const resetRef = useRef(reset);

  useEffect(() => {
    resetRef.current = reset;
  }, [reset]);

  useEffect(() => {
    if (!navigation?.addListener) {
      return undefined;
    }

    return navigation.addListener('blur', () => {
      resetRef.current();
    });
  }, [navigation]);
};
