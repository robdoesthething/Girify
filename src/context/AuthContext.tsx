import { createContext, useContext } from 'react';
import { useAuth, type UseAuthResult } from '../features/auth/hooks/useAuth';

const AuthContext = createContext<UseAuthResult | null>(null);

/**
 * Mounts the single useAuth instance for the whole app.
 * Must live inside NotificationProvider and LoadingProvider.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

/**
 * Shared auth state from the single AuthProvider subscription.
 * Use this instead of calling useAuth() directly in components.
 */
export const useAuthContext = (): UseAuthResult => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
};
