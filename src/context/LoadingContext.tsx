import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loading: LoadingState;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<LoadingState>({});

  const startLoading = useCallback((key: string) => {
    setLoading(prev => {
      // Avoid state update if already true
      if (prev[key]) {
        return prev;
      }
      return { ...prev, [key]: true };
    });
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoading(prev => {
      // Avoid state update if already false
      if (prev[key] === false) {
        return prev;
      }
      const newState = { ...prev };
      delete newState[key]; // Cleaner to remove key
      return newState;
    });
  }, []);

  const isLoading = useCallback((key: string) => !!loading[key], [loading]);

  const isAnyLoading = useCallback(() => Object.values(loading).some(Boolean), [loading]);

  const value = useMemo(
    () => ({
      loading,
      startLoading,
      stopLoading,
      isLoading,
      isAnyLoading,
    }),
    [loading, startLoading, stopLoading, isLoading, isAnyLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isAnyLoading() && <GlobalLoadingIndicator />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

// Global loading indicator (top bar)
const GlobalLoadingIndicator = () => (
  <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500/20 z-50" role="progressbar">
    <div className="h-full bg-sky-500 animate-loading-bar shadow-[0_0_10px_#0ea5e9]" />
  </div>
);

export default LoadingContext;
