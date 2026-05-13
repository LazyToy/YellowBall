import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput as NativeTextInput,
  type ScrollViewProps,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { lightColors } from '@/constants/theme';

const focusedInputTopPadding = 96;
const keyboardScrollDelayMs = 80;
const keyboardVerticalOffset = 0;

type MeasurableInput = {
  measureLayout: (
    relativeToNativeNode: unknown,
    onSuccess: (x: number, y: number, width: number, height: number) => void,
    onFail?: () => void,
  ) => void;
};

type PageRefreshContextValue = {
  isRefreshing: boolean;
  refreshVersion: number;
  requestPageRefresh: () => Promise<void>;
};

const PageRefreshContext = createContext<PageRefreshContextValue | null>(null);

export function PageRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refreshingRef = useRef(false);

  const requestPageRefresh = useCallback(async () => {
    if (refreshingRef.current) {
      return;
    }

    refreshingRef.current = true;
    setIsRefreshing(true);

    try {
      await queryClient.invalidateQueries();
      setRefreshVersion((current) => current + 1);
    } finally {
      setTimeout(() => {
        refreshingRef.current = false;
        setIsRefreshing(false);
      }, 350);
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({
      isRefreshing,
      refreshVersion,
      requestPageRefresh,
    }),
    [isRefreshing, refreshVersion, requestPageRefresh],
  );

  return (
    <PageRefreshContext.Provider value={value}>
      {children}
    </PageRefreshContext.Provider>
  );
}

export function usePageRefreshVersion() {
  return usePageRefreshContext()?.refreshVersion ?? 0;
}

export function usePageRefreshControl() {
  const context = usePageRefreshContext();
  const isRefreshing = context?.isRefreshing ?? false;
  const requestPageRefresh = context?.requestPageRefresh ?? noopRefresh;

  return useMemo(
    () => (
      <RefreshControl
        colors={[lightColors.primary.hex]}
        onRefresh={requestPageRefresh}
        refreshing={isRefreshing}
        tintColor={lightColors.primary.hex}
      />
    ),
    [isRefreshing, requestPageRefresh],
  );
}

export function RefreshableScrollView({
  alwaysBounceVertical = true,
  contentContainerStyle,
  keyboardDismissMode,
  keyboardShouldPersistTaps,
  onContentSizeChange,
  refreshControl,
  ...props
}: ScrollViewProps) {
  const pageRefreshControl = usePageRefreshControl();
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToFocusedInput = useCallback(() => {
    const scrollView = scrollViewRef.current;
    const focusedInput = NativeTextInput.State.currentlyFocusedInput?.() as
      | MeasurableInput
      | null
      | undefined;
    const nativeScrollRef = scrollView?.getNativeScrollRef();

    if (!scrollView || !focusedInput || !nativeScrollRef) {
      return;
    }

    focusedInput.measureLayout(
      nativeScrollRef,
      (_x, y) => {
        scrollView.scrollTo({
          animated: true,
          y: Math.max(0, y - focusedInputTopPadding),
        });
      },
      () => undefined,
    );
  }, []);

  const handleContentSizeChange = useCallback(
    (contentWidth: number, contentHeight: number) => {
      onContentSizeChange?.(contentWidth, contentHeight);
      scrollToFocusedInput();
    },
    [onContentSizeChange, scrollToFocusedInput],
  );

  useEffect(() => {
    const keyboardShowSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(scrollToFocusedInput, keyboardScrollDelayMs);
    });
    const keyboardFrameSubscription = Keyboard.addListener(
      'keyboardDidChangeFrame',
      () => {
        setTimeout(scrollToFocusedInput, keyboardScrollDelayMs);
      },
    );

    return () => {
      keyboardShowSubscription.remove();
      keyboardFrameSubscription.remove();
    };
  }, [scrollToFocusedInput]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        ref={scrollViewRef}
        alwaysBounceVertical={alwaysBounceVertical}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardDismissMode={keyboardDismissMode ?? 'interactive'}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}
        onContentSizeChange={handleContentSizeChange}
        refreshControl={refreshControl ?? pageRefreshControl}
        showsVerticalScrollIndicator={false}
        {...props}
      />
    </KeyboardAvoidingView>
  );
}

function usePageRefreshContext() {
  return useContext(PageRefreshContext);
}

const noopRefresh = async () => undefined;

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
  },
});
