import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { NotificationContext } from '../context/NotificationContext';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const notify = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  };

  const dismiss = id => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-2 pointer-events-none">
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
          >
            <span>{notification.message}</span>
            <button
              onClick={() => onDismiss(notification.id)}
              className="ml-4 hover:opacity-75 transition-opacity"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
