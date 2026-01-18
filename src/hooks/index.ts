/**
 * Custom Hooks Index
 * Barrel export file for all custom hooks
 */

// Existing hooks
export { useDailyChallenge } from '../features/game/hooks/useDailyChallenge';
export { useGameTimer } from '../features/game/hooks/useGameTimer';
export { useScoreCalculator } from '../features/game/hooks/useScoreCalculator';
export { useLocalStorage } from './useLocalStorage';

// New refactored hooks
export { useAuth } from '../features/auth/hooks/useAuth';
export { useGameState } from '../features/game/hooks/useGameState';
export { useAchievements } from './useAchievements';
export { useAnnouncements } from './useAnnouncements';
// useStreets seems to be missing or internal to game, removing if not found,
// but actually the error said it couldn't find './useStreets', implying it expected it here.
// If it's used elsewhere, I should find where it is.
// For now, I will comment it out if I can't find it, or point to feature if I know it.
// I suspect useStreets is in features/game/hooks or similar. I'll search for it first.
