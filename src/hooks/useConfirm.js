import { useState, useCallback } from 'react';

export const useConfirm = () => {
  const [confirmConfig, setConfirmConfig] = useState(null);

  const confirm = useCallback((message, title = 'Confirm Action', isDangerous = false) => {
    return new Promise(resolve => {
      setConfirmConfig({ message, title, resolve, isDangerous });
    });
  }, []);

  const handleClose = useCallback(
    result => {
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
