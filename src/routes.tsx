/**
 * Route Configuration
 *
 * Centralized route definitions for the application.
 */

import { lazy } from 'react';

// Lazy loaded route components
export const GameScreen = lazy(() => import('./features/game/components/GameScreen'));
export const AboutScreen = lazy(() => import('./components/AboutScreen'));
export const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
export const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
export const FeedbackScreen = lazy(() => import('./components/FeedbackScreen'));
export const FriendsScreen = lazy(() => import('./features/friends/components/FriendsScreen'));
export const LeaderboardScreen = lazy(
  () => import('./features/leaderboard/components/LeaderboardScreen')
);
export const NewsScreen = lazy(() => import('./components/NewsScreen'));
export const ProfileScreen = lazy(() => import('./features/profile/components/ProfileScreen'));
export const PublicProfileScreen = lazy(
  () => import('./features/profile/components/PublicProfileScreen')
);
export const SettingsScreen = lazy(() => import('./components/SettingsScreen'));
export const ShopScreen = lazy(() => import('./features/shop/components/ShopScreen'));
export const StreetsFetcher = lazy(() => import('./features/game/components/StreetsFetcher'));
export const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
export const TermsOfService = lazy(() => import('./components/TermsOfService'));
export const VerifyEmailScreen = lazy(() => import('./features/auth/components/VerifyEmailScreen'));
export const AchievementModal = lazy(() => import('./components/AchievementModal'));
export const ConfirmDialog = lazy(() =>
  import('./components/ConfirmDialog').then(m => ({ default: m.ConfirmDialog }))
);
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
