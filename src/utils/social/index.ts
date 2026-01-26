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
  deleteUserAndData,
  ensureUserProfile,
  getAllUsers,
  getUserByEmail,
  getUserByUid,
  getUserProfile,
  healMigration,
  migrateUser,
  rowToProfile,
  updateUserAsAdmin,
  updateUserProfile,
} from './profile';

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
export {
  getDistrictRankings,
  getUserGameHistory,
  updateDistrictScore,
  updateUserGameStats,
  updateUserStats,
} from './stats';

// Referral functions
export { getReferrer, hasDailyReferral, recordReferral } from './referrals';

// Block functions
export { blockUser, getBlockStatus, getPendingFriendRequests, unblockUser } from './blocks';
