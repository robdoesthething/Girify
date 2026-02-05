import { AnimatePresence, motion } from 'framer-motion';
import React, { ReactNode, useState } from 'react';
import { NotificationContext } from '../context/NotificationContext';

interface Notification {
  id: number | string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (message: string, type: Notification['type'] = 'info', duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  };

  const dismiss = (id: number | string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: number | string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = React.memo(
  ({ notifications, onDismiss }) => {
    return (
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.8 }}
              className={`
              px-6 py-4 rounded-lg shadow-lg max-w-sm pointer-events-auto flex items-center justify-between
              ${notification.type === 'success' ? 'bg-emerald-500' : ''}
              ${notification.type === 'error' ? 'bg-rose-500' : ''}
              ${notification.type === 'info' ? 'bg-sky-500' : ''}
              ${notification.type === 'warning' ? 'bg-amber-500' : ''}
              text-white font-medium
            `}
              role="alert"
            >
              <span>{notification.message}</span>
              <button
                onClick={() => onDismiss(notification.id)}
                className="ml-4 hover:opacity-75 transition-opacity"
                type="button"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

NotificationContainer.displayName = 'NotificationContainer';
