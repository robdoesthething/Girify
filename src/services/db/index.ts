/**
 * Database Module - Barrel Export
 *
 * Re-exports all database operations for backward compatibility.
 */

// Users
export {
  createUser,
  getUserByUid,
  getUserByUsername,
  searchUsers,
  updateUser,
  upsertUser,
} from './users';

// Friends
export {
  addFriendship,
  areFriends,
  createFriendRequest,
  deleteFriendRequest,
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  removeFriendship,
  updateFriendRequestStatus,
} from './friends';

// Blocks
export { blockUser, getBlockedUsers, isUserBlocked, unblockUser } from './blocks';

// Shop
export {
  addPurchasedBadge,
  createAchievement,
  createShopItem,
  deleteAchievement,
  deleteShopItem,
  getAchievementById,
  getAchievements,
  getBadgeStats,
  getShopItemById,
  getShopItems,
  getUserPurchasedBadges,
  updateAchievement,
  updateShopItem,
  upsertBadgeStats,
} from './shop';

// Quests
export {
  createQuest,
  deleteQuest,
  getActiveQuests,
  getAllQuests,
  getTodaysQuest,
  updateQuest,
} from './quests';

// Announcements
export {
  createAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  getReadAnnouncementIds,
  markAnnouncementAsRead,
  updateAnnouncement,
} from './announcements';

// Feedback
export { getApprovedFeedbackRewards, markFeedbackNotified, submitFeedback } from './feedback';

// Activity
export { createReferral, getActivityFeed, getReferralCount, publishActivity } from './activity';

// Games
export {
  getDistricts,
  getLeaderboardScores,
  getUserGameHistory,
  saveUserGame,
  updateDistrictScore,
} from './games';
