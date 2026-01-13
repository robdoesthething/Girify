import { motion, AnimatePresence } from 'framer-motion';

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl overflow-hidden"
      >
        <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-end font-bold">
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Hook moved to ../hooks/useConfirm.js
