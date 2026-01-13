import { createContext } from 'react';

export interface NotificationContextType {
  notify: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    duration?: number
  ) => number | string;
  dismiss: (id: number | string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
