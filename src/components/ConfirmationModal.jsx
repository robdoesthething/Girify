import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
}) => {
  const { theme } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
          >
            <h3 className="text-xl font-black mb-2">{title}</h3>
            <p className="opacity-70 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 font-bold opacity-60 hover:opacity-100 bg-slate-100 dark:bg-slate-900 rounded-xl"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg ${isDangerous ? 'bg-red-500 hover:bg-red-600' : 'bg-sky-500 hover:bg-sky-600'}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isDangerous: PropTypes.bool,
};

export default ConfirmationModal;
