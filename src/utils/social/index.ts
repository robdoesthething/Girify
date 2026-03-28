/**
 * Social Module - Barrel Export
 *
 * Re-exports all social utilities for backward compatibility.
 * Import from here to maintain existing import paths.
 */

// Types
export type {
  AdditionalProfileData,
  FeedbackItem,
  GameData,
  GameStatsUpdate,
  NotificationSettings,
  OperationResult,
  UserProfile,
} from './types';

// Profile functions
export {
  ensureUserProfile,
  getUserByEmail,
  getUserByUid,
  getUserProfile,
  healMigration,
  migrateUser,
  rowToProfile,
  updateUserProfile,
} from './profile';

// Admin-only profile functions
export { deleteUserAndData, getAllUsers, updateUserAsAdmin } from './profileAdmin';

// Feedback functions
export {
  approveFeedback,
  checkUnseenFeedbackRewards,
  deleteFeedback,
  getFeedbackList,
  markFeedbackRewardSeen,
  rejectFeedback,
  submitFeedback,
} from './feedback';

// Stats functions
export { getDistrictRankings, getUserGameHistory, updateUserGameStats } from './stats';

// Referral functions
export { getReferrer, hasDailyReferral, recordReferral } from './referrals';

// Block functions
export { blockUser, getBlockStatus, getPendingFriendRequests, unblockUser } from './blocks';
