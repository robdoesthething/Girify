import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useId, useRef } from 'react';
import { Z_INDEX } from '../../config/zIndex';
import { useTheme } from '../../context/ThemeContext';
import { themeClasses } from '../../utils/themeUtils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  children,
  footer,
}) => {
  const { theme } = useTheme();
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${Z_INDEX.MODAL} flex items-center justify-center p-4`}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className={`absolute inset-0 ${Z_INDEX.BACKDROP} bg-black/60 backdrop-blur-sm`}
          />

          {/* Modal content */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative ${Z_INDEX.MODAL} w-full ${sizeClasses[size]}
              p-6 rounded-2xl shadow-2xl outline-none
              ${themeClasses(theme, 'bg-slate-800 text-white', 'bg-white text-slate-900')}
            `}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between mb-4">
                {title && (
                  <h2 id={titleId} className="text-xl font-bold">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-lg transition-colors ${themeClasses(
                      theme,
                      'hover:bg-slate-700',
                      'hover:bg-slate-100'
                    )}`}
                    type="button"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div>{children}</div>

            {/* Footer */}
            {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
