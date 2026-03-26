import React from 'react';
import { useTheme } from '../context/ThemeContext';
import Button from './ui/Button';
import Modal from './ui/Modal';

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
  const { theme } = useTheme();

  const footer = (
    <>
      <Button variant="ghost" size="md" onClick={onCancel} type="button">
        Cancel
      </Button>
      <Button
        variant={isDangerous ? 'danger' : 'primary'}
        size="md"
        onClick={onConfirm}
        type="button"
      >
        Confirm
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      showCloseButton={false}
      footer={footer}
    >
      <p className={`leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
        {message}
      </p>
    </Modal>
  );
};

// NOTE: The non-dangerous confirm button intentionally changes from emerald-500 to sky-500
// (primary variant) for consistency with the app's primary action color.
