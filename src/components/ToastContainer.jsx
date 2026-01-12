import React, { useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';

const ToastItem = ({ toast, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast, removeToast]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-sky-500" />,
  };

  const colors = {
    success: 'bg-white border-green-100 dark:bg-slate-800 dark:border-green-900/30',
    error: 'bg-white border-rose-100 dark:bg-slate-800 dark:border-rose-900/30',
    warning: 'bg-white border-amber-100 dark:bg-slate-800 dark:border-amber-900/30',
    info: 'bg-white border-sky-100 dark:bg-slate-800 dark:border-sky-900/30',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-l-4 ${colors[toast.type] || colors.info} min-w-[300px] pointer-events-auto backdrop-blur-sm`}
    >
      <div className="flex-shrink-0">{icons[toast.type] || icons.info}</div>
      <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.array.isRequired,
  removeToast: PropTypes.func.isRequired,
};

ToastItem.propTypes = {
  toast: PropTypes.object.isRequired,
  removeToast: PropTypes.func.isRequired,
};

export default ToastContainer;
