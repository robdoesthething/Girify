// Profile feature barrel export

// Components
export { default as ProfileScreen } from './components/ProfileScreen';
export { default as PublicProfileScreen } from './components/PublicProfileScreen';
export { default as EditProfileModal } from './components/EditProfileModal';
export { default as ProfileHeader } from './components/ProfileHeader';
export { default as StatsGrid } from './components/StatsGrid';
export { default as AchievementsList } from './components/AchievementsList';
export { default as RecentActivity } from './components/RecentActivity';

// Hooks
export { useProfileData } from './hooks/useProfileData';
export { useProfileState } from './hooks/useProfileState';
export { useProfileStats } from './hooks/useProfileStats';

// Utils
export * from './utils/profileHelpers';
