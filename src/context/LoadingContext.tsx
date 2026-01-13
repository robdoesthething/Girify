import { createContext, useContext, useState, FC, ReactNode } from 'react';

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

  const startLoading = (key: string) => {
    setLoading(prev => ({ ...prev, [key]: true }));
  };

  const stopLoading = (key: string) => {
    setLoading(prev => ({ ...prev, [key]: false }));
  };

  const isLoading = (key: string) => loading[key] || false;

  const isAnyLoading = () => Object.values(loading).some(v => v);

  return (
    <LoadingContext.Provider
      value={{ loading, startLoading, stopLoading, isLoading, isAnyLoading }}
    >
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
  <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500/20 z-[9999]" role="progressbar">
    <div className="h-full bg-sky-500 animate-loading-bar shadow-[0_0_10px_#0ea5e9]" />
  </div>
);

export default LoadingContext;
