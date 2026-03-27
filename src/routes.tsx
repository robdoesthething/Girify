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
 * Loading fallback for the auth init phase and lazy-loaded routes.
 */
export const PageLoader = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 gap-6">
    <img
      src="/images/guiri_invasion.png"
      alt=""
      aria-hidden="true"
      className="w-20 h-20 rounded-2xl object-cover opacity-80"
    />
    <div className="w-40 h-1 rounded-full bg-slate-800 overflow-hidden">
      <div className="h-full bg-sky-500 rounded-full animate-loading-bar" />
    </div>
  </div>
);
