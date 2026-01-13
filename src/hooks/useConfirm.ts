import { useState, useCallback } from 'react';

interface ConfirmConfig {
  message: string;
  title: string;
  resolve: (value: boolean) => void;
  isDangerous: boolean;
}

interface ConfirmResult {
  confirm: (message: string, title?: string, isDangerous?: boolean) => Promise<boolean>;
  confirmConfig: ConfirmConfig | null;
  handleClose: (result: boolean) => void;
}

export const useConfirm = (): ConfirmResult => {
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const confirm = useCallback(
    (
      message: string,
      title: string = 'Confirm Action',
      isDangerous: boolean = false
    ): Promise<boolean> => {
      return new Promise(resolve => {
        setConfirmConfig({ message, title, resolve, isDangerous });
      });
    },
    []
  );

  const handleClose = useCallback(
    (result: boolean) => {
      if (confirmConfig?.resolve) {
        confirmConfig.resolve(result);
      }
      setConfirmConfig(null);
    },
    [confirmConfig]
  );

  return {
    confirm,
    confirmConfig,
    handleClose,
  };
};
