import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect } from 'react';
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
          >
            <h3
              id="confirm-title"
              className="text-xl font-black mb-2 text-slate-900 dark:text-white"
            >
              {title}
            </h3>
            <p
              id="confirm-desc"
              className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed"
            >
              {message}
            </p>

            <div className="flex gap-3 justify-end font-bold">
              <button
                onClick={onCancel}
                className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-3 rounded-xl text-white shadow-lg transition-transform active:scale-95
                  ${
                    isDangerous
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                  }
                `}
                type="button"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
