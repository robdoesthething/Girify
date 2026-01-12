import React, { useState, useCallback } from 'react';
import { ToastContext } from './ToastContext';
import PropTypes from 'prop-types';
import ToastContainer from '../components/ToastContainer';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString().slice(2);
    // Limit specific toast types or count if needed
    setToasts(prev => {
      // Prevent duplicates if needed, or just append
      // Limit to 3 stack
      const newToasts = [...prev, { id, message, type, duration }];
      if (newToasts.length > 3) return newToasts.slice(newToasts.length - 3);
      return newToasts;
    });
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
