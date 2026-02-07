/**
 * Route Configuration
 *
 * Centralized route definitions for the application.
 * Small pages are eagerly imported; heavy pages are lazy-loaded.
 */

import { lazy } from 'react';

// Eagerly imported lightweight pages (no Suspense spinner flash)
export { default as AboutScreen } from './components/AboutScreen';
export { ConfirmDialog } from './components/ConfirmDialog';
export { default as FeedbackScreen } from './components/FeedbackScreen';
export { default as NewsScreen } from './components/NewsScreen';
export { default as PrivacyPolicy } from './components/PrivacyPolicy';
export { default as SettingsScreen } from './components/SettingsScreen';
export { default as TermsOfService } from './components/TermsOfService';

// Lazy loaded heavy route components
export const GamePage = lazy(() => import('./features/game/components/GamePage'));
export const GameScreen = lazy(() => import('./features/game/components/GameScreen'));
export const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
export const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
export const FriendsScreen = lazy(() => import('./features/friends/components/FriendsScreen'));
export const LeaderboardScreen = lazy(
  () => import('./features/leaderboard/components/LeaderboardScreen')
);
export const ProfileScreen = lazy(() => import('./features/profile/components/ProfileScreen'));
export const PublicProfileScreen = lazy(
  () => import('./features/profile/components/PublicProfileScreen')
);
export const ShopScreen = lazy(() => import('./features/shop/components/ShopScreen'));
export const StreetsFetcher = lazy(() => import('./features/game/components/StreetsFetcher'));
export const VerifyEmailScreen = lazy(() => import('./features/auth/components/VerifyEmailScreen'));
export const AchievementModal = lazy(() => import('./components/AchievementModal'));
export const DistrictSelectionModal = lazy(() => import('./components/DistrictSelectionModal'));

/**
 * PageLoader Component
 *
 * Loading fallback for lazy-loaded routes.
 */
export const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
  </div>
);
