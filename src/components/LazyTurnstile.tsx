import { lazy } from 'react';

export const LazyTurnstile = lazy(() =>
  import('@marsidev/react-turnstile').then(m => ({ default: m.Turnstile }))
);

export type { TurnstileInstance } from '@marsidev/react-turnstile';
