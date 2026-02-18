import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Stable callback refs for TopBar navigation props.
 * Prevents inline lambdas from defeating React.memo on TopBar.
 */
export const useTopBarNav = () => {
  const navigate = useNavigate();

  const onOpenPage = useCallback(
    (page: string | null) => navigate(page ? `/${page}` : '/'),
    [navigate]
  );

  const onTriggerLogin = useCallback((mode: string) => navigate(`/?auth=${mode}`), [navigate]);

  return { onOpenPage, onTriggerLogin };
};
