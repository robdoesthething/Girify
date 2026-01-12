import { createContext } from 'react';

export interface NotificationContextType {
    notify: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
