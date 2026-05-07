import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RefreshControl,
  ScrollView,
  type ScrollViewProps,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { lightColors } from '@/constants/theme';

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
  refreshControl,
  ...props
}: ScrollViewProps) {
  const pageRefreshControl = usePageRefreshControl();

  return (
    <ScrollView
      alwaysBounceVertical={alwaysBounceVertical}
      refreshControl={refreshControl ?? pageRefreshControl}
      {...props}
    />
  );
}

function usePageRefreshContext() {
  return useContext(PageRefreshContext);
}

const noopRefresh = async () => undefined;
