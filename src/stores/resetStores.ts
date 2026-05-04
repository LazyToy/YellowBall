const resetCallbacks = new Set<() => void>();

export const registerZustandStoreReset = (reset: () => void) => {
  resetCallbacks.add(reset);

  return () => {
    resetCallbacks.delete(reset);
  };
};

export const resetAllZustandStores = () => {
  resetCallbacks.forEach((reset) => reset());
};
